from __future__ import annotations

import glob
import os
import re
from dataclasses import dataclass
from typing import List, Optional

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.core.config import TOP_K, MIN_CONFIDENCE, FALLBACK
from backend.schemas.chat import ChatResponse, MatchItem


@dataclass
class KBRow:
    question: str
    answer: str
    label: str
    source_file: str
    text_for_search: str


class PeterLynchKB:
    def __init__(self, data_dir: str) -> None:
        self.data_dir = data_dir
        self.rows: List[KBRow] = []
        # full-text index (question + answer + label)
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.matrix = None
        # question-only index for direct question matching
        self.q_vectorizer: Optional[TfidfVectorizer] = None
        self.q_matrix = None
        self.load()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_text(value: object) -> str:
        if pd.isna(value):
            return ""
        text = str(value).strip()
        return re.sub(r"\s+", " ", text) # Replace multiple whitespace with single space

    @staticmethod
    def _guess_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
        cols = {c.lower().strip(): c for c in df.columns}
        for candidate in candidates:
            if candidate in cols:
                return cols[candidate]
        for candidate in candidates:
            for lower_name, original_name in cols.items():
                if candidate in lower_name:
                    return original_name
        return None

    @staticmethod
    def _category_from_filename(path: str) -> str:
        name = os.path.splitext(os.path.basename(path))[0]
        return re.sub(r"[_\-]+", " ", name).title()

    def _rows_from_csv(self, path: str) -> List[KBRow]:
        df = pd.read_csv(path)
        if df.empty:
            return []

        question_col = self._guess_column(df, ["question", "prompt", "query", "user question"])
        answer_col = self._guess_column(df, ["answer", "response", "reply", "bot answer"])
        label_col = self._guess_column(df, ["label", "category", "topic", "class"])

        if question_col is None or answer_col is None:
            raise ValueError(
                f"{os.path.basename(path)} must contain question/answer columns. "
                f"Found columns: {list(df.columns)}"
            )

        default_label = self._category_from_filename(path)
        rows: List[KBRow] = []

        for _, row in df.iterrows():
            question = self._normalize_text(row[question_col])
            answer = self._normalize_text(row[answer_col])
            label = self._normalize_text(row[label_col]) if label_col else default_label
            label = label or default_label

            if not question or not answer:
                continue

            search_text = f"{question} {answer} {label} {default_label}".strip()
            rows.append(
                KBRow(
                    question=question,
                    answer=answer,
                    label=label,
                    source_file=os.path.basename(path),
                    text_for_search=search_text,
                )
            )
        return rows

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self) -> None:
        csv_files = sorted(glob.glob(os.path.join(self.data_dir, "*.csv")))
        self.rows = []

        for path in csv_files:
            self.rows.extend(self._rows_from_csv(path))

        if not self.rows:
            self.vectorizer = None
            self.matrix = None
            self.q_vectorizer = None
            self.q_matrix = None
            return

        corpus = [row.text_for_search for row in self.rows]
        self.vectorizer = TfidfVectorizer(
            lowercase=True, stop_words="english", ngram_range=(1, 2), sublinear_tf=True
        )
        self.matrix = self.vectorizer.fit_transform(corpus)

        # Question-only index: keep stop words so "is" vs "was" stays discriminating
        q_corpus = [row.question for row in self.rows]
        self.q_vectorizer = TfidfVectorizer(
            lowercase=True, stop_words=None, ngram_range=(1, 2), sublinear_tf=True
        )
        self.q_matrix = self.q_vectorizer.fit_transform(q_corpus)

    def search(self, query: str, top_k: int = TOP_K) -> List[dict]:
        if not self.rows or self.vectorizer is None or self.matrix is None:
            return []

        query = self._normalize_text(query)
        if not query:
            return []

        # Full-text similarity
        full_scores = cosine_similarity(
            self.vectorizer.transform([query]), self.matrix
        ).flatten()

        # Question-only similarity (higher weight — rewards direct question matches)
        q_scores = cosine_similarity(
            self.q_vectorizer.transform([query]), self.q_matrix
        ).flatten()

        scores = 0.35 * full_scores + 0.65 * q_scores

        ranked_idx = scores.argsort()[::-1][:top_k]

        return [
            {
                "question": self.rows[idx].question,
                "answer": self.rows[idx].answer,
                "label": self.rows[idx].label,
                "source_file": self.rows[idx].source_file,
                "score": round(float(scores[idx]), 4),
            }
            for idx in ranked_idx
        ]

    def answer(self, query: str) -> ChatResponse:
        matches = self.search(query, top_k=TOP_K)

        if not matches:
            return ChatResponse(answer=FALLBACK, matches=[])

        best = matches[0]
        if best["score"] < MIN_CONFIDENCE:
            return ChatResponse(
                answer=FALLBACK,
                label=best["label"],
                source_file=best["source_file"],
                score=best["score"],
                matches=[MatchItem(**m) for m in matches],
            )

        answer_text = best["answer"]
        if (
            len(matches) > 1
            and matches[1]["score"] >= 0.25
            and matches[1]["label"] != best["label"]
        ):
            answer_text += f"\n\nRelated angle: {matches[1]['answer']}"

        return ChatResponse(
            answer=answer_text,
            label=best["label"],
            source_file=best["source_file"],
            score=best["score"],
            matches=[MatchItem(**m) for m in matches],
        )
