import re
import json
import uuid
import datetime

SCRIBE_FILE = "G:/My Drive/MystraRoot/ScribeConversationStartJuly4th2025.md"
OUTPUT_FILE = "apps/web/src/Thought/data/scribe_library.json"

def parse_scribe():
    print(f"Reading {SCRIBE_FILE}...")
    try:
        with open(SCRIBE_FILE, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Split by "Show thinking" which seems to be the specialized delimiter in this log
    # The text BEFORE "Show thinking" is typically the User prompt + Metadata
    # The text AFTER is the Model response
    chunks = content.split("Show thinking")
    
    library_items = []
    
    # Skip the first chunk if it's just header/empty
    start_index = 1 if len(chunks) > 1 else 0
    
    print(f"Found {len(chunks)} segments. Processing...")

    for i in range(start_index, len(chunks)):
        # The current chunk is the Model's response + The Next User's Prompt
        # This split strategy is tricky. 
        # Actually, "Show thinking" marks the START of the AI's turn.
        # So chunk[i] contains:
        # 1. The AI's thought process (block)
        # 2. The AI's actual response
        # 3. The User's NEXT prompt (until the next "Show thinking")
        
        # Let's try to extract the Thought block first
        segment = chunks[i]
        
        # Simple heuristic: The thought block usually ends with a specific pattern or just distinct formatting
        # But looking at the file, it might be easier to treat each "Show thinking" as a separator
        # and just dump the whole segment as a "Conversation Node"
        
        # Clean up the text
        clean_text = segment.strip()
        
        # Extract timestamp if present in the previous chunk's end or this chunk's start
        # The "UID" and "SERIAL" often appear right after "Show thinking" in the logs I saw
        
        title = f"Conversation Fragment {i}"
        
        # Try to find a Serial Number
        serial_match = re.search(r"SERIAL: ([\w-]+)", clean_text)
        if serial_match:
            title = serial_match.group(1)
            
        # Create a Library Item
        item = {
            "id": str(uuid.uuid4()),
            "title": title,
            "deweyCategory": "000", # General Knowledge by default
            "deweyCode": "000.1",
            "content": clean_text[:5000], # Trucate for JSON size health, or keep full? Let's limit for now.
            "tags": ["scribe-log", "archive", "auto-ingest"],
            "pillarConnections": ["Thought", "Memory"],
            "timestamp": int(datetime.datetime.now().timestamp() * 1000),
            "type": "knowledge"
        }
        
        library_items.append(item)

    print(f"Parsed {len(library_items)} items.")
    
    # Write to JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(library_items, f, indent=2)
        
    print(f"Successfully wrote to {OUTPUT_FILE}")

if __name__ == "__main__":
    parse_scribe()
