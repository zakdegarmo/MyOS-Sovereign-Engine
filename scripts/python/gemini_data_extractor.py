import os
import json
import shutil
import glob

# Paths
GEMINI_DIR = r"C:\Users\zakde\.gemini\antigravity-ide"
BRAIN_DIR = os.path.join(GEMINI_DIR, "brain")
KNOWLEDGE_DIR = os.path.join(GEMINI_DIR, "knowledge")
OUTPUT_DIR = os.path.join(os.getcwd(), "gemini_knowledge_dump")

def setup_output_dir():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    print(f"Output directory ready at: {OUTPUT_DIR}")

def extract_knowledge_items():
    print("\n--- Extracting Knowledge Items (Semantic Pillars & Custom Knowledge) ---")
    if not os.path.exists(KNOWLEDGE_DIR):
        print(f"Skipping: Knowledge directory not found at {KNOWLEDGE_DIR}")
        return

    # KIs contain metadata.json and an artifacts/ folder with markdown files
    for ki_folder in os.listdir(KNOWLEDGE_DIR):
        ki_path = os.path.join(KNOWLEDGE_DIR, ki_folder)
        if os.path.isdir(ki_path):
            ki_out_dir = os.path.join(OUTPUT_DIR, f"KI_{ki_folder}")
            if not os.path.exists(ki_out_dir):
                os.makedirs(ki_out_dir)
            
            # Copy all markdown artifacts
            artifacts_dir = os.path.join(ki_path, "artifacts")
            if os.path.exists(artifacts_dir):
                for file in os.listdir(artifacts_dir):
                    if file.endswith(".md"):
                        src = os.path.join(artifacts_dir, file)
                        dst = os.path.join(ki_out_dir, file)
                        shutil.copy2(src, dst)
                        print(f"Copied KI Artifact: {file}")

def extract_transcripts():
    print("\n--- Extracting Conversations (Transcripts) ---")
    if not os.path.exists(BRAIN_DIR):
        print(f"Skipping: Brain directory not found at {BRAIN_DIR}")
        return

    # Transcripts are in brain/<uuid>/.system_generated/logs/transcript.jsonl
    for convo_id in os.listdir(BRAIN_DIR):
        convo_path = os.path.join(BRAIN_DIR, convo_id)
        if os.path.isdir(convo_path):
            transcript_path = os.path.join(convo_path, ".system_generated", "logs", "transcript.jsonl")
            if os.path.exists(transcript_path):
                out_file = os.path.join(OUTPUT_DIR, f"Chat_{convo_id[:8]}.txt")
                with open(out_file, "w", encoding="utf-8") as out:
                    out.write(f"# Conversation Record: {convo_id}\n\n")
                    with open(transcript_path, "r", encoding="utf-8") as f:
                        for line in f:
                            try:
                                data = json.loads(line)
                                msg_type = data.get("type", "")
                                
                                # We only want to extract the pure conversation, not internal tool thought processes
                                if msg_type == "USER_INPUT":
                                    out.write(f"--- USER ---\n{data.get('content', '')}\n\n")
                                elif msg_type == "PLANNER_RESPONSE":
                                    # Strip the <thought> tags if they exist for clean reading
                                    content = data.get('content', '')
                                    if "<thought>" in content:
                                        import re
                                        content = re.sub(r'<thought>.*?</thought>', '', content, flags=re.DOTALL).strip()
                                    out.write(f"--- AI (Gemini) ---\n{content}\n\n")
                            except Exception as e:
                                continue
                print(f"Extracted Transcript: {convo_id[:8]}")

if __name__ == "__main__":
    print("Initializing Gemini Data Extractor for Local LLM ingestion...")
    setup_output_dir()
    extract_knowledge_items()
    extract_transcripts()
    print("\n[SUCCESS] All Gemini data has been extracted to 'gemini_knowledge_dump'.")
    print("You can now add './gemini_knowledge_dump' to KNOWLEDGE_DIRS in my_rag.py.")
