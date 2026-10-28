# Handoff Report — Ollama API & Models Investigation

**Project**: Digital Detective  
**Agent**: Explorer Subagent (`teamwork_preview_explorer_detective_2`)  
**Date**: 2026-07-22  
**Target Path**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\teamwork_preview_explorer_detective_2\handoff.md`

---

## 1. Observation

1. **Local Codebase Integration Patterns**:
   - `scripts/python/my_rag.py:8-10`: `OLLAMA_URL = "http://localhost:11434/api"`, `EMBED_MODEL = "mxbai-embed-large:latest"`, `LLM_MODEL = "gemma4:latest"`.
   - `scripts/python/my_rag.py:42-53`: Function `get_embedding(text)` executes `POST http://localhost:11434/api/embeddings` with JSON payload `{"model": EMBED_MODEL, "prompt": text}` and extracts response key `data.get('embedding')`.
   - `scripts/python/my_rag.py:133-149`: Generation queries `POST http://localhost:11434/api/generate` with model `gemma4:latest` and payload `{"model": LLM_MODEL, "prompt": prompt, "stream": True}`.
   - `tmp/nexus_test/ollamaClient.ts:17-21`: Axios request `POST http://localhost:11434/api/embeddings` with model `'mxbai-embed-large'`, returning `response.data.embedding`.
   - `tmp/nexus_test/ollamaClient.ts:34-38`: Text generation via `POST http://localhost:11434/api/generate` with payload `{"model": this.model, "prompt": ..., "stream": false}` returning `response.data.response`.
   - `libs/MemOS/src/memos/embedders/ollama.py:28`: Default embedding model is specified as `nomic-embed-text:latest` or `mxbai-embed-large`.
   - `libs/MemOS/src/memos/llms/ollama.py:67-78`: Ollama LLM chat integration handles system options, tools, and response output.

2. **Model Specifications & Architecture**:
   - `gemma4:latest`: Standard LLM text generation model supported by Ollama on port 11434.
   - `mxbai-embed-large:latest`: Mixedbread AI embedding model outputting dense vectors of **1024 floats** (32-bit float array = 4096 bytes).

---

## 2. Logic Chain

1. **Generation Endpoint Verification**:
   - Calling `POST http://localhost:11434/api/generate` with `stream: false` returns a complete single JSON object containing `response` (string), `done: true`, and performance timing in `total_duration` (nanoseconds).
   - System persona injection (`"system": "You are a hard-boiled film-noir detective..."`) shapes the model's persona for generating noir case notes.

2. **Embedding Endpoint Verification**:
   - Calling `POST http://localhost:11434/api/embeddings` with payload `{"model": "mxbai-embed-large:latest", "prompt": "..."}` returns a JSON payload where the embedding array is located at key `response_json["embedding"]`.
   - The vector consists of **1024 32-bit floats**, matching `mxbai-embed-large` embedding dimensions.
   - For SQLite persistence in `data/myos_vector_store.db`, Python's `struct.pack('1024f', *embedding)` or `np.array(embedding, dtype=np.float32).tobytes()` converts the 1024 floats into a 4096-byte binary BLOB.

3. **Fallback & Resiliency Mechanics**:
   - If Ollama service is unreachable (`ConnectionRefusedError`), code must catch the exception and fall back to either mock generation text or a 1024-float zero/random vector.
   - If model is unpulled (`404 Not Found`), the response returns `{"error": "model 'gemma4:latest' not found, try pulling it first"}` which requires issuing an `ollama pull` request or notifying the operator.

---

## 3. Caveats

- **Live Endpoint Execution**: Live HTTP execution was evaluated via static inspection of existing codebase tests, Ollama client integration files, and official API contract specifications, as active terminal background process execution was restricted.
- **Model Pull Status**: Assumes `gemma4:latest` and `mxbai-embed-large:latest` are pulled or will be pulled on the target Ollama instance. If absent, fallback handling must trigger model pull or mock data generation.

---

## 4. Conclusion

- **Generation API (`/api/generate`)**: Accepts `model`, `system`, `prompt`, `stream: false`. Text is extracted from `json_res["response"]`. Execution time is measured via `json_res["total_duration"] / 1e9` seconds.
- **Embedding API (`/api/embeddings`)**: Accepts `model` (`"mxbai-embed-large:latest"`) and `prompt`. Vector output is extracted from `json_res["embedding"]`, yielding **1024 floats** (4096-byte binary float32 blob).
- **Error Handling**: Graceful fallback handles 503/connection errors by returning mock vector arrays/text, and handles 404 missing model errors via `ollama pull`.

---

## 5. Verification Method

1. **Inspect Analysis Report**:
   - Open `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\teamwork_preview_explorer_detective_2\analysis.md`.
2. **Execute Python Verification Test (when Ollama is active)**:
   ```python
   import requests
   import struct

   # Test Generate
   gen_res = requests.post("http://localhost:11434/api/generate", json={
       "model": "gemma4:latest",
       "system": "You are a film-noir detective.",
       "prompt": "Test prompt",
       "stream": False
   }, timeout=10)
   assert gen_res.status_code == 200
   assert "response" in gen_res.json()

   # Test Embeddings
   emb_res = requests.post("http://localhost:11434/api/embeddings", json={
       "model": "mxbai-embed-large:latest",
       "prompt": "Test case note"
   }, timeout=10)
   assert emb_res.status_code == 200
   vec = emb_res.json()["embedding"]
   assert len(vec) == 1024
   blob = struct.pack("1024f", *vec)
   assert len(blob) == 4096
   ```
3. **Invalidation Conditions**:
   - Ollama API spec changes key `embedding` to `embeddings`.
   - `mxbai-embed-large:latest` output dimension differs from 1024 floats.
