"""Issues API - 課題管理"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.models.issue import Issue, IssueStatus, PainLevel
from app.agents.extractor import ExtractorAgent
from app.services.database import db

router = APIRouter()


class ExtractRequest(BaseModel):
    source_id: str
    content: str
    project_id: str = "default"


@router.get("/", response_model=List[Issue])
async def list_issues(
    project_id: str = "default",
    source_id: Optional[str] = None,
    status: Optional[IssueStatus] = None,
    pain_level: Optional[PainLevel] = None,
):
    """課題一覧を取得"""
    issues_data = await db.list_issues(
        project_id=project_id,
        source_id=source_id,
        status=status.value if status else None,
        pain_level=pain_level.value if pain_level else None,
    )
    issues = [Issue(**i) for i in issues_data]
    return sorted(issues, key=lambda x: x.extracted_at, reverse=True)


@router.get("/{issue_id}", response_model=Issue)
async def get_issue(issue_id: str):
    """課題詳細を取得"""
    issue_data = await db.get_issue(issue_id)
    if not issue_data:
        raise HTTPException(status_code=404, detail="Issue not found")
    return Issue(**issue_data)


@router.post("/extract")
async def extract_issues(
    request: ExtractRequest,
    background_tasks: BackgroundTasks,
):
    """会話ログから課題を抽出"""
    batch_id = str(uuid.uuid4())

    # バックグラウンドで抽出処理を実行
    background_tasks.add_task(
        _run_extraction,
        project_id=request.project_id,
        source_id=request.source_id,
        content=request.content,
        batch_id=batch_id,
    )

    return {
        "status": "processing",
        "batch_id": batch_id,
        "message": "課題抽出を開始しました",
    }


async def _run_extraction(
    project_id: str,
    source_id: str,
    content: str,
    batch_id: str,
):
    """抽出処理の実行"""
    extractor = ExtractorAgent()
    extracted = await extractor.extract(content)

    for item in extracted:
        issue = Issue(
            id=str(uuid.uuid4()),
            project_id=project_id,
            source_id=source_id,
            source_type="uploaded_file",
            source_label="Uploaded",
            title=item.title,
            description=item.title,
            category=item.category,
            pain_level=item.pain_level,
            original_context=item.context,
            tech_approach=item.tech_approach,
            expected_outcome=item.expected_outcome,
            extraction_batch_id=batch_id,
            extracted_at=datetime.now(),
        )
        await db.create_issue(issue)


@router.patch("/{issue_id}/status")
async def update_issue_status(issue_id: str, status: IssueStatus):
    """課題ステータスを更新"""
    issue_data = await db.get_issue(issue_id)
    if not issue_data:
        raise HTTPException(status_code=404, detail="Issue not found")

    updated_data = await db.update_issue(issue_id, {
        "status": status.value,
        "updated_at": datetime.now(),
    })
    return Issue(**updated_data)


@router.post("/{issue_id}/select")
async def select_issue(issue_id: str):
    """課題を選択（要件定義生成へ進む）"""
    issue_data = await db.get_issue(issue_id)
    if not issue_data:
        raise HTTPException(status_code=404, detail="Issue not found")

    updated_data = await db.update_issue(issue_id, {
        "status": IssueStatus.SELECTED.value,
        "updated_at": datetime.now(),
    })
    return Issue(**updated_data)


@router.delete("/{issue_id}")
async def delete_issue(issue_id: str):
    """課題を削除"""
    issue_data = await db.get_issue(issue_id)
    if not issue_data:
        raise HTTPException(status_code=404, detail="Issue not found")

    await db.delete_issue(issue_id)
    return {"status": "deleted", "id": issue_id}
