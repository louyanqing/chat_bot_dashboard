from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from backend.schemas.finance import RatiosResponse, RecommendationsResponse, StockRatio
from backend.models.financial_ratios import FinancialAnalyzer

router = APIRouter(prefix="/finance", tags=["finance"])


def _require_fin(request: Request) -> FinancialAnalyzer:
    if request.app.state.fin is None:
        raise HTTPException(
            status_code=503,
            detail="Financial data is still loading. Please try again in a moment.",
        )
    return request.app.state.fin


@router.get("/status")
def finance_status(request: Request):
    return {"ready": request.app.state.fin is not None}


@router.get("/ratios", response_model=RatiosResponse)
def get_ratios(
    request: Request,
    symbols: Optional[str] = Query(None, description="Comma-separated tickers, e.g. AAPL,MSFT"),
):
    fin = _require_fin(request)
    symbol_list = [s.strip() for s in symbols.split(",")] if symbols else None
    rows = fin.get_ratios(symbol_list)
    return RatiosResponse(ratios=[StockRatio(**r) for r in rows])


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(request: Request):
    fin = _require_fin(request)
    return RecommendationsResponse(**fin.get_recommendations())


@router.post("/reload")
def reload_finance(request: Request):
    request.app.state.fin = None

    def _reload():
        try:
            request.app.state.fin = FinancialAnalyzer()
            print("FinancialAnalyzer reloaded.")
        except Exception as exc:
            print(f"FinancialAnalyzer reload failed: {exc}")

    import threading
    threading.Thread(target=_reload, daemon=True).start()
    return {"message": "Reload started. Check /finance/status for readiness."}
