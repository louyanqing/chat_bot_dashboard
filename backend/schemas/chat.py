from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None


class MatchItem(BaseModel):
    question: str
    answer: str
    label: str
    source_file: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    label: Optional[str] = None
    source_file: Optional[str] = None
    score: Optional[float] = None
    matches: List[MatchItem] = []
