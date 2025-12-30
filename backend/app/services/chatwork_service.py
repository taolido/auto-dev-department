"""
Chatwork Service - Chatwork API連携
ルームからメッセージを取得する
"""

import os
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.exceptions import ExternalServiceError, ConfigurationError, RateLimitError


class ChatworkService:
    """Chatwork API サービス"""

    BASE_URL = "https://api.chatwork.com/v2"

    def __init__(self):
        self.token = os.getenv("CHATWORK_API_TOKEN")

    def is_configured(self) -> bool:
        """Chatwork連携が設定されているか確認"""
        return (
            self.token is not None
            and self.token != "your_chatwork_api_token_here"
            and self.token != ""
        )

    def _headers(self) -> Dict[str, str]:
        """APIリクエスト用ヘッダー"""
        return {
            "X-ChatWorkToken": self.token or "",
            "Accept": "application/json",
        }

    async def get_rooms(self) -> List[Dict[str, Any]]:
        """
        参加中のルーム一覧を取得

        Returns:
            List of room objects
        """
        if not self.is_configured():
            raise ConfigurationError("CHATWORK_API_TOKEN")

        return await self._request_with_retry("GET", "/rooms")

    async def _request_with_retry(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        max_retries: int = 3,
    ) -> Any:
        """リトライ付きHTTPリクエスト"""
        last_error = None

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.request(
                        method,
                        f"{self.BASE_URL}{endpoint}",
                        headers=self._headers(),
                        params=params,
                    )

                    # レート制限チェック
                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 60))
                        raise RateLimitError("Chatwork", retry_after)

                    # 204 No Content
                    if response.status_code == 204:
                        return []

                    response.raise_for_status()
                    return response.json()

            except httpx.TimeoutException:
                last_error = ExternalServiceError(
                    "Chatwork", "リクエストがタイムアウトしました", retryable=True
                )
            except httpx.ConnectError:
                last_error = ExternalServiceError(
                    "Chatwork", "接続できませんでした", retryable=True
                )
            except httpx.HTTPStatusError as e:
                if e.response.status_code >= 500:
                    last_error = ExternalServiceError(
                        "Chatwork", f"サーバーエラー ({e.response.status_code})", retryable=True
                    )
                else:
                    raise ExternalServiceError(
                        "Chatwork", f"APIエラー ({e.response.status_code})", retryable=False
                    )
            except RateLimitError:
                raise

            # リトライ前に待機
            if attempt < max_retries - 1:
                import asyncio
                await asyncio.sleep(2 ** attempt)

        if last_error:
            raise last_error
        raise ExternalServiceError("Chatwork", "不明なエラー", retryable=False)

    async def get_room_info(self, room_id: str) -> Dict[str, Any]:
        """
        ルーム情報を取得

        Args:
            room_id: ルームID

        Returns:
            Room info object
        """
        if not self.is_configured():
            raise ConfigurationError("CHATWORK_API_TOKEN")

        return await self._request_with_retry("GET", f"/rooms/{room_id}")

    async def get_messages(
        self,
        room_id: str,
        force: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        ルームのメッセージを取得

        Args:
            room_id: ルームID
            force: 最新100件を強制取得（デフォルトは未読のみ）

        Returns:
            List of message objects
        """
        if not self.is_configured():
            raise ConfigurationError("CHATWORK_API_TOKEN")

        params = {"force": 1 if force else 0}
        return await self._request_with_retry("GET", f"/rooms/{room_id}/messages", params)

    def format_messages_for_extraction(
        self,
        messages: List[Dict[str, Any]],
    ) -> str:
        """
        メッセージを課題抽出用のテキストに整形

        Args:
            messages: Chatwork API から取得したメッセージリスト

        Returns:
            整形されたテキスト
        """
        lines = []
        for msg in messages:
            # タイムスタンプを変換
            timestamp = datetime.fromtimestamp(msg.get("send_time", 0))
            date_str = timestamp.strftime("%Y-%m-%d %H:%M")

            # アカウント情報
            account = msg.get("account", {})
            name = account.get("name", "Unknown")

            # メッセージ本文
            body = msg.get("body", "")

            lines.append(f"[{date_str}] {name}:")
            lines.append(body)
            lines.append("")

        return "\n".join(lines)


# シングルトンインスタンス
chatwork_service = ChatworkService()
