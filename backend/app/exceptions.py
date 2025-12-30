"""
カスタム例外クラス
構造化されたエラーレスポンスを提供
"""

from typing import Optional, Dict, Any


class AppException(Exception):
    """アプリケーション基底例外"""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": True,
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
        }


class ValidationError(AppException):
    """バリデーションエラー"""

    def __init__(self, message: str, field: Optional[str] = None):
        details = {"field": field} if field else {}
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            details=details,
        )


class NotFoundError(AppException):
    """リソース未発見エラー"""

    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource}が見つかりません: {resource_id}",
            error_code="NOT_FOUND",
            status_code=404,
            details={"resource": resource, "id": resource_id},
        )


class ExternalServiceError(AppException):
    """外部サービス連携エラー"""

    def __init__(self, service: str, message: str, retryable: bool = True):
        super().__init__(
            message=f"{service}エラー: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            status_code=502,
            details={"service": service, "retryable": retryable},
        )


class ConfigurationError(AppException):
    """設定エラー"""

    def __init__(self, setting: str):
        super().__init__(
            message=f"設定が必要です: {setting}",
            error_code="CONFIGURATION_ERROR",
            status_code=503,
            details={"setting": setting},
        )


class AIGenerationError(AppException):
    """AI生成エラー"""

    def __init__(self, agent: str, message: str):
        super().__init__(
            message=f"AI処理エラー ({agent}): {message}",
            error_code="AI_GENERATION_ERROR",
            status_code=500,
            details={"agent": agent},
        )


class RateLimitError(AppException):
    """レート制限エラー"""

    def __init__(self, service: str, retry_after: Optional[int] = None):
        details = {"service": service}
        if retry_after:
            details["retry_after"] = retry_after
        super().__init__(
            message=f"{service}のレート制限に達しました",
            error_code="RATE_LIMIT_ERROR",
            status_code=429,
            details=details,
        )
