"""Requirement Model - 要件定義書"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Union, Any
from pydantic import BaseModel, Field


class RequirementStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    IMPLEMENTED = "implemented"
    REJECTED = "rejected"


class Requirement(BaseModel):
    id: str
    project_id: str
    issue_id: str
    title: str
    background: str
    problem_statement: str
    functional_requirements: List[Any] = []
    non_functional_requirements: List[Any] = []
    tech_approach: str
    markdown_content: str
    status: RequirementStatus = RequirementStatus.DRAFT
    github_issue_id: Optional[int] = None
    github_issue_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
