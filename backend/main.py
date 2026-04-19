from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import DATA_DIR
from backend.models.rag_knowledge_base import PeterLynchRAGKB
from backend.models.financial_ratios import FinancialAnalyzer
from backend.routers import admin, chat, finance


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.kb = PeterLynchRAGKB(DATA_DIR)
    app.state.fin = None  # will be set by background thread

    def _load_fin():
        try:
            app.state.fin = FinancialAnalyzer()
            print("FinancialAnalyzer ready.")
        except Exception as exc:
            print(f"FinancialAnalyzer failed to load: {exc}")

    threading.Thread(target=_load_fin, daemon=True).start()
    yield


app = FastAPI(title="Peter Lynch Chatbot Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(finance.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
