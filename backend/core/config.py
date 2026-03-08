from __future__ import annotations

import os

# ---------------------------------------------------------------------------
# Data settings
# ---------------------------------------------------------------------------
DATA_DIR: str = os.getenv("CHATBOT_DATA_DIR", "./data")
TOP_K: int = int(os.getenv("CHATBOT_TOP_K", "3"))
MIN_CONFIDENCE: float = float(os.getenv("CHATBOT_MIN_CONFIDENCE", "0.10"))

# ---------------------------------------------------------------------------
# Static response strings
# ---------------------------------------------------------------------------
GREETING: str = (
    "Hi! I'm a Peter Lynch chatbot. Ask me about strategy development, timing, "
    "risk management, adaptability, psychology, or personal life."
)

FALLBACK: str = (
    "I couldn't find a strong match in the CSV knowledge base. Try asking with "
    "clear Peter Lynch keywords such as PEG ratio, tenbagger, stock category, "
    "when to sell, debt, market timing, or psychology."
)
