# Ollama API & Models Verification Analysis

**Project**: Digital Detective (MyOS)  
**Agent**: Explorer Subagent (`teamwork_preview_explorer_detective_2`)  
**Date**: 2026-07-22  
**Base URL**: `http://localhost:11434`

---

## 1. Generation API (`http://localhost:11434/api/generate`)

### 1.1 Request Payload & Persona Injection
- **Endpoint**: `POST http://localhost:11434/api/generate`
- **Headers**: `Content-Type: application/json`
- **Model**: `gemma4:latest` (fallback: `gemma4:26b`, `mistral:latest`, `llama3.1:latest`)
- **Parameters**:
  - `model`: `"gemma4:latest"`
  - `system`: Persona prompt forcing film-noir detective voice:
    > `"You are a hard-boiled film-noir detective in a neon-lit cyberpunk city. Speak in dramatic, noir-style case notes with heavy atmospheric tone."`
  - `prompt`: Input content to summarize/analyze:
    > `"Case File #104: Suspect detected accessing classified SQLite vector databases at 02:14 AM."`
  - `stream`: `false` (forces a single HTTP JSON response rather than chunked NDJSON lines)

```json
{
  "model": "gemma4:latest",
  "system": "You are a hard-boiled film-noir detective in a neon-lit cyberpunk city. Speak in dramatic, noir-style case notes with heavy atmospheric tone.",
  "prompt": "Case File #104: Suspect detected accessing classified SQLite vector databases at 02:14 AM.",
  "stream": false
}
```

### 1.2 HTTP Status & Response Structure
- **Expected HTTP Status**: `200 OK`
- **JSON Response Format**:
```json
{
  "model": "gemma4:latest",
  "created_at": "2026-07-22T16:48:00.000000Z",
  "response": "The rain was beating against the glass like a frantic informant trying to spill a secret. 02:14 AM... the hour when only shadows and bad decisions are awake. The logs don't lie, kid. Someone was digging into the SQLite vector vault, pulling float arrays out of the dark...",
  "done": true,
  "done_reason": "stop",
  "context": [106, 2642, 4390, 311],
  "total_duration": 1450000000,
  "load_duration": 80000000,
  "prompt_eval_count": 52,
  "prompt_eval_duration": 220000000,
  "eval_count": 140,
  "eval_duration": 1150000000
}
```

### 1.3 Response Verification & Metrics
- **Main Output Field**: `response` (`string`) contains the complete generated text.
- `done`: `true` indicates generation completed.
- **Timing / Metrics**:
  - `total_duration`: Total server processing time in nanoseconds (e.g., `1450000000 ns` = **1.45 seconds**).
  - `eval_count`: Number of generated tokens (e.g., 140 tokens).
  - Token speed: `eval_count / (eval_duration / 1e9)` ~ **121.7 tokens/sec**.

---

## 2. Embedding API (`http://localhost:11434/api/embeddings`)

### 2.1 Request Payload
- **Endpoint**: `POST http://localhost:11434/api/embeddings`
- **Headers**: `Content-Type: application/json`
- **Model**: `mxbai-embed-large:latest` (or `mxbai-embed-large`)
- **Payload**:
```json
{
  "model": "mxbai-embed-large:latest",
  "prompt": "Test case note: Rain fell over the neon grid while float vectors aligned."
}
```

### 2.2 Response Structure & Exact Specifications
- **Expected HTTP Status**: `200 OK`
- **JSON Output Structure**:
```json
{
  "embedding": [
    -0.014829102,
    0.038192033,
    -0.009182312,
    "..."
  ]
}
```
- **Key Extraction Field**: `response_json["embedding"]` (Array of floats).
- **Vector Type**: 32-bit floating-point numbers (`float32`).
- **Exact Vector Dimension**: **1024 floats** (`len(embedding) == 1024`).
- **Binary Packing Specifications**:
  - Binary size: `1024 * 4 bytes = 4096 bytes`.
  - Python packing: `struct.pack('1024f', *embedding_list)` or `np.array(embedding_list, dtype=np.float32).tobytes()`.
  - Python unpacking: `list(struct.unpack('1024f', binary_blob))` or `np.frombuffer(binary_blob, dtype=np.float32).tolist()`.

---

## 3. Fallback & Error Handling Behaviors

### 3.1 Scenario 1: Ollama Service Offline / Unreachable
- **Condition**: Port `11434` connection refused or timed out (`requests.exceptions.ConnectionError`).
- **HTTP/System Behavior**: `ConnectionRefusedError` / `HTTP 503 Service Unavailable`.
- **Handling Strategy in Code**:
  - Catch connection exception.
  - Return structured fallback / diagnostic error message:
    `"[Ollama Offline Fallback] Ollama service unavailable on http://localhost:11434."`
  - Fallback embedding: Generate 1024-dimensional normalized random or zero-filled vector for downstream database integration continuity:
    ```python
    import numpy as np
    fallback_embedding = np.random.uniform(-0.1, 0.1, 1024).astype(np.float32).tolist()
    ```

### 3.2 Scenario 2: Specified Model Missing (`404 Not Found`)
- **Condition**: Requested model (`gemma4:latest` or `mxbai-embed-large:latest`) not pulled locally.
- **HTTP Response**: Status `404 Not Found`
  ```json
  {
    "error": "model 'gemma4:latest' not found, try pulling it first"
  }
  ```
- **Handling Strategy in Code**:
  - Catch HTTP 404 response.
  - Issue automatic `ollama pull <model_name>` API call (`POST http://localhost:11434/api/pull` with `{"name": "gemma4:latest"}`) or prompt user to execute CLI command:
    `ollama pull gemma4:latest` / `ollama pull mxbai-embed-large`.

### 3.3 Scenario 3: Bad Request (`400 Bad Request`)
- **Condition**: Invalid JSON body or missing required `model` field.
- **HTTP Response**: Status `400 Bad Request`
  ```json
  {
    "error": "model is required"
  }
  ```

---

## 4. Summary Table of Endpoints

| Endpoint | Method | Required Model | Key Input Parameters | Key Output Field | Expected Output / Dimensions |
|---|---|---|---|---|---|
| `/api/tags` | GET | N/A | None | `models` | List of installed local models |
| `/api/generate` | POST | `gemma4:latest` | `model`, `system`, `prompt`, `stream: false` | `response` | Text string + timing metadata (`total_duration`) |
| `/api/embeddings` | POST | `mxbai-embed-large:latest` | `model`, `prompt` | `embedding` | List of **1024 floats** (4096-byte binary blob) |
| `/api/pull` | POST | Target Model | `name` | `status` | Download stream status |

---

## 5. Implementation Recommendations for Digital Detective (`detective.py`)

1. **Generation Requests**:
   - Use `POST http://localhost:11434/api/generate` with `stream: false`.
   - Embed system persona `"You are a hard-boiled film-noir detective in a neon-lit cyberpunk city. Speak in dramatic, noir-style case notes."`
   - Access result string via `response_data["response"]`.

2. **Embedding Requests**:
   - Use `POST http://localhost:11434/api/embeddings` with model `mxbai-embed-large:latest`.
   - Access vector via `response_data["embedding"]`.
   - Validate dimension length: `assert len(embedding) == 1024`.
   - Pack with `struct.pack('1024f', *embedding)` before inserting into SQLite table `vectors` as binary BLOB.

3. **Resilience**:
   - Implement exponential backoff retry on timeout/connection errors.
   - Use fallback 1024-float zero/random vector generation if Ollama is unreachable in offline testing mode.
