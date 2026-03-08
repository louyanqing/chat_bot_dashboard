from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import DATA_DIR
from backend.models.knowledge_base import PeterLynchKB
from backend.models.financial_ratios import FinancialAnalyzer
from backend.routers import admin, chat, finance

app = FastAPI(title="Peter Lynch Chatbot Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.kb = PeterLynchKB(DATA_DIR)
app.state.fin = FinancialAnalyzer()

app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(finance.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
