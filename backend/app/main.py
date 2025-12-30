"""
Auto-Dev Department - Backend API
日常会話からソフトウェアを自動開発するマルチエージェントシステム
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import traceback

from app.api import sources, issues, requirements, developments, projects
from app.services.database import db
from app.exceptions import AppException


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Auto-Dev Department Backend starting...")

    # Firestore接続確認
    try:
        # 接続テスト
        _ = db.db.collection('_health').document('check').get()
        print("Firestore connected successfully")
    except Exception as e:
        print(f"Firestore connection warning: {e}")
        print("Continuing with Firestore (may use emulator)...")

    yield
    # Shutdown
    print("Auto-Dev Department Backend shutting down...")


app = FastAPI(
    title="Auto-Dev Department API",
    description="日常会話からソフトウェアを自動開発するマルチエージェントシステム",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:3005",  # Next.js dev (alt port)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3005",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# グローバル例外ハンドラー
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """アプリケーション例外をJSON形式で返す"""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """予期しない例外をキャッチしてログ出力"""
    print(f"Unhandled exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "error_code": "INTERNAL_ERROR",
            "message": "サーバー内部エラーが発生しました",
            "details": {"type": type(exc).__name__},
        },
    )


# ルーター登録
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(sources.router, prefix="/api/sources", tags=["Sources"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issues"])
app.include_router(requirements.router, prefix="/api/requirements", tags=["Requirements"])
app.include_router(developments.router, prefix="/api/developments", tags=["Developments"])


@app.get("/")
async def root():
    return {
        "name": "Auto-Dev Department API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
