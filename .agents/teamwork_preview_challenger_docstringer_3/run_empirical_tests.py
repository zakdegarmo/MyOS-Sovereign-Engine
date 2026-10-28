import os
import sys
import shutil
import sqlite3
import struct
import ast
import subprocess
from pathlib import Path

# Tree-Sitter for checking JS/TS/TSX syntax post-insertion
import tree_sitter
import tree_sitter_python
import tree_sitter_javascript
import tree_sitter_typescript

py_lang = tree_sitter.Language(tree_sitter_python.language())
js_lang = tree_sitter.Language(tree_sitter_javascript.language())
ts_lang = tree_sitter.Language(tree_sitter_typescript.language_typescript())
tsx_lang = tree_sitter.Language(tree_sitter_typescript.language_tsx())

py_parser = tree_sitter.Parser(py_lang)
js_parser = tree_sitter.Parser(js_lang)
ts_parser = tree_sitter.Parser(ts_lang)
tsx_parser = tree_sitter.Parser(tsx_lang)

def run_tests():
    agent_dir = Path(__file__).resolve().parent
    project_root = agent_dir.parent.parent
    docstringer_script = project_root / "scripts" / "docstringer.py"
    verify_script = project_root / "scripts" / "verify_docstringer.py"

    test_harness_dir = agent_dir / "test_harness"
    test_db_path = agent_dir / "test_harness.db"

    if test_harness_dir.exists():
        shutil.rmtree(test_harness_dir)
    if test_db_path.exists():
        test_db_path.unlink()

    test_harness_dir.mkdir(parents=True, exist_ok=True)

    print("==================================================")
    print("STEP 1: Run default scripts/verify_docstringer.py")
    print("==================================================")
    cmd_verify = [sys.executable, str(verify_script)]
    res_verify = subprocess.run(cmd_verify, capture_output=True, text=True)
    print(f"verify_docstringer.py returncode: {res_verify.returncode}")
    print(f"STDOUT:\n{res_verify.stdout}")
    if res_verify.stderr:
        print(f"STDERR:\n{res_verify.stderr}")
    
    # ---------------------------------------------------------
    # STRESS TEST CASES
    # ---------------------------------------------------------
    
    # Case 1: Multi-byte UTF-8 in Python and TS/TSX
    utf8_py = test_harness_dir / "utf8_test.py"
    utf8_py_content = (
        "# 🚀 Multi-byte test comments: こんにちは, 世界! 🌍✨\n"
        "HEADER_STR = '🔥 🌐 漢字 語录'\n\n"
        "def process_multibyte_string(text: str = '🎉 Hello 🌍') -> str:\n"
        "    return text + ' 🚀 processed'\n\n"
        "class MultiByteHandler:\n"
        "    def format_entry(self, key: str = '🔑 key', val: str = '💡 value') -> str:\n"
        "        return f'{key}: {val} 🌟'\n"
    )
    utf8_py.write_text(utf8_py_content, encoding='utf-8')

    utf8_ts = test_harness_dir / "utf8_test.ts"
    utf8_ts_content = (
        "// 🎨 Multi-byte TypeScript test: こんにちは\n"
        "const EMOTICONS = ['😃', '🚀', '🌟', 'こんにちは'];\n\n"
        "export function greetMultiByte(name: string = 'ユーザー'): string {\n"
        "    return `こんにちは, ${name}! 🚀`;\n"
        "}\n\n"
        "export const arrowMultiByte = (item: string): string => {\n"
        "    return `Item: ${item} 💎`;\n"
        "};\n"
    )
    utf8_ts.write_text(utf8_ts_content, encoding='utf-8')

    # Case 2: Typed Python functions (type annotations, decorators, async, multiline signature)
    typed_py = test_harness_dir / "typed_test.py"
    typed_py_content = (
        "from typing import List, Dict, Optional, Tuple, Union, Callable\n"
        "import asyncio\n\n"
        "def decorator_one(func: Callable) -> Callable:\n"
        "    def wrapper(*args, **kwargs):\n"
        "        return func(*args, **kwargs)\n"
        "    return wrapper\n\n"
        "@decorator_one\n"
        "async def compute_complex_payload(\n"
        "    data_items: List[Dict[str, Union[int, str]]],\n"
        "    timeout_ms: int = 5000,\n"
        "    flag: Optional[bool] = None\n"
        ") -> Tuple[bool, List[str]]:\n"
        "    await asyncio.sleep(0.01)\n"
        "    return True, [str(item) for item in data_items]\n"
    )
    typed_py.write_text(typed_py_content, encoding='utf-8')

    # Case 3: TS/TSX Arrow Functions & JSX
    tsx_arrow = test_harness_dir / "arrow_test.tsx"
    tsx_arrow_content = (
        "import React from 'react';\n\n"
        "export interface ButtonProps {\n"
        "    label: string;\n"
        "    onClick: () => void;\n"
        "}\n\n"
        "export const CustomButton: React.FC<ButtonProps> = ({ label, onClick }) => {\n"
        "    const handleClick = () => {\n"
        "        onClick();\n"
        "    };\n"
        "    return <button onClick={handleClick}>{label}</button>;\n"
        "};\n\n"
        "export const formatLabel = (input: string): string => input.toUpperCase();\n"
    )
    tsx_arrow.write_text(tsx_arrow_content, encoding='utf-8')

    # Case 4: Nested Classes in Python and TS
    nested_py = test_harness_dir / "nested_test.py"
    nested_py_content = (
        "class OuterClass:\n"
        "    class InnerClass:\n"
        "        def inner_method(self, val: int) -> int:\n"
        "            def helper_func(x: int) -> int:\n"
        "                return x + 1\n"
        "            return helper_func(val) * 2\n"
        "    def outer_method(self) -> str:\n"
        "        return 'outer'\n"
    )
    nested_py.write_text(nested_py_content, encoding='utf-8')

    nested_ts = test_harness_dir / "nested_test.ts"
    nested_ts_content = (
        "class OuterContainer {\n"
        "    private innerValue: number = 42;\n"
        "    static InnerService = class {\n"
        "        static execute(): void {\n"
        "            console.log('Executing inner service');\n"
        "        }\n"
        "    };\n"
        "    run(): void {\n"
        "        const localArrow = (x: number) => x * 2;\n"
        "        console.log(localArrow(this.innerValue));\n"
        "    }\n"
        "}\n"
    )
    nested_ts.write_text(nested_ts_content, encoding='utf-8')

    print("\n==================================================")
    print("STEP 2: Running docstringer.py on Stress Harness")
    print("==================================================")
    cmd_stress = [
        sys.executable,
        str(docstringer_script),
        "--target-dir",
        str(test_harness_dir),
        "--db-path",
        str(test_db_path)
    ]
    res_stress = subprocess.run(cmd_stress, capture_output=True, text=True)
    print(f"Stress test docstringer returncode: {res_stress.returncode}")
    print(f"STDOUT:\n{res_stress.stdout}")
    if res_stress.stderr:
        print(f"STDERR:\n{res_stress.stderr}")

    print("\n==================================================")
    print("STEP 3: Empirical Post-Insertion Syntax Checks")
    print("==================================================")
    
    findings = []

    # Check Python files with ast.parse
    for py_file in test_harness_dir.glob("*.py"):
        content = py_file.read_text(encoding='utf-8')
        print(f"\n--- Output of {py_file.name} ---")
        print(content)
        try:
            ast.parse(content)
            print(f"✅ AST Parse PASSED for {py_file.name}")
        except SyntaxError as se:
            err_msg = f"❌ SYNTAX ERROR in {py_file.name} at line {se.lineno}, col {se.offset}: {se.msg}\nLine content: {se.text}"
            print(err_msg)
            findings.append(err_msg)

    # Check JS/TS/TSX files with Tree-Sitter
    for ts_file in list(test_harness_dir.glob("*.ts")) + list(test_harness_dir.glob("*.tsx")):
        content = ts_file.read_text(encoding='utf-8')
        print(f"\n--- Output of {ts_file.name} ---")
        print(content)
        parser = tsx_parser if ts_file.suffix == '.tsx' else ts_parser
        tree = parser.parse(content.encode('utf-8'))
        
        def has_error_node(node):
            if node.type == 'ERROR' or node.is_missing:
                return True
            for c in node.children:
                if has_error_node(c):
                    return True
            return False

        if has_error_node(tree.root_node):
            err_msg = f"❌ TREE-SITTER SYNTAX ERROR in {ts_file.name}"
            print(err_msg)
            findings.append(err_msg)
        else:
            print(f"✅ Tree-Sitter Parse PASSED for {ts_file.name}")

    print("\n==================================================")
    print("STEP 4: Database & Embedding Integrity Verification")
    print("==================================================")
    if test_db_path.exists():
        conn = sqlite3.connect(str(test_db_path))
        c = conn.cursor()
        c.execute("SELECT id, file_path, func_name, signature, docstring, timestamp, embedding FROM functions")
        rows = c.fetchall()
        conn.close()
        print(f"Database contains {len(rows)} records.")
        for row in rows:
            rec_id, file_path, func_name, signature, docstring, timestamp, embedding_blob = row
            print(f" - ID: {rec_id} | Func: {func_name} | Docstring: '{docstring[:40]}...'")
            if embedding_blob is None or len(embedding_blob) == 0 or len(embedding_blob) % 4 != 0:
                findings.append(f"❌ INVALID EMBEDDING BLOB for {rec_id}")
            else:
                num_floats = len(embedding_blob) // 4
                floats = struct.unpack(f'{num_floats}f', embedding_blob)
                print(f"   Embedding vector: {len(floats)} floats")
    else:
        findings.append("❌ Database was not created!")

    print("\n==================================================")
    print("TEST SUITE SUMMARY OF FINDINGS")
    print("==================================================")
    if not findings:
        print("🎉 ALL EMPIRICAL TESTS PASSED WITHOUT ANY ISSUES!")
    else:
        print(f"⚠️ FOUND {len(findings)} ISSUES:")
        for f in findings:
            print(f)

if __name__ == "__main__":
    run_tests()
