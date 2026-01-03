"""
Firestore Database Service
データ永続化レイヤー
"""

import os
from typing import Optional, List, Dict, Any, TypeVar, Type
from datetime import datetime
from google.cloud import firestore
from pydantic import BaseModel

# Generic type for models
T = TypeVar('T', bound=BaseModel)


class FirestoreDB:
    """Firestore データベースサービス"""

    _instance: Optional['FirestoreDB'] = None
    _db: Optional[firestore.Client] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def db(self) -> firestore.Client:
        if self._db is None:
            # Emulator使用時は環境変数で自動接続
            project = os.getenv('GOOGLE_CLOUD_PROJECT', 'auto-dev-department')
            self._db = firestore.Client(project=project)
        return self._db

    # ========== Generic CRUD Operations ==========

    def _serialize(self, obj: BaseModel) -> Dict[str, Any]:
        """Pydanticモデルを Firestore用dictに変換"""
        data = obj.model_dump()
        # datetime を Firestore timestamp に変換
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value
            elif isinstance(value, dict):
                # ネストされた dict も処理
                for k, v in value.items():
                    if isinstance(v, datetime):
                        value[k] = v
        return data

    def _deserialize(self, doc_data: Dict[str, Any], model_class: Type[T]) -> T:
        """Firestoreデータを Pydanticモデルに変換"""
        # Firestore timestamp を datetime に変換
        for key, value in doc_data.items():
            if hasattr(value, 'timestamp'):  # Firestore DatetimeWithNanoseconds
                doc_data[key] = value.replace(tzinfo=None)
            elif isinstance(value, dict):
                for k, v in value.items():
                    if hasattr(v, 'timestamp'):
                        value[k] = v.replace(tzinfo=None)
        return model_class(**doc_data)

    # ========== Projects Collection ==========

    def get_projects_collection(self):
        return self.db.collection('projects')

    async def create_project(self, project: BaseModel) -> BaseModel:
        """プロジェクトを作成"""
        data = self._serialize(project)
        self.get_projects_collection().document(project.id).set(data)
        return project

    async def get_project(self, project_id: str) -> Optional[Dict]:
        """プロジェクトを取得"""
        doc = self.get_projects_collection().document(project_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def list_projects(self) -> List[Dict]:
        """プロジェクト一覧を取得"""
        docs = self.get_projects_collection().order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]

    async def update_project(self, project_id: str, updates: Dict[str, Any]) -> Optional[Dict]:
        """プロジェクトを更新"""
        doc_ref = self.get_projects_collection().document(project_id)
        doc_ref.update(updates)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def delete_project(self, project_id: str) -> bool:
        """プロジェクトを削除"""
        self.get_projects_collection().document(project_id).delete()
        return True

    async def update_source(self, source_id: str, updates: Dict[str, Any]) -> Optional[Dict]:
        """ソースを更新"""
        doc_ref = self.get_sources_collection().document(source_id)
        doc_ref.update(updates)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

    # ========== Sources Collection ==========

    def get_sources_collection(self):
        return self.db.collection('sources')

    async def create_source(self, source: BaseModel) -> BaseModel:
        """ソースを作成"""
        data = self._serialize(source)
        self.get_sources_collection().document(source.id).set(data)
        return source

    async def get_source(self, source_id: str) -> Optional[Dict]:
        """ソースを取得"""
        doc = self.get_sources_collection().document(source_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def list_sources(self, project_id: str = "default") -> List[Dict]:
        """ソース一覧を取得"""
        docs = self.get_sources_collection().where('project_id', '==', project_id).stream()
        return [doc.to_dict() for doc in docs]

    async def delete_source(self, source_id: str) -> bool:
        """ソースを削除"""
        self.get_sources_collection().document(source_id).delete()
        return True

    # ========== Issues Collection ==========

    def get_issues_collection(self):
        return self.db.collection('issues')

    async def create_issue(self, issue: BaseModel) -> BaseModel:
        """課題を作成"""
        data = self._serialize(issue)
        self.get_issues_collection().document(issue.id).set(data)
        return issue

    async def get_issue(self, issue_id: str) -> Optional[Dict]:
        """課題を取得"""
        doc = self.get_issues_collection().document(issue_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def list_issues(
        self,
        project_id: str = "default",
        source_id: Optional[str] = None,
        status: Optional[str] = None,
        pain_level: Optional[str] = None,
    ) -> List[Dict]:
        """課題一覧を取得"""
        query = self.get_issues_collection().where('project_id', '==', project_id)

        if source_id:
            query = query.where('source_id', '==', source_id)
        if status:
            query = query.where('status', '==', status)
        if pain_level:
            query = query.where('pain_level', '==', pain_level)

        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    async def update_issue(self, issue_id: str, updates: Dict[str, Any]) -> Optional[Dict]:
        """課題を更新"""
        doc_ref = self.get_issues_collection().document(issue_id)
        doc_ref.update(updates)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def delete_issue(self, issue_id: str) -> bool:
        """課題を削除"""
        self.get_issues_collection().document(issue_id).delete()
        return True

    # ========== Requirements Collection ==========

    def get_requirements_collection(self):
        return self.db.collection('requirements')

    async def create_requirement(self, requirement: BaseModel) -> BaseModel:
        """要件定義書を作成"""
        data = self._serialize(requirement)
        self.get_requirements_collection().document(requirement.id).set(data)
        return requirement

    async def get_requirement(self, requirement_id: str) -> Optional[Dict]:
        """要件定義書を取得"""
        doc = self.get_requirements_collection().document(requirement_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def list_requirements(
        self,
        project_id: str = "default",
        status: Optional[str] = None,
    ) -> List[Dict]:
        """要件定義書一覧を取得"""
        query = self.get_requirements_collection().where('project_id', '==', project_id)

        if status:
            query = query.where('status', '==', status)

        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    async def update_requirement(self, requirement_id: str, updates: Dict[str, Any]) -> Optional[Dict]:
        """要件定義書を更新"""
        doc_ref = self.get_requirements_collection().document(requirement_id)
        doc_ref.update(updates)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def delete_requirement(self, requirement_id: str) -> bool:
        """要件定義書を削除"""
        self.get_requirements_collection().document(requirement_id).delete()
        return True

    # ========== Developments Collection ==========

    def get_developments_collection(self):
        return self.db.collection('developments')

    async def create_development(self, development: BaseModel) -> BaseModel:
        """開発タスクを作成"""
        data = self._serialize(development)
        self.get_developments_collection().document(development.id).set(data)
        return development

    async def get_development(self, development_id: str) -> Optional[Dict]:
        """開発タスクを取得"""
        doc = self.get_developments_collection().document(development_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def list_developments(
        self,
        project_id: str = "default",
        status: Optional[str] = None,
    ) -> List[Dict]:
        """開発タスク一覧を取得"""
        query = self.get_developments_collection().where('project_id', '==', project_id)

        if status:
            query = query.where('status', '==', status)

        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    async def update_development(self, development_id: str, updates: Dict[str, Any]) -> Optional[Dict]:
        """開発タスクを更新"""
        doc_ref = self.get_developments_collection().document(development_id)
        doc_ref.update(updates)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None


    # ========== Messages Collection ==========

    def get_messages_collection(self):
        return self.db.collection('messages')

    async def save_message(self, message: BaseModel) -> BaseModel:
        """メッセージを保存（重複チェック付き）"""
        # message.id は Chatwork の message_id を使用
        doc_ref = self.get_messages_collection().document(message.id)
        doc = doc_ref.get()

        # 既存なら何もしない（重複排除）
        if doc.exists:
            return message

        data = self._serialize(message)
        doc_ref.set(data)
        return message

    async def save_messages_batch(self, messages: List[BaseModel]) -> int:
        """メッセージを一括保存（重複排除）"""
        batch = self.db.batch()
        saved_count = 0

        for message in messages:
            doc_ref = self.get_messages_collection().document(message.id)
            doc = doc_ref.get()

            if not doc.exists:
                data = self._serialize(message)
                batch.set(doc_ref, data)
                saved_count += 1

        if saved_count > 0:
            batch.commit()

        return saved_count

    async def get_messages_by_source(
        self,
        source_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict]:
        """ソース別メッセージを取得（新しい順）"""
        query = (
            self.get_messages_collection()
            .where('source_id', '==', source_id)
            .order_by('send_time', direction=firestore.Query.DESCENDING)
            .limit(limit)
            .offset(offset)
        )
        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    async def get_messages_by_room(
        self,
        room_id: str,
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict]:
        """ルーム別メッセージを取得"""
        query = self.get_messages_collection().where('room_id', '==', room_id)

        if since:
            query = query.where('send_time', '>', since)

        query = query.order_by('send_time', direction=firestore.Query.DESCENDING).limit(limit)
        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    async def get_message_count_by_source(self, source_id: str) -> int:
        """ソース別メッセージ数を取得"""
        docs = self.get_messages_collection().where('source_id', '==', source_id).stream()
        return sum(1 for _ in docs)

    async def get_latest_message_id(self, source_id: str) -> Optional[str]:
        """ソースの最新メッセージIDを取得"""
        query = (
            self.get_messages_collection()
            .where('source_id', '==', source_id)
            .order_by('send_time', direction=firestore.Query.DESCENDING)
            .limit(1)
        )
        docs = list(query.stream())
        if docs:
            return docs[0].to_dict().get('id')
        return None

    # ========== Sync Status Collection ==========

    def get_sync_status_collection(self):
        return self.db.collection('sync_status')

    async def get_sync_status(self, source_id: str) -> Optional[Dict]:
        """同期状態を取得"""
        doc = self.get_sync_status_collection().document(source_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    async def update_sync_status(self, source_id: str, updates: Dict[str, Any]) -> Dict:
        """同期状態を更新"""
        doc_ref = self.get_sync_status_collection().document(source_id)
        doc = doc_ref.get()

        if doc.exists:
            doc_ref.update(updates)
        else:
            doc_ref.set(updates)

        return doc_ref.get().to_dict()


# シングルトンインスタンス
db = FirestoreDB()
