"""Source Model - データソース管理"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    CHATWORK_ROOM = "chatwork_room"
    CHATWORK_DM = "chatwork_dm"
    UPLOADED_FILE = "uploaded_file"
    MANUAL_INPUT = "manual_input"


class ChatworkInfo(BaseModel):
    room_id: str
    room_name: str
    room_type: str = "group"  # group | direct | my


class FileInfo(BaseModel):
    file_name: str
    file_type: str  # txt | csv | json
    file_size: int


class DateRange(BaseModel):
    from_date: datetime
    to_date: datetime


class Source(BaseModel):
    id: str
    project_id: str
    type: SourceType
    chatwork: Optional[ChatworkInfo] = None
    file: Optional[FileInfo] = None
    label: str
    color: str = "#3B82F6"  # デフォルト青
    last_sync_at: Optional[datetime] = None
    message_count: int = 0
    date_range: Optional[DateRange] = None
    issue_count: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class SourceCreate(BaseModel):
    type: SourceType
    label: str
    chatwork: Optional[ChatworkInfo] = None
    file: Optional[FileInfo] = None
    color: str = "#3B82F6"
