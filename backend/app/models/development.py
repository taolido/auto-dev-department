"""Development Model - 開発進捗管理"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class DevelopmentStatus(str, Enum):
    DESIGNING = "designing"
    CODING = "coding"
    TESTING = "testing"
    REVIEW = "review"
    MERGED = "merged"
    FAILED = "failed"


class AgentLogEntry(BaseModel):
    timestamp: datetime
    agent: str  # extractor | pm | tech_lead | coder | tester
    message: str
    level: str = "info"  # info | warning | error


class GeneratedFile(BaseModel):
    path: str
    content: str
    language: str


class Development(BaseModel):
    id: str
    project_id: str
    requirement_id: str
    status: DevelopmentStatus = DevelopmentStatus.DESIGNING
    design_doc: Optional[str] = None
    generated_files: List[GeneratedFile] = []
    test_results: Optional[str] = None
    error_count: int = 0
    retry_count: int = 0
    max_retries: int = 3
    github_branch: Optional[str] = None
    github_pr_id: Optional[int] = None
    github_pr_url: Optional[str] = None
    agent_logs: List[AgentLogEntry] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
