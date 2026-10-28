import os
import json
import uuid
import datetime
from Categorizer import Categorizer

# Configuration
ROOT_DIR = "G:/My Drive/MystraRoot"
# Max individual file size (1MB)
MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024
# Max chunk size for JSON output (approx 50MB-100MB depending on content)
MAX_CHUNK_SIZE_ITEMS = 500 

OUTPUT_DIR = "apps/web/public/data"
MANIFEST_FILE = os.path.join(OUTPUT_DIR, "archive_manifest.json")

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Extensions to ingest (Text-based)
VALID_EXTENSIONS = {
    ".txt", ".md", ".json", ".js", ".ts", ".tsx", ".py", 
    ".html", ".css", ".xml", ".yaml", ".yml", ".ini"
}

# Directories to skip
SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", "coverage", 
    ".gemini", "__pycache__", ".vscode", ".idea",
    # Linux Kernel Filters
    "drivers", "arch", "include", "boot", "sound", "net", "fs", "mm", "block", "crypto", "security", "tools", "virt",
    "FAFO", "linux" # User specific massive folders
}

def bulk_ingest():
    print(f"Starting Bulk Ingestion from: {ROOT_DIR}")
    print(f"Target Output Directory: {OUTPUT_DIR}")
    
    current_chunk = []
    chunk_index = 0
    total_files = 0
    skipped_size = 0
    skipped_error = 0
    
    # helper to save chunk
    def save_chunk(items, index):
        filename = f"archive_part_{index}.json"
        path = os.path.join(OUTPUT_DIR, filename)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2)
            print(f"Saved chunk {index} ({len(items)} items) to {path}")
            return filename
        except Exception as e:
            print(f"Failed to save chunk {index}: {e}")
            return None

    manifest = []

    for root, dirs, files in os.walk(ROOT_DIR):
        # Modify dirs in-place to skip unwanted folders
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            
            if ext in VALID_EXTENSIONS:
                file_path = os.path.join(root, file)
                
                try:
                    # Check size first
                    try:
                        size = os.path.getsize(file_path)
                        if size > MAX_FILE_SIZE_BYTES:
                            # print(f"Skipping Large File: {file} ({size/1024/1024:.2f} MB)")
                            skipped_size += 1
                            continue
                    except:
                        pass

                    # Attempt to read file
                    content = ""
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                    except UnicodeDecodeError:
                        try:
                            # Latin-1 fallback for older files
                            with open(file_path, "r", encoding="latin-1") as f:
                                content = f.read()
                        except:
                            skipped_error += 1
                            continue

                    if not content.strip():
                        continue

                    # CATEGORIZE
                    dewey_code = Categorizer.get_dewey(file, content[:5000])
                    
                    # Create Library Item
                    item = {
                        "id": str(uuid.uuid4()),
                        "title": file,
                        "deweyCategory": dewey_code,
                        "deweyCode": dewey_code,
                        "content": content,
                        "tags": ["bulk-archive", f"dewey-{dewey_code}"],
                        "pillarConnections": [],
                        "timestamp": int(os.path.getmtime(file_path) * 1000),
                        "type": "knowledge",
                        "sourcePath": file_path
                    }
                    
                    current_chunk.append(item)
                    total_files += 1
                    
                    if len(current_chunk) >= MAX_CHUNK_SIZE_ITEMS:
                        fname = save_chunk(current_chunk, chunk_index)
                        if fname:
                            manifest.append(fname)
                        current_chunk = [] # reset
                        chunk_index += 1

                except Exception as e:
                    print(f"Error processing {file}: {e}")
                    skipped_error += 1

    # Save final chunk
    if current_chunk:
        fname = save_chunk(current_chunk, chunk_index)
        if fname:
            manifest.append(fname)
            
    print("-" * 50)
    print(f"Ingestion Complete.")
    print(f"Total Files Ingested: {total_files}")
    print(f"Skipped (Size > 1MB): {skipped_size}")
    print(f"Skipped (Error): {skipped_error}")
    
    # Write Manifest
    try:
        with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
            json.dump({"parts": manifest, "totalItems": total_files, "generatedAt": datetime.datetime.now().isoformat()}, f, indent=2)
        print(f"Successfully wrote manifest to {MANIFEST_FILE}")
    except Exception as e:
        print(f"Failed to write manifest file: {e}")

if __name__ == "__main__":
    bulk_ingest()
