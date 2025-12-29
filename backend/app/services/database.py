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


# シングルトンインスタンス
db = FirestoreDB()
