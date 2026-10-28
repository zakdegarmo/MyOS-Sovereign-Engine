# Context Notes

## Project Scope & Boundaries
- Target scripts: `scripts/docstringer.py`, `scripts/verify_docstringer.py`
- Database: SQLite DB `data/myos_vector_store.db` or database specified in `docstringer.py`
- Languages to support in AST: `.py`, `.js`, `.ts`/`.tsx`
- Tree-sitter packages: `tree_sitter`, `tree_sitter_python`, `tree_sitter_javascript`, `tree_sitter_typescript`
- Ollama models: `gemma4:latest` (or `generate_docstring` implementation), `mxbai-embed-large:latest` (or `get_embedding` implementation)
