from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from backend.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, request: Request):
    message = payload.message.strip()
    print(f"=======Received message: {message}")
    if not message:
        raise HTTPException(status_code=400, detail="message cannot be empty")
    return request.app.state.kb.answer(message)
