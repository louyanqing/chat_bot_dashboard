from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Query, Request

from backend.schemas.finance import RatiosResponse, RecommendationsResponse, StockRatio
from backend.models.financial_ratios import FinancialAnalyzer

router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("/ratios", response_model=RatiosResponse)
def get_ratios(
    request: Request,
    symbols: Optional[str] = Query(None, description="Comma-separated ticker symbols, e.g. AAPL,MSFT"),
):
    fin: FinancialAnalyzer = request.app.state.fin
    symbol_list = [s.strip() for s in symbols.split(",")] if symbols else None
    rows = fin.get_ratios(symbol_list)
    return RatiosResponse(ratios=[StockRatio(**r) for r in rows])


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(request: Request):
    fin: FinancialAnalyzer = request.app.state.fin
    return RecommendationsResponse(**fin.get_recommendations())


@router.post("/reload")
def reload_finance(request: Request):
    request.app.state.fin = FinancialAnalyzer()
    fin: FinancialAnalyzer = request.app.state.fin
    return {
        "message": "Financial data reloaded.",
        "long_count": len(fin._long),
        "short_count": len(fin._short),
    }
