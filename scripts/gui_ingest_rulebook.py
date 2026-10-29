#!/usr/bin/env python3
"""
GUI Rulebook Ingestor - Native Windows File Picker for /ingestRulebook
Opens a Windows File Picker dialog to select a D&D rulebook/PDF, prompts for the book name, and ingests it into SQLite Vector Store.
"""

import os
import sys
import tkinter as tk
from tkinter import filedialog, simpledialog, messagebox
import subprocess

def run_gui_picker():
    root = tk.Tk()
    root.withdraw() # Hide main root window
    root.attributes('-topmost', True) # Bring dialog to front

    print("[*] Opening Windows File Picker dialog...")
    file_path = filedialog.askopenfilename(
        title="Select 5e Rulebook, Sourcebook, or Campaign File",
        filetypes=[
            ("All Supported Formats", "*.pdf *.md *.txt *.json *.markdown"),
            ("PDF Documents", "*.pdf"),
            ("Markdown / Text Files", "*.md *.txt *.markdown"),
            ("JSON Datasets", "*.json")
        ]
    )

    if not file_path:
        print("[!] Ingestion cancelled by user.")
        return

    # Deduce default book name from filename
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    default_book = base_name.replace("_", " ").replace("-", " ").title()

    book_name = simpledialog.askstring(
        "5e Rulebook Title",
        f"Enter the canonical title for this book:\n(Selected file: {os.path.basename(file_path)})",
        initialvalue=default_book
    )

    if not book_name:
        print("[!] Ingestion cancelled: No book name provided.")
        return

    print(f"[+] Ingesting '{book_name}' from: {file_path}")
    
    script_path = os.path.join(os.path.dirname(__file__), "ingest_rulebook.py")
    cmd = [
        sys.executable,
        script_path,
        "--file", file_path,
        "--book", book_name
    ]

    try:
        res = subprocess.run(cmd, check=True)
        messagebox.showinfo("Ingestion Complete", f"Successfully ingested '{book_name}' into MyOS Vector DB!")
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Ingestion Error", f"Failed to ingest book:\n{e}")

if __name__ == "__main__":
    run_gui_picker()
