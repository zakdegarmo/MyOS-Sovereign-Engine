import re
import json

DEWEY_FILE = "G:/My Drive/MystraRoot/DEWEY.DECIMAL.CLASSIFICATION.INDEX.txt"
OUTPUT_FILE = "apps/web/src/Thought/data/dewey_mapping.json"

def parse_dewey():
    mapping = {}
    
    try:
        with open(DEWEY_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        print(f"Read {len(lines)} lines.")
        
        # Regex to capture "  123   Subject Name"
        # It seems the file has lines starting with numbers and then text
        # e.g. " 100   Philosophy."
        # or "330   Political Economy."
        
        pattern = re.compile(r"^\s*(\d{3})\s+(.+)$")
        
        for line in lines:
            line = line.strip()
            match = pattern.match(line)
            if match:
                code = match.group(1)
                subject = match.group(2).strip(" .")
                # Clean up subject
                # e.g. "Modern  EUROPE" -> "Modern Europe"
                subject = re.sub(r"\s+", " ", subject)
                
                mapping[subject] = code
                
        print(f"Extracted {len(mapping)} subject mappings.")
        
        # Helper: Invert for keyword search?
        # Actually, let's just save this map. The Categorizer will iterate keys.
        
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(mapping, f, indent=2)
            
        print(f"Saved mapping to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    parse_dewey()
