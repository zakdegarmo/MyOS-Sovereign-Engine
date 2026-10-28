import os
import sys
import shutil
import sqlite3
import struct
import ast
import traceback
from pathlib import Path

# Add project root and scripts directory to sys.path
PROJECT_ROOT = Path(r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS").resolve()
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))
sys.path.insert(0, str(PROJECT_ROOT))

import docstringer
import tree_sitter

def run_task1_verify_docstringer():
    print("=== Task 1: Running verify_docstringer.py directly ===")
    verify_script = SCRIPTS_DIR / "verify_docstringer.py"
    import importlib.util
    spec = importlib.util.spec_from_file_location("verify_docstringer", verify_script)
    mod = importlib.util.module_from_spec(spec)
    
    # We trap sys.exit
    try:
        spec.loader.exec_module(mod)
        mod.main()
        print("Task 1 PASS: verify_docstringer.py completed with exit 0")
        return True, ""
    except SystemExit as e:
        if e.code == 0:
            print("Task 1 PASS: verify_docstringer.py exited with code 0")
            return True, ""
        else:
            err = f"Task 1 FAIL: verify_docstringer.py exited with code {e.code}"
            print(err)
            return False, err
    except Exception as e:
        err = f"Task 1 EXCEPTION: {e}\n{traceback.format_exc()}"
        print(err)
        return False, err

def run_task2_and_3_edge_cases(workspace_dir):
    print("\n=== Task 2 & 3: Stress Testing Edge Cases ===")
    test_dir = workspace_dir / "edge_case_tests"
    db_path = workspace_dir / "edge_cases.db"
    
    if test_dir.exists():
        shutil.rmtree(test_dir)
    if db_path.exists():
        db_path.unlink()
        
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # Define edge case files
    files = {}
    
    # Edge case 1: Nested Python functions & decorated functions & async defs
    files["edge_python.py"] = (
        "import asyncio\n"
        "from functools import wraps\n\n"
        "def my_decorator(func):\n"
        "    @wraps(func)\n"
        "    def wrapper(*args, **kwargs):\n"
        "        return func(*args, **kwargs)\n"
        "    return wrapper\n\n"
        "@my_decorator\n"
        "async def async_outer_func(x: int) -> int:\n"
        "    def inner_nested_func(y: int) -> int:\n"
        "        return y * 2\n"
        "    return inner_nested_func(x) + 1\n\n"
        "class OuterClass:\n"
        "    @staticmethod\n"
        "    def static_method(val: str):\n"
        "        def deeply_nested():\n"
        "            return val.upper()\n"
        "        return deeply_nested()\n\n"
        "    @classmethod\n"
        "    async def async_class_method(cls, num: float):\n"
        "        return num ** 2\n\n"
        "def func_with_existing_doc():\n"
        '    """This is an existing python docstring."""\n'
        "    return True\n"
    )

    # Edge case 2: JS Arrow functions, exported functions, decorated/async JS
    files["edge_js.js"] = (
        "const simpleArrow = (a, b) => a + b;\n\n"
        "export const asyncExportedArrow = async (req, res) => {\n"
        "    const helper = (x) => x * 2;\n"
        "    return helper(req.body.id);\n"
        "};\n\n"
        "function regularJsFunction(param1) {\n"
        "    const innerArrow = (y) => {\n"
        "        return y + param1;\n"
        "    };\n"
        "    return innerArrow;\n"
        "}\n\n"
        "/**\n"
        " * Existing JSDoc comment\n"
        " */\n"
        "function existingJsDocFunction() {\n"
        "    return 42;\n"
        "}\n"
    )

    # Edge case 3: TSX Components, Types, Interfaces, Generic Arrow Functions
    files["edge_tsx.tsx"] = (
        "import React from 'react';\n\n"
        "export interface ButtonProps {\n"
        "    label: string;\n"
        "    onClick: () => void;\n"
        "}\n\n"
        "export type CardStyle = 'compact' | 'expanded';\n\n"
        "export const PrimaryButton: React.FC<ButtonProps> = ({ label, onClick }) => {\n"
        "    const handleClick = () => {\n"
        "        onClick();\n"
        "    };\n"
        "    return <button onClick={handleClick}>{label}</button>;\n"
        "};\n\n"
        "export function HeaderComponent<T extends { title: string }>(props: T): JSX.Element {\n"
        "    return <h1>{props.title}</h1>;\n"
        "}\n\n"
        "class TSXClassComponent extends React.Component {\n"
        "    render() {\n"
        "        const getTitle = () => 'Class Component';\n"
        "        return <div>{getTitle()}</div>;\n"
        "    }\n"
        "}\n"
    )

    # Write test files
    for filename, content in files.items():
        fpath = test_dir / filename
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Wrote edge test file: {filename}")

    # Process directory using docstringer
    conn = docstringer.setup_db(str(db_path))
    docstringer.crawl_directory(str(test_dir), conn)
    conn.close()

    print("\n--- Edge Case Processing Complete. Running Audits ---")
    
    findings = []
    
    # 1. Check Python Syntax Integrity with ast.parse
    py_processed_path = test_dir / "edge_python.py"
    with open(py_processed_path, "r", encoding="utf-8") as f:
        py_code = f.read()
    
    print("\n--- Modified edge_python.py ---")
    print(py_code)
    
    try:
        ast.parse(py_code)
        print("[AUDIT PASS] Modified edge_python.py is syntactically valid Python AST!")
    except SyntaxError as e:
        err_msg = f"[CRITICAL SYNTAX ERROR] Modified edge_python.py failed AST parsing: line {e.lineno}, col {e.offset}: {e.msg}"
        print(err_msg)
        findings.append(err_msg)

    # 2. Check JS/TSX Syntax / Tree-Sitter Integrity
    for ext, fname, parser_obj in [
        (".js", "edge_js.js", docstringer.js_parser),
        (".tsx", "edge_tsx.tsx", docstringer.tsx_parser)
    ]:
        filepath = test_dir / fname
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
        print(f"\n--- Modified {fname} ---")
        print(code)
        
        tree = parser_obj.parse(code.encode('utf-8'))
        has_error = False
        def check_errors(n):
            nonlocal has_error
            if n.type == 'ERROR':
                has_error = True
            for c in n.children:
                check_errors(c)
        check_errors(tree.root_node)
        
        if has_error:
            err_msg = f"[SYNTAX AUDIT WARNING/FAIL] {fname} contains ERROR nodes after tree-sitter re-parse!"
            print(err_msg)
            findings.append(err_msg)
        else:
            print(f"[AUDIT PASS] Modified {fname} parsed cleanly without tree-sitter ERROR nodes.")

    # 3. DB Schema and BLOB audit
    conn = sqlite3.connect(str(db_path))
    c = conn.cursor()
    c.execute("SELECT id, file_path, func_name, signature, docstring, timestamp, embedding FROM functions")
    db_rows = c.fetchall()
    conn.close()

    print(f"\nDatabase Inspection ({len(db_rows)} records found):")
    if not db_rows:
        findings.append("[CRITICAL FAIL] Database is empty after crawl_directory!")

    db_func_map = {}
    for row in db_rows:
        rec_id, file_path, func_name, signature, docstring, timestamp, embedding_blob = row
        print(f"Record ID: {rec_id} | Func: {func_name} | Sig: {signature}")
        db_func_map[rec_id] = row
        
        # Validate BLOB
        if embedding_blob is None or len(embedding_blob) == 0:
            findings.append(f"[BLOB ERROR] NULL or empty embedding BLOB for record {rec_id}")
            continue
        if len(embedding_blob) % 4 != 0:
            findings.append(f"[BLOB ERROR] Embedding BLOB size {len(embedding_blob)} is not a multiple of 4 bytes for record {rec_id}")
            continue
            
        num_floats = len(embedding_blob) // 4
        try:
            floats = struct.unpack(f'{num_floats}f', embedding_blob)
            if len(floats) == 0:
                findings.append(f"[BLOB ERROR] 0 floats unpacked for record {rec_id}")
            for flt in floats:
                if not isinstance(flt, float) or flt != flt: # NaN check
                    findings.append(f"[BLOB ERROR] Invalid float value {flt} in embedding for record {rec_id}")
            print(f"  -> BLOB OK: {num_floats} packed float32 elements.")
        except Exception as ex:
            findings.append(f"[BLOB UNPACK ERROR] Failed to unpack floats for {rec_id}: {ex}")

    # Specific Deep Edge-Case Behavior Analysis
    print("\n--- Detailed Edge-Case Behavioral Analysis ---")
    
    # Python nested functions analysis
    nested_names = [f for f in db_func_map if "inner_nested_func" in f or "deeply_nested" in f]
    print(f"Nested functions captured in DB: {nested_names}")
    
    # Python existing docstrings
    existing_doc_rows = [r for r in db_rows if r[2] == "func_with_existing_doc"]
    if existing_doc_rows:
        doc = existing_doc_rows[0][4]
        print(f"Function with existing docstring extracted docstring: '{doc}'")
        if "This is an existing python docstring" not in doc:
            findings.append(f"[EXTRACTION FAIL] Python existing docstring not properly extracted for func_with_existing_doc. Got: '{doc}'")
            
    # Check if duplicate docstring was inserted in func_with_existing_doc
    if py_code.count("func_with_existing_doc") > 0:
        lines = py_code.splitlines()
        in_func = False
        func_lines = []
        for line in lines:
            if "def func_with_existing_doc" in line:
                in_func = True
            elif in_func and line.startswith("def "):
                in_func = False
            if in_func:
                func_lines.append(line)
        doc_count = sum(1 for line in func_lines if '"""' in line or "'''" in line)
        if doc_count > 1:
            findings.append(f"[DOCSTRING DUPLICATION] func_with_existing_doc has {doc_count} docstrings inserted even though it already had a docstring!")

    return findings

def main():
    ws_dir = Path(r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\teamwork_preview_challenger_docstringer_1").resolve()
    t1_pass, t1_err = run_task1_verify_docstringer()
    findings = run_task2_and_3_edge_cases(ws_dir)
    
    print("\n=== SUMMARY OF ALL FINDINGS ===")
    print(f"Task 1 Status: {'PASS' if t1_pass else 'FAIL'}")
    print(f"Task 2/3 Total Findings / Issues: {len(findings)}")
    for i, f in enumerate(findings, 1):
        print(f"Finding {i}: {f}")

if __name__ == "__main__":
    main()
