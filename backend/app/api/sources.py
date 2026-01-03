"""Sources API - データソース管理"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.models.source import Source, SourceType
from app.services.database import db
from app.services.chatwork_service import chatwork_service

router = APIRouter()


class ChatworkConnectRequest(BaseModel):
    room_id: str
    room_name: str = None
    project_id: str = "default"


@router.get("/chatwork/status")
async def get_chatwork_status():
    """Chatwork連携の設定状況を取得"""
    return {
        "configured": chatwork_service.is_configured(),
    }


@router.get("/chatwork/rooms")
async def get_chatwork_rooms():
    """参加中のChatworkルーム一覧を取得"""
    if not chatwork_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Chatwork連携が設定されていません。.envファイルでCHATWORK_API_TOKENを設定してください。"
        )

    try:
        rooms = await chatwork_service.get_rooms()
        return {"rooms": rooms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chatwork/rooms/{room_id}")
async def get_chatwork_room_info(room_id: str):
    """ルームIDから部屋情報を取得（登録前のプレビュー用）"""
    if not chatwork_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Chatwork連携が設定されていません"
        )

    try:
        room_info = await chatwork_service.get_room_info(room_id)
        return {
            "room_id": room_id,
            "name": room_info.get("name"),
            "type": room_info.get("type"),
            "message_num": room_info.get("message_num", 0),
            "icon_path": room_info.get("icon_path"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"ルームが見つかりません（ID: {room_id}）"
        )


@router.get("/", response_model=List[Source])
async def list_sources(project_id: str = "default"):
    """ソース一覧を取得"""
    sources_data = await db.list_sources(project_id)
    return [Source(**s) for s in sources_data]


@router.get("/{source_id}", response_model=Source)
async def get_source(source_id: str):
    """ソース詳細を取得"""
    source_data = await db.get_source(source_id)
    if not source_data:
        raise HTTPException(status_code=404, detail="Source not found")
    return Source(**source_data)


@router.post("/upload", response_model=Source)
async def upload_file(
    file: UploadFile = File(...),
    label: str = None,
    project_id: str = "default",
):
    """ファイルをアップロードしてソースを作成"""
    content = await file.read()

    source = Source(
        id=str(uuid.uuid4()),
        project_id=project_id,
        type=SourceType.UPLOADED_FILE,
        label=label or file.filename,
        file={
            "file_name": file.filename,
            "file_type": file.filename.split(".")[-1] if "." in file.filename else "txt",
            "file_size": len(content),
        },
        message_count=len(content.decode("utf-8", errors="ignore").split("\n")),
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    await db.create_source(source)
    return source


@router.post("/chatwork", response_model=Source)
async def connect_chatwork(request: ChatworkConnectRequest):
    """Chatworkルームを連携"""
    room_name = request.room_name
    room_type = "group"

    # Chatwork APIが設定されていれば、ルーム情報を取得
    if chatwork_service.is_configured():
        try:
            room_info = await chatwork_service.get_room_info(request.room_id)
            room_name = room_info.get("name", room_name)
            room_type = room_info.get("type", room_type)
        except Exception as e:
            print(f"Failed to get room info: {e}")

    source = Source(
        id=str(uuid.uuid4()),
        project_id=request.project_id,
        type=SourceType.CHATWORK_ROOM,
        label=room_name or f"Chatwork Room {request.room_id}",
        chatwork={
            "room_id": request.room_id,
            "room_name": room_name or f"Room {request.room_id}",
            "room_type": room_type,
        },
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    await db.create_source(source)
    return source


@router.get("/{source_id}/messages")
async def get_source_messages(source_id: str, force: bool = True):
    """ソースからメッセージを取得（Chatworkの場合はAPIから取得）"""
    source_data = await db.get_source(source_id)
    if not source_data:
        raise HTTPException(status_code=404, detail="Source not found")

    source = Source(**source_data)

    if source.type != SourceType.CHATWORK_ROOM:
        raise HTTPException(status_code=400, detail="This source is not a Chatwork room")

    if not chatwork_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Chatwork連携が設定されていません。.envファイルでCHATWORK_API_TOKENを設定してください。"
        )

    if not source.chatwork:
        raise HTTPException(status_code=400, detail="Chatwork room info not found")

    try:
        # ChatworkInfoオブジェクトまたはdictに対応
        if isinstance(source.chatwork, dict):
            room_id = source.chatwork.get("room_id")
        else:
            room_id = source.chatwork.room_id
        messages = await chatwork_service.get_messages(room_id, force=force)

        # メッセージ数を更新
        await db.update_source(source_id, {
            "message_count": len(messages),
            "updated_at": datetime.now(),
        })

        # 課題抽出用のフォーマットに変換
        formatted_content = chatwork_service.format_messages_for_extraction(messages)

        return {
            "source_id": source_id,
            "message_count": len(messages),
            "content": formatted_content,
            "messages": messages,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{source_id}/stored-messages")
async def get_stored_messages(
    source_id: str,
    limit: int = 100,
    offset: int = 0,
):
    """Firestoreに蓄積されたメッセージを取得"""
    source_data = await db.get_source(source_id)
    if not source_data:
        raise HTTPException(status_code=404, detail="Source not found")

    source = Source(**source_data)

    if source.type != SourceType.CHATWORK_ROOM:
        raise HTTPException(status_code=400, detail="This source is not a Chatwork room")

    # Firestoreから蓄積メッセージを取得
    messages = await db.get_messages_by_source(source_id, limit=limit, offset=offset)
    total_count = await db.get_message_count_by_source(source_id)

    # 課題抽出用のフォーマットに変換
    formatted_lines = []
    for msg in messages:
        send_time = msg.get("send_time")
        if hasattr(send_time, "strftime"):
            date_str = send_time.strftime("%Y-%m-%d %H:%M")
        else:
            date_str = str(send_time)

        formatted_lines.append(f"[{date_str}] {msg.get('account_name', 'Unknown')}:")
        formatted_lines.append(msg.get("body", ""))
        formatted_lines.append("")

    return {
        "source_id": source_id,
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
        "messages": messages,
        "content": "\n".join(formatted_lines),
    }


@router.delete("/{source_id}")
async def delete_source(source_id: str):
    """ソースを削除"""
    source_data = await db.get_source(source_id)
    if not source_data:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.delete_source(source_id)
    return {"status": "deleted"}
