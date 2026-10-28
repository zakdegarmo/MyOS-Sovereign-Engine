import re

SCRIBE_FILE = "G:/My Drive/MystraRoot/ScribeConversationStartJuly4th2025.md"

def analyze():
    try:
        with open(SCRIBE_FILE, "r", encoding="utf-8") as f:
            content = f.read()
        
        uids = re.findall(r"UID: ", content)
        serials = re.findall(r"SERIAL: ", content)
        show_thinking = re.findall(r"Show thinking", content)
        
        print(f"Total Length: {len(content)} characters")
        print(f"UID count: {len(uids)}")
        print(f"SERIAL count: {len(serials)}")
        print(f"Show thinking count: {len(show_thinking)}")
        
        # Check first 500 chars
        print("\n--- First 500 chars ---")
        print(content[:500])
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze()
