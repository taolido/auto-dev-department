"""Project Model - プロジェクト管理"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Project(BaseModel):
    """プロジェクト"""
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    """プロジェクト作成リクエスト"""
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    """プロジェクト更新リクエスト"""
    name: Optional[str] = None
    description: Optional[str] = None
