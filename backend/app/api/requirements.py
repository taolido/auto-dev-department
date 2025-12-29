"""Requirements API - 要件定義書管理"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.models.requirement import Requirement, RequirementStatus
from app.models.issue import Issue
from app.agents.pm import PMAgent
from app.services.database import db
from app.services.github_service import github_service

router = APIRouter()


class GenerateRequest(BaseModel):
    issue_ids: List[str]
    project_id: str = "default"


@router.get("/", response_model=List[Requirement])
async def list_requirements(
    project_id: str = "default",
    status: Optional[RequirementStatus] = None,
):
    """要件定義書一覧を取得"""
    reqs_data = await db.list_requirements(
        project_id=project_id,
        status=status.value if status else None,
    )
    reqs = [Requirement(**r) for r in reqs_data]
    return sorted(reqs, key=lambda x: x.created_at, reverse=True)


@router.get("/{requirement_id}", response_model=Requirement)
async def get_requirement(requirement_id: str):
    """要件定義書詳細を取得"""
    req_data = await db.get_requirement(requirement_id)
    if not req_data:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return Requirement(**req_data)


@router.post("/generate")
async def generate_requirement(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
):
    """課題から要件定義書を生成"""
    requirement_id = str(uuid.uuid4())

    # 課題情報を取得
    issues_data = []
    for issue_id in request.issue_ids:
        issue_data = await db.get_issue(issue_id)
        if issue_data:
            issues_data.append(Issue(**issue_data))

    if not issues_data:
        raise HTTPException(status_code=404, detail="No valid issues found")

    # バックグラウンドで生成処理を実行
    background_tasks.add_task(
        _run_generation,
        project_id=request.project_id,
        issues_data=issues_data,
        requirement_id=requirement_id,
    )

    return {
        "status": "processing",
        "requirement_id": requirement_id,
        "message": "要件定義書を生成中...",
    }


async def _run_generation(
    project_id: str,
    issues_data: list,
    requirement_id: str,
):
    """要件定義書生成処理"""
    pm = PMAgent()

    # 複数課題を統合
    if len(issues_data) == 1:
        issue = issues_data[0]
        title = issue.title
        description = issue.description
        context = issue.original_context
        tech_approach = issue.tech_approach
    else:
        title = f"{len(issues_data)}件の課題を解決するシステム"
        description = "\n".join([f"- {i.title}" for i in issues_data])
        context = "\n".join([i.original_context for i in issues_data if i.original_context])
        tech_approach = "\n".join([i.tech_approach for i in issues_data if i.tech_approach])

    generated = await pm.generate(
        title=title,
        description=description,
        context=context,
        tech_approach=tech_approach,
    )

    requirement = Requirement(
        id=requirement_id,
        project_id=project_id,
        issue_id=issues_data[0].id,
        **generated,
    )
    await db.create_requirement(requirement)


@router.patch("/{requirement_id}")
async def update_requirement(
    requirement_id: str,
    markdown_content: Optional[str] = None,
    status: Optional[RequirementStatus] = None,
):
    """要件定義書を更新"""
    req_data = await db.get_requirement(requirement_id)
    if not req_data:
        raise HTTPException(status_code=404, detail="Requirement not found")

    updates = {"updated_at": datetime.now()}
    if markdown_content:
        updates["markdown_content"] = markdown_content
    if status:
        updates["status"] = status.value

    updated_data = await db.update_requirement(requirement_id, updates)
    return Requirement(**updated_data)


@router.post("/{requirement_id}/approve")
async def approve_requirement(requirement_id: str):
    """要件定義書を承認"""
    req_data = await db.get_requirement(requirement_id)
    if not req_data:
        raise HTTPException(status_code=404, detail="Requirement not found")

    updated_data = await db.update_requirement(requirement_id, {
        "status": RequirementStatus.APPROVED.value,
        "updated_at": datetime.now(),
    })
    return Requirement(**updated_data)


@router.post("/{requirement_id}/create-github-issue")
async def create_github_issue(requirement_id: str):
    """GitHub Issueを作成"""
    req_data = await db.get_requirement(requirement_id)
    if not req_data:
        raise HTTPException(status_code=404, detail="Requirement not found")

    # GitHub連携が設定されていない場合
    if not github_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="GitHub連携が設定されていません。.envファイルでGITHUB_TOKENとGITHUB_REPOを設定してください。"
        )

    req = Requirement(**req_data)

    # Issue本文を作成
    body = f"""## 要件定義書

{req.markdown_content}

---

### メタ情報
- 要件ID: `{req.id}`
- 作成日: {req.created_at.strftime('%Y-%m-%d %H:%M')}
- ステータス: {req.status}

> この Issue は Auto-Dev Department によって自動生成されました。
"""

    try:
        result = github_service.create_issue(
            title=req.title,
            body=body,
            labels=["auto-dev", "requirement"],
        )

        # 要件定義にGitHub Issue URLを保存
        await db.update_requirement(requirement_id, {
            "github_issue_id": result["issue_number"],
            "github_issue_url": result["issue_url"],
            "updated_at": datetime.now(),
        })

        return {
            "status": "created",
            "github_issue_url": result["issue_url"],
            "github_issue_number": result["issue_number"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{requirement_id}")
async def delete_requirement(requirement_id: str):
    """要件定義書を削除"""
    req_data = await db.get_requirement(requirement_id)
    if not req_data:
        raise HTTPException(status_code=404, detail="Requirement not found")

    await db.delete_requirement(requirement_id)
    return {"status": "deleted", "id": requirement_id}
