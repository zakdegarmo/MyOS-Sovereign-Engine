# /ingestRulebook Workflow

This workflow triggers the native **GUI File Picker** to ingest any 5e rulebook, expansion, or campaign PDF/Markdown file into the MyOS SQLite Vector Database.

---

## 🚀 Execution Steps

1. Launch the native Windows GUI File Picker script:
```powershell
python scripts/gui_ingest_rulebook.py
```

2. Select your `.pdf`, `.md`, `.txt`, or `.json` rulebook or campaign module.
3. Confirm or edit the canonical book title when prompted.
4. The system automatically extracts text, generates vector embeddings using local Ollama (`mxbai-embed-large`), and appends the nodes to `data/myos_vector_store.db` under `type = 'rule_node'`.
