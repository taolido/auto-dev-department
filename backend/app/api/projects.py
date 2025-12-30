"""Projects API - プロジェクト管理"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.services.database import db

router = APIRouter()


@router.get("/", response_model=List[Project])
async def list_projects():
    """プロジェクト一覧を取得"""
    projects_data = await db.list_projects()

    # デフォルトプロジェクトがなければ作成
    if not projects_data:
        default_project = Project(
            id="default",
            name="デフォルトプロジェクト",
            description="自動作成されたデフォルトプロジェクト",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        await db.create_project(default_project)
        projects_data = [default_project.model_dump()]

    return [Project(**p) for p in projects_data]


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """プロジェクト詳細を取得"""
    project_data = await db.get_project(project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**project_data)


@router.post("/", response_model=Project)
async def create_project(request: ProjectCreate):
    """プロジェクトを作成"""
    project = Project(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    await db.create_project(project)
    return project


@router.patch("/{project_id}", response_model=Project)
async def update_project(project_id: str, request: ProjectUpdate):
    """プロジェクトを更新"""
    project_data = await db.get_project(project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = {"updated_at": datetime.now()}
    if request.name is not None:
        updates["name"] = request.name
    if request.description is not None:
        updates["description"] = request.description

    updated_data = await db.update_project(project_id, updates)
    return Project(**updated_data)


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """プロジェクトを削除"""
    if project_id == "default":
        raise HTTPException(status_code=400, detail="デフォルトプロジェクトは削除できません")

    project_data = await db.get_project(project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete_project(project_id)
    return {"status": "deleted", "id": project_id}
