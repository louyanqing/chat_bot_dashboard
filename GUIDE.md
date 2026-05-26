Refactor the backend answer generation from the current TF-IDF FAQ matching approach to a RAG + LLM pipeline, while keeping the existing project folder structure, data, frontend UI, and chatbox display behavior unchanged.

Current state:
- `backend/models/knowledge_base.py` uses CSV Q&A data, TF-IDF, and cosine similarity.
- Frontend and data should remain unchanged.

Target:
- Keep the existing folder structure.
- Keep the same data source in `backend/data`.
- Keep the frontend UI and chatbox rendering unchanged.
- Replace the backend answer-generation logic with a RAG pipeline ：CSV->Documents->Split into chunks->Embedding->Vector Store (FAISS)->User Query->Query Embedding->Retrieve top-k chunks->Build Prompt->LLM generates answer->Return to chatbox

Implementation requirements:
2. Add a new file: `backend/models/rag_knowledge_base.py`
3. Implement a class like `PeterLynchRAGKB`.
4. Load the current CSV Q&A data with flexible column detection.
5. Convert each Q&A row into a Document with content + metadata.
6. Use HuggingFace embeddings (`sentence-transformers/all-MiniLM-L6-v2`).
7. Use FAISS as vector store.
8. Use LangChain retrieval + prompt + LLM generation.
9. Support OpenAI-compatible chat model via environment variables.

