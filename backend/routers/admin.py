from __future__ import annotations

import os

from fastapi import APIRouter, Request

from backend.core.config import DATA_DIR, GREETING
from backend.models.rag_knowledge_base import PeterLynchRAGKB

router = APIRouter(tags=["admin"])


@router.get("/")
def root(request: Request):
    kb = request.app.state.kb
    return {
        "message": GREETING,
        "loaded_rows": len(kb._raw_rows),
        "data_dir": os.path.abspath(DATA_DIR),
    }


@router.get("/health")
def health(request: Request):
    kb = request.app.state.kb
    return {
        "status": "ok",
        "loaded_rows": len(kb._raw_rows),
        "data_dir": os.path.abspath(DATA_DIR),
    }


@router.post("/reload")
def reload(request: Request):
    request.app.state.kb = PeterLynchRAGKB(DATA_DIR)
    kb = request.app.state.kb
    return {
        "message": "Knowledge base reloaded.",
        "loaded_rows": len(kb._raw_rows),
        "data_dir": os.path.abspath(DATA_DIR),
    }
