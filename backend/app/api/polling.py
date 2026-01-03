"""Polling API - メッセージ自動取得の制御"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.services.polling_service import polling_service
from app.services.chatwork_service import chatwork_service
from app.services.database import db

router = APIRouter()


class PollingConfigRequest(BaseModel):
    interval_seconds: int = 60


class SyncRequest(BaseModel):
    source_id: Optional[str] = None


@router.get("/status")
async def get_polling_status():
    """Polling状態を取得"""
    return {
        "chatwork_configured": chatwork_service.is_configured(),
        "polling": polling_service.status,
    }


@router.post("/start")
async def start_polling():
    """Pollingを開始"""
    if not chatwork_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Chatwork連携が設定されていません。.envファイルでCHATWORK_API_TOKENを設定してください。"
        )

    if polling_service.is_running:
        return {"message": "Polling is already running", "status": polling_service.status}

    try:
        await polling_service.start()
        return {"message": "Polling started", "status": polling_service.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_polling():
    """Pollingを停止"""
    if not polling_service.is_running:
        return {"message": "Polling is not running", "status": polling_service.status}

    await polling_service.stop()
    return {"message": "Polling stopped", "status": polling_service.status}


@router.post("/config")
async def configure_polling(config: PollingConfigRequest):
    """Polling設定を変更"""
    polling_service.set_interval(config.interval_seconds)
    return {
        "message": f"Polling interval set to {config.interval_seconds} seconds",
        "status": polling_service.status,
    }


@router.post("/sync")
async def sync_now(request: SyncRequest = None):
    """即時同期を実行（Pollingが停止中でも実行可能）"""
    if not chatwork_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Chatwork連携が設定されていません"
        )

    source_id = request.source_id if request else None

    try:
        await polling_service.sync_now(source_id)
        return {
            "message": "Sync completed",
            "source_id": source_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sync-status")
async def get_all_sync_status():
    """全ソースの同期状態を取得"""
    # 全Chatworkソースを取得
    sources = await db.list_sources(project_id="default")
    chatwork_sources = [s for s in sources if s.get("type") == "chatwork_room"]

    result = []
    for source in chatwork_sources:
        sync_status = await db.get_sync_status(source["id"])
        result.append({
            "source_id": source["id"],
            "label": source.get("label"),
            "room_id": source.get("chatwork", {}).get("room_id"),
            "sync_status": sync_status,
        })

    return {"sources": result}


@router.get("/sync-status/{source_id}")
async def get_source_sync_status(source_id: str):
    """特定ソースの同期状態を取得"""
    source = await db.get_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    sync_status = await db.get_sync_status(source_id)
    return {
        "source_id": source_id,
        "label": source.get("label"),
        "sync_status": sync_status,
    }
