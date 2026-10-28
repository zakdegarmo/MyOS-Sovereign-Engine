# Technical Analysis: Tree-Sitter Availability and AST Node Patterns

## 1. Executive Summary

This report presents an investigation into the `tree-sitter` Python environment availability, language binding initialization semantics, and AST node patterns for Python, JavaScript, and TypeScript/TSX.

All required packages (`tree_sitter` v0.26.0, `tree_sitter_python`, `tree_sitter_javascript`, `tree_sitter_typescript`) are installed and verified in the environment. This document outlines the modern constructor patterns for `Language` and `Parser` under `tree_sitter` v0.22+ / v0.26.0, exact AST node types across all target languages, and robust algorithms for docstring / JSDoc comment extraction.

---

## 2. Environment Verification & Instantiation Semantics

### 2.1 Package Verification Results

| Package | Status | Detected Version | API Exports |
|---|---|---|---|
| `tree_sitter` | Verified | `0.26.0` | `Language`, `Parser`, `Query`, `Node`, `Tree`, `TreeCursor` |
| `tree_sitter_python` | Verified | Installed | `language()`, `HIGHLIGHTS_QUERY`, `TAGS_QUERY` |
| `tree_sitter_javascript` | Verified | Installed | `language()`, `HIGHLIGHTS_QUERY`, `INJECTIONS_QUERY`, `LOCALS_QUERY`, `TAGS_QUERY` |
| `tree_sitter_typescript` | Verified | Installed | `language_typescript()`, `language_tsx()` |

### 2.2 Modern `Language` and `Parser` Instantiation (v0.22+ / v0.26.0)

In `tree-sitter` version 0.22+, language bindings return a C capsule/handle via `.language()` or `.language_typescript()` / `.language_tsx()`. This handle MUST be wrapped in `tree_sitter.Language(...)` before being passed to `tree_sitter.Parser(...)`.

#### Python Snippet for Parser Initialization

```python
import tree_sitter
import tree_sitter_python
import tree_sitter_javascript
import tree_sitter_typescript

# 1. Instantiate Language objects
PY_LANGUAGE  = tree_sitter.Language(tree_sitter_python.language())
JS_LANGUAGE  = tree_sitter.Language(tree_sitter_javascript.language())
TS_LANGUAGE  = tree_sitter.Language(tree_sitter_typescript.language_typescript())
TSX_LANGUAGE = tree_sitter.Language(tree_sitter_typescript.language_tsx())

# 2. Instantiate Parsers
py_parser  = tree_sitter.Parser(PY_LANGUAGE)
js_parser  = tree_sitter.Parser(JS_LANGUAGE)
ts_parser  = tree_sitter.Parser(TS_LANGUAGE)
tsx_parser = tree_sitter.Parser(TSX_LANGUAGE)

# Alternative (Setting parser language property post-construction)
py_parser_alt = tree_sitter.Parser()
py_parser_alt.language = PY_LANGUAGE
```

> ⚠️ **API Warning**: Legacy methods such as `tree_sitter.Parser.set_language(...)` or `tree_sitter.Language.build_library(...)` do **NOT** exist in `tree_sitter` 0.26.0 and will throw `AttributeError`.

---

## 3. Python AST Node Specification & Docstring Identification

### 3.1 Python Node Types

| Definition Type | Primary AST Node Type | Parent / Wrapper Node (if decorated) | Key Child Fields |
|---|---|---|---|
| Standard Function | `function_definition` | `decorated_definition` | `name` (`identifier`), `parameters` (`parameters`), `return_type`, `body` (`block`) |
| Async Function | `function_definition` | `decorated_definition` | Contains `async` child token, `name`, `parameters`, `body` (`block`) |
| Class Definition | `class_definition` | `decorated_definition` | `name` (`identifier`), `superclasses` (`argument_list`), `body` (`block`) |
| Class Method | `function_definition` | `decorated_definition` | Inside `class_definition` `body` (`block`) |

### 3.2 Python Docstring Node Structure & Detection Algorithm

Per Python PEP 257, a docstring is a string literal occurring as the **first statement** in a module, function definition, or class definition.

In tree-sitter Python AST:
1. Access the `body` field of the `function_definition` or `class_definition` node:
   ```python
   body_node = node.child_by_field_name('body')  # node type: 'block'
   ```
2. Inspect `body_node.children`:
   - Ignore any initial `comment` nodes.
   - The first non-comment statement in `body_node.children` represents the body's initial statement.
3. Check if the statement is an `expression_statement`:
   - If `first_stmt.type == 'expression_statement'` and `len(first_stmt.children) > 0`:
   - Check if `first_stmt.children[0].type` is `'string'` or `'concatenated_string'`.
4. If true, extract the text of `first_stmt.children[0]` as the existing docstring.
5. If the first statement is NOT an `expression_statement` containing a `string` (e.g. it is `return`, `pass`, `assignment`, `if_statement`, etc.), then **no docstring is present**.

---

## 4. JavaScript AST Node Specification & JSDoc Comment Identification

### 4.1 JavaScript Node Types

| Definition Type | AST Node Type | Key Child Fields / Structure |
|---|---|---|
| Function Declaration | `function_declaration` | `name` (`identifier`), `parameters` (`formal_parameters`), `body` (`statement_block`) |
| Class Declaration | `class_declaration` | `name` (`identifier`), `body` (`class_body`) |
| Class / Object Method | `method_definition` | `name` (`property_identifier`), `parameters` (`formal_parameters`), `body` (`statement_block`) |
| Arrow Function | `arrow_function` | `parameters` (`formal_parameters` or `identifier`), `body` (`statement_block` or expression) |
| Generator Function | `generator_function_declaration` | Contains `*` child token, `name`, `parameters`, `body` |
| Exported Declaration | `export_statement` | Parent node wrapping `function_declaration`, `class_declaration`, or `lexical_declaration` |

> Note: Variable-assigned functions (`const foo = () => {}` or `const bar = function() {}`) are structured as `lexical_declaration` -> `variable_declarator` (name: `identifier`, value: `arrow_function` or `function_expression`).

### 4.2 JavaScript JSDoc / Comment Detection Algorithm

Unlike Python where docstrings reside inside the function body, JavaScript JSDoc comments (`/** ... */`) exist as separate `comment` nodes placed **outside and immediately prior** to the declaration node.

1. For any declaration node (`function_declaration`, `class_declaration`, `method_definition`, `export_statement`, `lexical_declaration`):
2. Inspect the node's `prev_sibling` (or iterate backward in `node.parent.children` starting before `node`):
3. If `prev_sibling.type == 'comment'`:
   - Check text format: `comment_text.startswith('/**')` or `comment_text.startswith('/*')`.
   - Check proximity: `node.start_point.line - prev_sibling.end_point.line <= 1` (ensures the comment directly precedes the declaration without blank line gaps or intervening code).
4. If the declaration is exported (e.g. `export function foo() {}`), the AST root for the declaration is `export_statement`. The JSDoc comment precedes the `export_statement` node.

---

## 5. TypeScript & TSX AST Node Specification & Comment Identification

### 5.1 TypeScript / TSX Node Types

| Definition Type | AST Node Type | Language Engine | Key Child Fields / Structure |
|---|---|---|---|
| Function Declaration | `function_declaration` | TS / TSX | Includes optional `type_parameters`, parameter types, `return_type` |
| Method Definition | `method_definition` | TS / TSX | May include modifiers (`public`, `private`, `protected`, `readonly`, `static`, `override`) |
| Class Declaration | `class_declaration` | TS / TSX | `name` (`type_identifier`), `body` (`class_body`) |
| Interface Declaration | `interface_declaration` | TS / TSX | `name` (`type_identifier`), `body` (`interface_body`) |
| Type Alias | `type_alias_declaration` | TS / TSX | `name` (`type_identifier`), `value` (`object_type`, `union_type`, etc.) |
| Abstract Method | `abstract_method_definition` | TS / TSX | Method in abstract class |
| Arrow Function Component | `arrow_function` | TS / TSX | Nested inside `lexical_declaration` |

### 5.2 TS / TSX Parser Selection Matrix

- `.ts` files: Parse using `ts_parser = tree_sitter.Parser(tree_sitter.Language(tree_sitter_typescript.language_typescript()))`
- `.tsx` files: Parse using `tsx_parser = tree_sitter.Parser(tree_sitter.Language(tree_sitter_typescript.language_tsx()))`

### 5.3 Comment Identification in TS / TSX

Comment identification follows the exact same algorithm as JavaScript:
- Preceding `prev_sibling` node of type `comment` (JSDoc `/** ... */`).
- Handling of `export_statement` wrappers.
- Proximity check on line position (`declaration.start_point.line - comment.end_point.line <= 1`).

---

## 6. Summary Matrix of Node Identifiers across Languages

| Language | Definition Kind | AST Node Type | Preceding Wrapper Node | Docstring/Comment Location |
|---|---|---|---|---|
| **Python** | Function | `function_definition` | `decorated_definition` | Inside `body` (`block`), 1st statement (`expression_statement` -> `string`) |
| **Python** | Class | `class_definition` | `decorated_definition` | Inside `body` (`block`), 1st statement (`expression_statement` -> `string`) |
| **JavaScript** | Function | `function_declaration` | `export_statement` | Outside: `prev_sibling` of type `comment` (`/** ... */`) |
| **JavaScript** | Class | `class_declaration` | `export_statement` | Outside: `prev_sibling` of type `comment` (`/** ... */`) |
| **JavaScript** | Method | `method_definition` | None | Outside: `prev_sibling` of type `comment` (`/** ... */`) |
| **JavaScript** | Arrow Func | `arrow_function` | `lexical_declaration` / `export_statement` | Outside: `prev_sibling` of parent `lexical_declaration` / `export_statement` |
| **TypeScript** | Function | `function_declaration` | `export_statement` | Outside: `prev_sibling` of type `comment` (`/** ... */`) |
| **TypeScript** | Class | `class_declaration` | `export_statement` | Outside: `prev_sibling` of type `comment` (`/** ... */`) |
| **TypeScript** | Interface | `interface_declaration` | `export_statement` | Outside: `prev_sibling` of type `comment` (`/** ... */`) |
| **TypeScript** | Type Alias | `type_alias_declaration` | `export_statement` | Outside: `prev_sibling` of type `comment` (`/** ... */`) |
