from __future__ import annotations

from typing import List, Optional

import pandas as pd
import warnings
import random

from yahooquery import Ticker
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
import yahoo_fin.stock_info as si

warnings.filterwarnings("ignore", category=Warning)
random.seed(42)

LONG_CLUSTER = 3
SHORT_CLUSTER = 2

DISPLAY_COLS = [
    "currentPrice",
    "returnOnEquity",
    "returnOnAssets",
    "debtToEquity",
    "currentRatio",
    "profitMargins",
    "earningsGrowth",
    "revenueGrowth",
]

CLUSTER_DROP_COLS = [
    "maxAge", "currentPrice", "targetHighPrice", "targetLowPrice",
    "targetMeanPrice", "targetMedianPrice", "recommendationMean",
    "recommendationKey", "numberOfAnalystOpinions", "financialCurrency",
]


class FinancialAnalyzer:
    def __init__(self) -> None:
        self._display_df: Optional[pd.DataFrame] = None  # index=symbol, cols=metrics
        self._long: List[str] = []
        self._short: List[str] = []
        self.load()

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def load(self) -> None:
        symbols = si.tickers_dow()
        fin_data_dict = Ticker(symbols).financial_data
        # Build metrics x symbols DataFrame, then transpose to symbols x metrics
        fin_df = pd.DataFrame.from_dict(fin_data_dict, orient="index").T
        self._display_df = fin_df.T.copy()  # symbols x metrics, original values

        # Invert D/E for clustering (avoid div-by-zero)
        de_row = fin_df.loc["debtToEquity"].replace(0, float("nan"))
        fin_df.loc["debtToEquity"] = 1.0 / de_row

        data = fin_df.T.fillna(0)

        # Drop non-numeric / meta columns
        drop_existing = [c for c in CLUSTER_DROP_COLS if c in data.columns]
        X = (
            data.drop(columns=drop_existing)
            .select_dtypes(include="number")
            .to_numpy()
        )

        X = MinMaxScaler().fit_transform(X)
        yhat = KMeans(n_clusters=4, random_state=100).fit_predict(X)

        self._long = list(data.index[yhat == LONG_CLUSTER])
        self._short = list(data.index[yhat == SHORT_CLUSTER])

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_ratios(self, symbols: Optional[List[str]] = None) -> List[dict]:
        if self._display_df is None:
            return []
        df = self._display_df
        if symbols:
            df = df[df.index.isin([s.upper() for s in symbols])]
        available = [c for c in DISPLAY_COLS if c in df.columns]
        result = []
        for symbol, row in df[available].iterrows():
            entry: dict = {"symbol": str(symbol)}
            for col in available:
                val = row[col]
                entry[col] = None if pd.isna(val) else float(val)
            result.append(entry)
        return result

    def get_recommendations(self) -> dict:
        return {"long": self._long, "short": self._short}
