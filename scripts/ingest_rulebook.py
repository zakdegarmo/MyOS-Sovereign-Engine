#!/usr/bin/env python3
"""
Universal 5e Rulebook & Campaign Module Ingestor (Supports Digital & Scanned PDFs)
Ingests PDF, ePub, Markdown, JSON, or Text rulebooks & campaign modules into the MyOS SQLite Vector DB.
Includes automatic local Ollama Vision OCR fallback for scanned PDFs and exponential backoff retries.
"""

import argparse
import base64
import datetime
import json
import os
import sqlite3
import struct
import time
import urllib.request
import uuid

DEFAULT_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "myos_vector_store.db"))

def parse_args():
    parser = argparse.ArgumentParser(description="Ingest any 5e rulebook or campaign module into MyOS Vector DB.")
    parser.add_argument("--file", type=str, required=True, help="Path to PDF, TXT, MD, or JSON source file.")
    parser.add_argument("--book", type=str, required=True, help="Canonical book name (e.g. 'Tasha's Cauldron of Everything').")
    parser.add_argument("--category", type=str, default="rulebook", help="Category: rulebook, campaign, monster_manual, expansion.")
    parser.add_argument("--db-path", type=str, default=DEFAULT_DB_PATH, help="Path to SQLite database file.")
    parser.add_argument("--ollama-url", type=str, default="http://localhost:11434", help="Base URL for local Ollama API.")
    parser.add_argument("--embed-model", type=str, default="mxbai-embed-large:latest", help="Ollama model for generating embeddings.")
    parser.add_argument("--ocr-model", type=str, default="llava:latest", help="Ollama vision model for OCR fallback on scanned PDFs.")
    parser.add_argument("--chunk-size", type=int, default=1000, help="Character count per chunk.")
    parser.add_argument("--overlap", type=int, default=150, help="Overlap characters between chunks.")
    return parser.parse_args()

def ocr_page_image(ollama_url, ocr_model, image_bytes, retries=3):
    url = f"{ollama_url}/api/generate"
    b64_img = base64.b64encode(image_bytes).decode('utf-8')
    payload = json.dumps({
        "model": ocr_model,
        "prompt": "Transcribe all text from this D&D rulebook page accurately. Output ONLY the transcribed text.",
        "images": [b64_img],
        "stream": False
    }).encode('utf-8')
    
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return data.get("response", "").strip()
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2.0 * (attempt + 1))
            else:
                print(f"[!] OCR Vision error after retries: {e}")
                return ""

def extract_text_from_file(file_path, ollama_url="http://localhost:11434", ocr_model="llava:latest"):
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    if ext in ['.txt', '.md', '.markdown']:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
    elif ext == '.json':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            data = json.load(f)
            if isinstance(data, list):
                text = "\n\n".join([json.dumps(item) if isinstance(item, dict) else str(item) for item in data])
            else:
                text = json.dumps(data, indent=2)
    elif ext == '.pdf':
        try:
            import fitz # PyMuPDF
            doc = fitz.open(file_path)
            pages = []
            print(f"[*] Extracting {len(doc)} pages using PyMuPDF...")
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                if page_text and len(page_text.strip()) > 30:
                    pages.append(f"--- PAGE {page_num + 1} ---\n{page_text.strip()}")
                else:
                    print(f"[*] Page {page_num + 1} appears to be a scanned image. Running local vision OCR ({ocr_model})...")
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    transcription = ocr_page_image(ollama_url, ocr_model, img_bytes)
                    if transcription:
                        pages.append(f"--- PAGE {page_num + 1} (OCR) ---\n{transcription}")

            text = "\n\n".join(pages)
            print(f"[+] Extraction complete across {len(pages)} pages.")
        except ImportError:
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                pages = []
                for idx, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        pages.append(f"--- PAGE {idx + 1} ---\n{page_text}")
                text = "\n\n".join(pages)
                print(f"[+] Extracted {len(pages)} pages using pypdf fallback.")
            except Exception as e:
                print(f"[!] PDF Extraction error: {e}")
                return None
    else:
        print(f"[!] Unsupported file extension: {ext}")
        return None
        
    return text

def chunk_text(text, chunk_size=1000, overlap=150):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start += (chunk_size - overlap)
    return chunks

def get_embedding(ollama_url, model, text, retries=3):
    url = f"{ollama_url}/api/embeddings"
    payload = json.dumps({
        "model": model,
        "prompt": text
    }).encode('utf-8')
    
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return data.get("embedding")
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1.0 * (attempt + 1))
            else:
                print(f"[!] Embedding error: {e}")
                return None

def main():
    args = parse_args()
    
    if not os.path.exists(args.file):
        print(f"[!] File not found: {args.file}")
        return

    print(f"[*] Reading source file: {args.file}...")
    full_text = extract_text_from_file(args.file, args.ollama_url, args.ocr_model)
    if not full_text:
        print("[!] No text could be extracted.")
        return

    chunks = chunk_text(full_text, args.chunk_size, args.overlap)
    print(f"[+] Total Chunks Created: {len(chunks)}")

    os.makedirs(os.path.dirname(args.db_path), exist_ok=True)
    conn = sqlite3.connect(args.db_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vectors (
            id TEXT PRIMARY KEY,
            type TEXT,
            timestamp TEXT,
            text TEXT,
            embedding BLOB
        );
    """)
    conn.commit()

    inserted_count = 0
    for idx, chunk in enumerate(chunks):
        formatted_text = f"BOOK: {args.book}\nCATEGORY: {args.category}\nSOURCE: {os.path.basename(args.file)}\nCHUNK: {idx+1}/{len(chunks)}\n\n{chunk}"
        
        print(f"[{idx+1}/{len(chunks)}] Embedding chunk ({len(chunk)} chars)...", end="\r")
        embedding = get_embedding(args.ollama_url, args.embed_model, formatted_text)
        
        if embedding:
            blob = struct.pack(f'{len(embedding)}f', *embedding)
            node_id = str(uuid.uuid4())
            ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            cursor.execute(
                "INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)",
                (node_id, "rule_node", ts, formatted_text, blob)
            )
            inserted_count += 1
            if inserted_count % 25 == 0:
                conn.commit()

    conn.commit()
    conn.close()
    print(f"\n[SUCCESS] Ingested {inserted_count} vector chunks from '{args.book}' into {args.db_path}!")

if __name__ == "__main__":
    main()
