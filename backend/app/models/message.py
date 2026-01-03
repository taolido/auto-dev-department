"""Message Model - Chatworkメッセージ永続化"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatworkMessage(BaseModel):
    """Chatworkから取得したメッセージ"""
    id: str  # Chatwork message_id
    source_id: str  # 紐づくSourceのID
    room_id: str  # Chatwork room_id

    # メッセージ内容
    body: str

    # 送信者情報
    account_id: str
    account_name: str

    # 時刻
    send_time: datetime  # Chatworkのsend_time（UNIX timestamp から変換）

    # メタデータ
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SyncStatus(BaseModel):
    """同期状態を管理"""
    source_id: str
    room_id: str
    last_message_id: Optional[str] = None  # 最後に取得したメッセージID
    last_sync_at: Optional[datetime] = None
    total_messages: int = 0
    is_syncing: bool = False
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
