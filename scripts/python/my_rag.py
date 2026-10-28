import requests
import numpy as np
import os
import json
from sklearn.metrics.pairwise import cosine_similarity

# --- CONFIGURATION ---
OLLAMA_URL = "http://localhost:11434/api"
EMBED_MODEL = "mxbai-embed-large:latest" 
LLM_MODEL = "gemma4:latest" 
# *** THE KEY CHANGE IS HERE ***
# Use a list to define all the roots of knowledge the system should scan
KNOWLEDGE_DIRS = [
    "./",
    "./my_knowledge", 
    "./my_code_projects", # <-- Example for a code folder
    "./my_philosophical_notes" # <-- Example for a notes folder
] 
# --- CHUNKING SETTINGS ---
CHUNK_SIZE = 1500  
CHUNK_OVERLAP = 200 

class SimpleRAG:
    def __init__(self):
        self.documents = []
        self.embeddings = []

    def check_models(self):
        print("--- Running Pre-Relay Model Check ---")
        try:
            response = requests.get(f"{OLLAMA_URL}/tags", timeout=5)
            available_models = [m['name'] for m in response.json().get('models', [])]
            if EMBED_MODEL not in available_models:
                print(f"CRITICAL ERROR: Embedding model '{EMBED_MODEL}' not found!")
                return False
            print(f"Success: Models verified.")
            return True
        except Exception as e:
            print(f"CRITICAL ERROR: Could not connect to Ollama ({e})")
            return False

    def get_embedding(self, text):
        try:
            response = requests.post(
                f"{OLLAMA_URL}/embeddings", 
                json={"model": EMBED_MODEL, "prompt": text},
                timeout=30
            )
            data = response.json()
            return data.get('embedding')
        except Exception as e:
            print(f"Embedding Error: {e}")
            return None

    def _chunk_text(self, text):
        """Breaks large text into smaller, overlapping pieces."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + CHUNK_SIZE
            chunk = text[start:end]
            chunks.append(chunk)
            start += (CHUNK_SIZE - CHUNK_OVERLAP)
        return chunks

    def load_knowledge(self, sector_dir=None):
        target_dirs = [sector_dir] if sector_dir else KNOWLEDGE_DIRS
        print(f"--- Loading knowledge from {target_dirs} ---")
        
        total_files_processed = 0
        total_chunks_created = 0

        # Avoid scanning heavy build or package folders
        black_holes = {'node_modules', '.venv', '.git', '__pycache__', 'dist', 'build'}

        for base_dir in target_dirs:
            if not os.path.exists(base_dir):
                print(f"WARNING: Directory not found: {base_dir}. Skipping.")
                continue

            print(f"\n>>> Scanning Directory: {base_dir}...")

            for root, dirs, files in os.walk(base_dir):
                # Prune black hole directories
                dirs[:] = [d for d in dirs if d not in black_holes]
                
                for filename in files:
                    path = os.path.join(root, filename)
                    valid_extensions = (".txt", ".py", ".md", ".json", ".js", ".ts", ".tsx")
                    
                    if filename.endswith(valid_extensions) and filename != "my_rag.py":
                        try:
                            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read().strip()
                                if content:
                                    text_chunks = self._chunk_text(content)
                                    for chunk in text_chunks:
                                        vec = self.get_embedding(chunk)
                                        if vec:
                                            self.documents.append(f"[Source: {path}] {chunk}")
                                            self.embeddings.append(vec)
                                            total_chunks_created += 1
                                    total_files_processed += 1
                                    if total_files_processed % 10 == 0:
                                        print(f"  [PROGRESS] Indexed {total_files_processed} files...")
                        except Exception as e:
                            print(f"  [ERROR] Could not read {path}: {e}")
        
        if self.embeddings:
            self.embeddings = np.array(self.embeddings)
        print(f"\n--- Done. Files Processed: {total_files_processed}, Total Chunks Indexed: {total_chunks_created} ---\n")


    def query(self, user_question):
        if not self.documents:
            return "No knowledge loaded."

        # 1. Retrieve
        question_vec = self.get_embedding(user_question)
        if question_vec is None: return "Embedding error."
        
        question_vec = np.array([question_vec])
        similarities = cosine_similarity(question_vec, self.embeddings)[0]
        best_idx = np.argmax(similarities)
        context = self.documents[best_idx]
        
        # 2. Prompt
        prompt = f"Context: {context}\n\nQuestion: {user_question}\n\nAnswer:"

        # 3. Streamed Generation
        print("AI: ", end="", flush=True)
        try:
            response = requests.post(
                f"{OLLAMA_URL}/generate", 
                json={"model": LLM_MODEL, "prompt": prompt, "stream": True},
                stream=True,
                timeout=60
            )
            
            # The streaming loop that prints text word by word
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line.decode('utf-8'))
                    token = chunk.get("response", "")
                    print(token, end="", flush=True)
                    if chunk.get("done"):
                        print()
                        break
            return "" 
        except Exception as e:
            return f"\nError during generation: {e}"

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Simple local RAG")
    parser.add_argument("--sector", type=str, help="Folder to scan")
    args = parser.parse_args()

    rag = SimpleRAG()
    if rag.check_models():
        rag.load_knowledge(sector_dir=args.sector)
        print("RAG Engine Ready. Type 'exit' to quit.")
        while True:
            try:
                user_input = input("\nUser: ")
                if user_input.lower() == 'exit': break
                if not user_input.strip(): continue

                # The query function handles printing the streaming response
                rag.query(user_input)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"\nError: {e}")
