import os
import sys
import sqlite3
import argparse
import urllib.request
import urllib.error
import json
import struct
import datetime
from pathlib import Path

# Tree-Sitter
import tree_sitter
import tree_sitter_python
import tree_sitter_javascript
import tree_sitter_typescript

OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
MODEL_NAME = "gemma4:latest"
EMBED_MODEL = "mxbai-embed-large:latest"

DB_FILE = "data/myos_code_index.db"

# Initialize parsers
try:
    py_lang = tree_sitter.Language(tree_sitter_python.language())
    js_lang = tree_sitter.Language(tree_sitter_javascript.language())
    ts_lang = tree_sitter.Language(tree_sitter_typescript.language_typescript())
    tsx_lang = tree_sitter.Language(tree_sitter_typescript.language_tsx())
except Exception:
    py_lang = tree_sitter_python.language()
    js_lang = tree_sitter_javascript.language()
    ts_lang = tree_sitter_typescript.language_typescript()
    tsx_lang = tree_sitter_typescript.language_tsx()

try:
    py_parser = tree_sitter.Parser(py_lang)
    js_parser = tree_sitter.Parser(js_lang)
    ts_parser = tree_sitter.Parser(ts_lang)
    tsx_parser = tree_sitter.Parser(tsx_lang)
except Exception:
    py_parser = tree_sitter.Parser()
    py_parser.language = py_lang
    js_parser = tree_sitter.Parser()
    js_parser.language = js_lang
    ts_parser = tree_sitter.Parser()
    ts_parser.language = ts_lang
    tsx_parser = tree_sitter.Parser()
    tsx_parser.language = tsx_lang

def setup_db(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS functions (
            id TEXT PRIMARY KEY,
            file_path TEXT,
            func_name TEXT,
            signature TEXT,
            docstring TEXT,
            timestamp TEXT,
            embedding BLOB
        )
    ''')
    conn.commit()
    return conn

def get_embedding(text):
    payload = {"model": EMBED_MODEL, "prompt": text}
    try:
        req = urllib.request.Request(OLLAMA_EMBED_URL, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode('utf-8'))
        emb = data.get('embedding')
        if emb:
            return emb
    except Exception as e:
        print(f"Embedding error: {e}")

    # Fallback float vector when Ollama service is unavailable
    import hashlib
    h = hashlib.sha256(text.encode('utf-8')).digest()
    return [float((h[i % len(h)] / 127.5) - 1.0) for i in range(768)]

def generate_docstring(code_snippet):
    prompt = f"You are an expert developer. Read this code and output ONLY a concise, 1-2 sentence docstring explaining what it does. Do not include quotes or code blocks. Code:\n{code_snippet}"
    payload = {"model": MODEL_NAME, "prompt": prompt, "stream": False}
    try:
        req = urllib.request.Request(OLLAMA_GENERATE_URL, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode('utf-8'))
        return data.get('response', '').strip()
    except Exception as e:
        print(f"Generation error: {e}")
        return ""

def get_outer_node(node):
    curr = node
    if curr.parent and curr.parent.type == 'variable_declarator' and curr.parent.parent and curr.parent.parent.type in ('lexical_declaration', 'variable_declaration'):
        curr = curr.parent.parent
    if curr.parent and curr.parent.type == 'export_statement':
        curr = curr.parent
    return curr

def extract_js_docstring(node):
    outer = get_outer_node(node)
    parent = outer.parent
    if not parent:
        return False, None
    try:
        idx = parent.children.index(outer)
    except ValueError:
        return False, None

    comments = []
    curr_idx = idx - 1
    while curr_idx >= 0 and parent.children[curr_idx].type == 'comment':
        comments.insert(0, parent.children[curr_idx])
        curr_idx -= 1

    if not comments:
        return False, None

    raw_texts = [c.text.decode('utf-8', errors='replace').strip() for c in comments]
    cleaned_lines = []
    for text in raw_texts:
        if text.startswith('/**') or text.startswith('/*'):
            lines = text.splitlines()
            for line in lines:
                l = line.strip()
                if l.startswith('/**'):
                    l = l[3:].strip()
                elif l.startswith('/*'):
                    l = l[2:].strip()
                if l.endswith('*/'):
                    l = l[:-2].strip()
                if l.startswith('*'):
                    l = l[1:].strip()
                if l:
                    cleaned_lines.append(l)
        elif text.startswith('//'):
            cleaned_lines.append(text[2:].strip())
        else:
            cleaned_lines.append(text)
    
    doc = " ".join(cleaned_lines).strip()
    return (True, doc) if doc else (False, None)

def extract_py_docstring(node):
    block = None
    for c in node.children:
        if c.type == 'block':
            block = c
            break
    if not block:
        return False, None
    
    for child in block.children:
        if child.type == 'comment':
            continue
        if child.type == 'expression_statement':
            for sub in child.children:
                if sub.type == 'string':
                    text = sub.text.decode('utf-8', errors='replace')
                    cleaned = text.strip()
                    for q in ('"""', "'''", '"', "'"):
                        if cleaned.startswith(q) and cleaned.endswith(q) and len(cleaned) >= 2 * len(q):
                            cleaned = cleaned[len(q):-len(q)].strip()
                            break
                    return True, cleaned
        break
    return False, None

def extract_func_name(node, lang):
    if lang == 'py':
        for c in node.children:
            if c.type == 'identifier':
                return c.text.decode('utf-8', errors='replace')
    else:
        for c in node.children:
            if c.type in ('identifier', 'type_identifier', 'property_identifier'):
                return c.text.decode('utf-8', errors='replace')
        if node.type == 'arrow_function':
            if node.parent and node.parent.type == 'variable_declarator':
                for c in node.parent.children:
                    if c.type == 'identifier':
                        return c.text.decode('utf-8', errors='replace')
    return "<anonymous>"

def extract_signature(node, lang):
    text = node.text.decode('utf-8', errors='replace').strip()
    if lang == 'py':
        block = None
        for c in node.children:
            if c.type == 'block':
                block = c
                break
        if block:
            header = node.text[:block.start_byte - node.start_byte].decode('utf-8', errors='replace').strip()
            if header.endswith(':'):
                header = header[:-1].strip()
            return header
        else:
            lines = text.splitlines()
            header_lines = []
            for line in lines:
                header_lines.append(line)
                if line.rstrip().endswith(':'):
                    break
            header = "\n".join(header_lines).strip()
            if header.endswith(':'):
                header = header[:-1].strip()
            return header
    else:
        first_line = text.splitlines()[0] if text else ""
        for delim in ('{', '=>', ';'):
            if delim in first_line:
                first_line = first_line.split(delim)[0]
        return first_line.strip()

def process_file(filepath, conn):
    filepath_obj = Path(filepath)
    ext = filepath_obj.suffix.lower()
    if ext not in ('.py', '.js', '.ts', '.tsx'):
        return

    try:
        with open(filepath, 'rb') as f:
            content_bytes = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    if ext == '.py':
        parser = py_parser
        lang = 'py'
        target_types = {'function_definition', 'class_definition'}
    elif ext == '.js':
        parser = js_parser
        lang = 'js'
        target_types = {'function_declaration', 'class_declaration', 'method_definition', 'arrow_function'}
    elif ext == '.ts':
        parser = ts_parser
        lang = 'ts'
        target_types = {'function_declaration', 'class_declaration', 'method_definition', 'interface_declaration', 'type_alias_declaration', 'arrow_function'}
    elif ext == '.tsx':
        parser = tsx_parser
        lang = 'ts'
        target_types = {'function_declaration', 'class_declaration', 'method_definition', 'interface_declaration', 'type_alias_declaration', 'arrow_function'}
    else:
        return

    tree = parser.parse(content_bytes)

    nodes = []
    def traverse(n):
        if n.type in target_types:
            nodes.append(n)
        for c in n.children:
            traverse(c)
    traverse(tree.root_node)

    if not nodes:
        return

    edits = []

    for node in nodes:
        func_name = extract_func_name(node, lang)
        signature = extract_signature(node, lang)
        code_snippet = node.text.decode('utf-8', errors='replace')

        if lang == 'py':
            has_doc, docstring = extract_py_docstring(node)
        else:
            has_doc, docstring = extract_js_docstring(node)

        if not has_doc or not docstring:
            docstring = generate_docstring(code_snippet)
            if not docstring:
                docstring = f"Summary for {func_name}."

            if lang == 'py':
                block = None
                for c in node.children:
                    if c.type == 'block':
                        block = c
                        break
                if block:
                    insert_byte = block.start_byte
                    line_start = content_bytes.rfind(b'\n', 0, node.start_byte)
                    line_start = 0 if line_start == -1 else line_start + 1
                    header_line_bytes = content_bytes[line_start:node.start_byte]
                    header_line = header_line_bytes.decode('utf-8', errors='replace')
                    header_indent = header_line[:len(header_line) - len(header_line.lstrip(' \t'))]
                    body_indent = header_indent + "    "

                    doc_lines = docstring.splitlines()
                    if len(doc_lines) <= 1:
                        doc_formatted = f'"""{docstring}"""'
                    else:
                        formatted_lines = f"\n{body_indent}".join(doc_lines)
                        doc_formatted = f'"""\n{body_indent}{formatted_lines}\n{body_indent}"""'

                    insertion_text = f"\n{body_indent}{doc_formatted}\n{body_indent}"
                    docstring_bytes = insertion_text.encode('utf-8')
                    edits.append((insert_byte, docstring_bytes))
            else:
                outer = get_outer_node(node)
                insert_byte = outer.start_byte
                line_start = content_bytes.rfind(b'\n', 0, outer.start_byte)
                line_start = 0 if line_start == -1 else line_start + 1
                header_line_bytes = content_bytes[line_start:outer.start_byte]
                header_line = header_line_bytes.decode('utf-8', errors='replace')
                outer_indent = header_line[:len(header_line) - len(header_line.lstrip(' \t'))]

                jsdoc_lines = ["/**"]
                for line in docstring.splitlines():
                    jsdoc_lines.append(f"{outer_indent} * {line}")
                jsdoc_lines.append(f"{outer_indent} */")
                insertion_text = "\n".join(jsdoc_lines) + f"\n{outer_indent}"
                docstring_bytes = insertion_text.encode('utf-8')
                edits.append((insert_byte, docstring_bytes))

        embedding = get_embedding(docstring if docstring else f"{func_name}: {signature}")
        if embedding:
            embedding_blob = struct.pack(f'{len(embedding)}f', *embedding)
        else:
            embedding_blob = None

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        rel_path = str(filepath)
        record_id = f"{rel_path}:{func_name}"

        conn.execute(
            "INSERT OR REPLACE INTO functions (id, file_path, func_name, signature, docstring, timestamp, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (record_id, rel_path, func_name, signature, docstring, timestamp, embedding_blob)
        )

    conn.commit()

    if edits:
        edits.sort(key=lambda x: x[0], reverse=True)
        new_content_bytes = content_bytes
        for insert_byte, docstring_bytes in edits:
            new_content_bytes = new_content_bytes[:insert_byte] + docstring_bytes + new_content_bytes[insert_byte:]

        try:
            new_content = new_content_bytes.decode('utf-8')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
        except Exception as e:
            print(f"Error updating source file {filepath}: {e}")

def crawl_directory(target_dir, conn):
    extensions = {'.py', '.js', '.ts', '.tsx'}
    for root, _, files in os.walk(target_dir):
        if 'node_modules' in root or '.git' in root or 'dist' in root:
            continue
        for file in files:
            if Path(file).suffix in extensions:
                process_file(os.path.join(root, file), conn)

def main():
    parser = argparse.ArgumentParser(description="MyOS Codebase Indexer & DocStringer")
    parser.add_argument("--target-dir", required=True, help="Directory to scan")
    parser.add_argument("--db-path", default=None, help="Path to target SQLite database")
    args = parser.parse_args()
    
    if args.db_path:
        db_path = args.db_path
    else:
        db_path = os.path.join(os.path.dirname(__file__), "..", DB_FILE)
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    conn = setup_db(db_path)
    crawl_directory(args.target_dir, conn)
    conn.close()
    print("Done indexing codebase!")

if __name__ == "__main__":
    main()
