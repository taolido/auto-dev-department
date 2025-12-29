"""
Chatwork Service - Chatwork API連携
ルームからメッセージを取得する
"""

import os
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime


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
            raise ValueError("Chatwork API token is not configured")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/rooms",
                headers=self._headers(),
            )
            response.raise_for_status()
            return response.json()

    async def get_room_info(self, room_id: str) -> Dict[str, Any]:
        """
        ルーム情報を取得

        Args:
            room_id: ルームID

        Returns:
            Room info object
        """
        if not self.is_configured():
            raise ValueError("Chatwork API token is not configured")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/rooms/{room_id}",
                headers=self._headers(),
            )
            response.raise_for_status()
            return response.json()

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
            raise ValueError("Chatwork API token is not configured")

        params = {"force": 1 if force else 0}

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/rooms/{room_id}/messages",
                headers=self._headers(),
                params=params,
            )
            response.raise_for_status()
            # 空の場合は204が返る
            if response.status_code == 204:
                return []
            return response.json()

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
