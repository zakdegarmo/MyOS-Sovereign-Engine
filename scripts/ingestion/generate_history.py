import os
import json
from datetime import datetime

brain_dir = r"C:\Users\zakde\.gemini\antigravity\brain"
output_file = r"c:\Users\zakde\Downloads\the-mystra-nexus (12)\All_Old_Conversations.md"

markdown = "# All Past Conversations\n\nYour older conversations are not deleted! The UI simply hides them after 20 to keep things fast. Here is a complete record of everything saved in your `brain` folder.\n\n"
markdown += "| Date | Conversation ID | Summary |\n"
markdown += "|---|---|---|\n"

conversations = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if os.path.isdir(folder_path):
        if folder.startswith('.') or folder == 'tempmediaStorage': continue
        summary = "No task summary available"
        metadata_path = os.path.join(folder_path, "task.md.metadata.json")
        walkthrough_path = os.path.join(folder_path, "walkthrough.md.metadata.json")
        
        # Try walkthrough first
        if os.path.exists(walkthrough_path):
            try:
                with open(walkthrough_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if "summary" in data:
                        summary = data["summary"]
            except: pass
            
        # If no walkthrough summary or it's still default, try task
        if os.path.exists(metadata_path) and summary == "No task summary available":
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if "summary" in data:
                        summary = data["summary"]
            except: pass
            
        # Get modified time of folder
        mtime = os.path.getmtime(folder_path)
        date_str = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')
        
        conversations.append({
            "date": date_str,
            "id": folder,
            "summary": summary,
            "mtime": mtime
        })

# Sort by date descending
conversations.sort(key=lambda x: x["mtime"], reverse=True)

for conv in conversations:
    # Clean up summary newlines
    clean_summary = conv["summary"].replace('\n', ' ').replace('\r', '').replace('|', ',')
    markdown += f"| {conv['date']} | `{conv['id']}` | {clean_summary} |\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(markdown)

print("Done generating history!")
