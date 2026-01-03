"""
Polling Service - Chatworkメッセージ自動取得
登録された全ルームから定期的にメッセージを取得し、Firestoreに蓄積する
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from app.models.source import Source, SourceType
from app.models.message import ChatworkMessage, SyncStatus
from app.services.database import db
from app.services.chatwork_service import chatwork_service

logger = logging.getLogger(__name__)


class PollingService:
    """Chatworkメッセージ自動取得サービス"""

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._interval_seconds = 60  # デフォルト: 1分間隔
        self._last_poll_at: Optional[datetime] = None
        self._poll_count = 0
        self._error_count = 0

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def status(self) -> dict:
        """現在のPolling状態を取得"""
        return {
            "is_running": self._running,
            "interval_seconds": self._interval_seconds,
            "last_poll_at": self._last_poll_at.isoformat() if self._last_poll_at else None,
            "poll_count": self._poll_count,
            "error_count": self._error_count,
        }

    def set_interval(self, seconds: int):
        """Polling間隔を設定（最小30秒）"""
        self._interval_seconds = max(30, seconds)
        logger.info(f"Polling interval set to {self._interval_seconds} seconds")

    async def start(self):
        """Pollingを開始"""
        if self._running:
            logger.warning("Polling is already running")
            return

        if not chatwork_service.is_configured():
            logger.error("Chatwork API is not configured")
            raise ValueError("Chatwork連携が設定されていません")

        self._running = True
        self._task = asyncio.create_task(self._polling_loop())
        logger.info("Polling service started")

    async def stop(self):
        """Pollingを停止"""
        if not self._running:
            return

        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Polling service stopped")

    async def _polling_loop(self):
        """メインのPollingループ"""
        while self._running:
            try:
                await self._poll_all_sources()
                self._poll_count += 1
                self._last_poll_at = datetime.now()
            except Exception as e:
                self._error_count += 1
                logger.error(f"Polling error: {e}")

            # 次のPollまで待機
            await asyncio.sleep(self._interval_seconds)

    async def _poll_all_sources(self):
        """全ての登録済みChatworkルームからメッセージを取得"""
        # Chatworkタイプのソースを全て取得
        all_sources = await db.list_sources(project_id="default")

        chatwork_sources = [
            Source(**s) for s in all_sources
            if s.get("type") == SourceType.CHATWORK_ROOM.value
        ]

        if not chatwork_sources:
            logger.debug("No Chatwork sources registered")
            return

        logger.info(f"Polling {len(chatwork_sources)} Chatwork rooms")

        for source in chatwork_sources:
            try:
                await self._sync_source(source)
            except Exception as e:
                logger.error(f"Failed to sync source {source.id}: {e}")
                # エラーを記録して続行
                await db.update_sync_status(source.id, {
                    "error": str(e),
                    "updated_at": datetime.now(),
                })

    async def _sync_source(self, source: Source):
        """個別ソースの同期"""
        if not source.chatwork:
            return

        room_id = source.chatwork.get("room_id") if isinstance(source.chatwork, dict) else source.chatwork.room_id

        # 同期中フラグを設定
        await db.update_sync_status(source.id, {
            "source_id": source.id,
            "room_id": room_id,
            "is_syncing": True,
            "updated_at": datetime.now(),
        })

        try:
            # Chatwork APIからメッセージ取得（force=Trueで最新100件）
            raw_messages = await chatwork_service.get_messages(room_id, force=True)

            if not raw_messages:
                logger.debug(f"No messages from room {room_id}")
                return

            # メッセージをモデルに変換
            messages = []
            for msg in raw_messages:
                account = msg.get("account", {})
                message = ChatworkMessage(
                    id=str(msg.get("message_id")),
                    source_id=source.id,
                    room_id=room_id,
                    body=msg.get("body", ""),
                    account_id=str(account.get("account_id", "")),
                    account_name=account.get("name", "Unknown"),
                    send_time=datetime.fromtimestamp(msg.get("send_time", 0)),
                )
                messages.append(message)

            # バッチ保存（重複排除込み）
            saved_count = await db.save_messages_batch(messages)

            # 統計更新
            total_messages = await db.get_message_count_by_source(source.id)
            latest_message_id = await db.get_latest_message_id(source.id)

            # 同期状態を更新
            await db.update_sync_status(source.id, {
                "source_id": source.id,
                "room_id": room_id,
                "last_message_id": latest_message_id,
                "last_sync_at": datetime.now(),
                "total_messages": total_messages,
                "is_syncing": False,
                "error": None,
                "updated_at": datetime.now(),
            })

            # Sourceのメッセージ数も更新
            await db.update_source(source.id, {
                "message_count": total_messages,
                "last_sync_at": datetime.now(),
                "updated_at": datetime.now(),
            })

            logger.info(f"Synced room {room_id}: {saved_count} new messages (total: {total_messages})")

        except Exception as e:
            # エラー時は同期中フラグを解除
            await db.update_sync_status(source.id, {
                "is_syncing": False,
                "error": str(e),
                "updated_at": datetime.now(),
            })
            raise

    async def sync_now(self, source_id: Optional[str] = None):
        """手動で即時同期を実行"""
        if source_id:
            # 特定のソースのみ
            source_data = await db.get_source(source_id)
            if source_data:
                source = Source(**source_data)
                await self._sync_source(source)
        else:
            # 全ソース
            await self._poll_all_sources()


# シングルトンインスタンス
polling_service = PollingService()
