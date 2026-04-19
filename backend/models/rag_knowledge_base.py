from __future__ import annotations

import glob
import os
import re
from typing import List, Optional

import pandas as pd

from backend.core.config import TOP_K, FALLBACK
from backend.schemas.chat import ChatResponse, MatchItem


class PeterLynchRAGKB:
    def __init__(self, data_dir: str) -> None:
        self.data_dir = data_dir
        self._vectorstore = None
        self._retriever = None
        self._chain = None
        self._llm_available = False
        self._raw_rows: List[dict] = []
        self.load()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize(value: object) -> str:
        if pd.isna(value):
            return ""
        return re.sub(r"\s+", " ", str(value).strip())

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

    # ------------------------------------------------------------------
    # Load
    # ------------------------------------------------------------------

    def load(self) -> None:
        from langchain.schema import Document
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import FAISS

        csv_files = sorted(
            glob.glob(os.path.join(self.data_dir, "peter_lynch_qa_merged.csv"))
        )

        documents: List[Document] = []
        self._raw_rows = []

        for path in csv_files:
            df = pd.read_csv(path)
            if df.empty:
                continue

            q_col = self._guess_column(df, ["question", "prompt", "query", "user question"])
            a_col = self._guess_column(df, ["answer", "response", "reply", "bot answer"])
            l_col = self._guess_column(df, ["label", "category", "topic", "class"])
            default_label = self._category_from_filename(path)

            if q_col is None or a_col is None:
                continue

            for _, row in df.iterrows():
                question = self._normalize(row[q_col])
                answer = self._normalize(row[a_col])
                label = self._normalize(row[l_col]) if l_col else default_label
                label = label or default_label

                if not question or not answer:
                    continue

                content = f"Q: {question}\nA: {answer}"
                documents.append(
                    Document(
                        page_content=content,
                        metadata={
                            "question": question,
                            "answer": answer,
                            "label": label,
                            "source_file": os.path.basename(path),
                        },
                    )
                )
                self._raw_rows.append(
                    {
                        "question": question,
                        "answer": answer,
                        "label": label,
                        "source_file": os.path.basename(path),
                    }
                )

        if not documents:
            return

        splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
        chunks = splitter.split_documents(documents)

        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self._vectorstore = FAISS.from_documents(chunks, embeddings)
        self._retriever = self._vectorstore.as_retriever(
            search_type="similarity", search_kwargs={"k": TOP_K}
        )

        self._try_init_llm()

    def _try_init_llm(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
        base_url = os.getenv("OPENAI_API_BASE") or os.getenv("LLM_BASE_URL")
        model_name = os.getenv("LLM_MODEL", "gpt-3.5-turbo")

        if not api_key:
            print("[RAG] No LLM API key found — running in retrieval-only mode.")
            return

        try:
            from langchain_openai import ChatOpenAI
            from langchain.prompts import ChatPromptTemplate
            from langchain.schema.runnable import RunnablePassthrough
            from langchain.schema.output_parser import StrOutputParser

            llm_kwargs = {"model": model_name, "api_key": api_key, "temperature": 0.2}
            if base_url:
                llm_kwargs["base_url"] = base_url

            llm = ChatOpenAI(**llm_kwargs)

            prompt = ChatPromptTemplate.from_template(
                "You are a helpful assistant specializing in Peter Lynch's investment philosophy. "
                "Use the following context from his Q&A knowledge base to answer the user's question.\n\n"
                "Context:\n{context}\n\n"
                "Question: {question}\n\n"
                "Answer concisely and accurately based on the context:"
            )

            self._chain = (
                {"context": self._retriever | self._format_docs, "question": RunnablePassthrough()}
                | prompt
                | llm
                | StrOutputParser()
            )
            self._llm_available = True
            print("[RAG] LLM chain initialized.")
        except Exception as exc:
            print(f"[RAG] LLM init failed — retrieval-only mode. Reason: {exc}")

    @staticmethod
    def _format_docs(docs) -> str:
        return "\n\n".join(d.page_content for d in docs)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def answer(self, query: str) -> ChatResponse:
        if self._vectorstore is None:
            return ChatResponse(answer=FALLBACK, matches=[])

        retrieved = self._retriever.invoke(query)

        matches: List[MatchItem] = []
        for doc in retrieved:
            meta = doc.metadata
            matches.append(
                MatchItem(
                    question=meta.get("question", ""),
                    answer=meta.get("answer", ""),
                    label=meta.get("label", ""),
                    source_file=meta.get("source_file", ""),
                    score=0.0,
                )
            )

        if not matches:
            return ChatResponse(answer=FALLBACK, matches=[])

        if self._llm_available and self._chain is not None:
            try:
                generated = self._chain.invoke(query)
                best = matches[0]
                return ChatResponse(
                    answer=generated,
                    label=best.label,
                    source_file=best.source_file,
                    score=None,
                    matches=matches,
                )
            except Exception as exc:
                print(f"[RAG] LLM generation failed, falling back to retrieval: {exc}")

        # Retrieval-only fallback: return the best matching answer
        best = matches[0]
        return ChatResponse(
            answer=best.answer,
            label=best.label,
            source_file=best.source_file,
            score=None,
            matches=matches,
        )
