"""
GitHub Service - GitHub API連携
リポジトリ操作、Issue作成、PR作成を行う
"""

import os
from typing import Optional, List, Dict, Any
from github import Github, GithubException
from datetime import datetime


class GitHubService:
    """GitHub API サービス"""

    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        self.repo_name = os.getenv("GITHUB_REPO")
        self._github: Optional[Github] = None
        self._repo = None

    @property
    def github(self) -> Github:
        if self._github is None:
            if not self.token or self.token == "your_github_token_here":
                raise ValueError("GITHUB_TOKEN is not configured")
            self._github = Github(self.token)
        return self._github

    @property
    def repo(self):
        if self._repo is None:
            if not self.repo_name or self.repo_name == "your_username/your_repo":
                raise ValueError("GITHUB_REPO is not configured")
            self._repo = self.github.get_repo(self.repo_name)
        return self._repo

    def is_configured(self) -> bool:
        """GitHub連携が設定されているか確認"""
        return (
            self.token is not None
            and self.token != "your_github_token_here"
            and self.repo_name is not None
            and self.repo_name != "your_username/your_repo"
        )

    def create_issue(
        self,
        title: str,
        body: str,
        labels: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        GitHub Issueを作成

        Returns:
            {"issue_number": int, "issue_url": str}
        """
        try:
            issue = self.repo.create_issue(
                title=title,
                body=body,
                labels=labels or [],
            )
            return {
                "issue_number": issue.number,
                "issue_url": issue.html_url,
            }
        except GithubException as e:
            raise Exception(f"GitHub Issue作成エラー: {e.data.get('message', str(e))}")

    def create_branch(self, branch_name: str, base_branch: str = "main") -> str:
        """
        新しいブランチを作成

        Returns:
            ブランチ名
        """
        try:
            # ベースブランチの最新コミットを取得
            base_ref = self.repo.get_git_ref(f"heads/{base_branch}")
            base_sha = base_ref.object.sha

            # 新しいブランチを作成
            self.repo.create_git_ref(
                ref=f"refs/heads/{branch_name}",
                sha=base_sha,
            )
            return branch_name
        except GithubException as e:
            if e.status == 422:  # Already exists
                return branch_name
            raise Exception(f"ブランチ作成エラー: {e.data.get('message', str(e))}")

    def create_or_update_file(
        self,
        path: str,
        content: str,
        message: str,
        branch: str,
    ) -> str:
        """
        ファイルを作成または更新

        Returns:
            コミットSHA
        """
        try:
            # 既存ファイルがあるか確認
            try:
                existing = self.repo.get_contents(path, ref=branch)
                result = self.repo.update_file(
                    path=path,
                    message=message,
                    content=content,
                    sha=existing.sha,
                    branch=branch,
                )
            except GithubException:
                # ファイルが存在しない場合は新規作成
                result = self.repo.create_file(
                    path=path,
                    message=message,
                    content=content,
                    branch=branch,
                )
            return result["commit"].sha
        except GithubException as e:
            raise Exception(f"ファイル作成エラー: {e.data.get('message', str(e))}")

    def create_pull_request(
        self,
        title: str,
        body: str,
        head_branch: str,
        base_branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Pull Requestを作成

        Returns:
            {"pr_number": int, "pr_url": str}
        """
        try:
            pr = self.repo.create_pull(
                title=title,
                body=body,
                head=head_branch,
                base=base_branch,
            )
            return {
                "pr_number": pr.number,
                "pr_url": pr.html_url,
            }
        except GithubException as e:
            raise Exception(f"PR作成エラー: {e.data.get('message', str(e))}")

    def push_generated_code(
        self,
        files: List[Dict[str, str]],
        branch_name: str,
        commit_message: str,
        base_branch: str = "main",
    ) -> Dict[str, Any]:
        """
        生成されたコードをプッシュ

        Args:
            files: [{"path": "...", "content": "..."}]
            branch_name: 作成するブランチ名
            commit_message: コミットメッセージ
            base_branch: ベースブランチ

        Returns:
            {"branch": str, "commits": int}
        """
        # ブランチ作成
        self.create_branch(branch_name, base_branch)

        # ファイルをプッシュ
        commits = 0
        for file in files:
            self.create_or_update_file(
                path=file["path"],
                content=file["content"],
                message=f"{commit_message}: {file['path']}",
                branch=branch_name,
            )
            commits += 1

        return {
            "branch": branch_name,
            "commits": commits,
        }


# シングルトンインスタンス
github_service = GitHubService()
