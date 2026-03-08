from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class StockRatio(BaseModel):
    symbol: str
    currentPrice: Optional[float] = None
    returnOnEquity: Optional[float] = None
    returnOnAssets: Optional[float] = None
    debtToEquity: Optional[float] = None
    currentRatio: Optional[float] = None
    profitMargins: Optional[float] = None
    earningsGrowth: Optional[float] = None
    revenueGrowth: Optional[float] = None


class RatiosResponse(BaseModel):
    ratios: List[StockRatio]


class RecommendationsResponse(BaseModel):
    long: List[str]
    short: List[str]
