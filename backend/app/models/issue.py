"""Issue Model - 課題管理"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class PainLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IssueStatus(str, Enum):
    NEW = "new"
    SELECTED = "selected"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    ARCHIVED = "archived"


class Issue(BaseModel):
    id: str
    project_id: str
    source_id: str
    source_type: str
    source_label: str
    title: str
    description: str
    category: str
    pain_level: PainLevel
    original_context: str
    tech_approach: str
    expected_outcome: str
    status: IssueStatus = IssueStatus.NEW
    requirement_id: Optional[str] = None
    github_issue_url: Optional[str] = None
    extraction_batch_id: str
    extracted_at: datetime = Field(default_factory=datetime.now)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class IssueExtracted(BaseModel):
    """Extractor Agentが出力する形式"""
    title: str
    category: str
    pain_level: PainLevel
    context: str
    tech_approach: str
    expected_outcome: str
