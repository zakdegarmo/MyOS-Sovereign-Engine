import os
import json
import hashlib
from pathlib import Path

# Quarantine Lattice Protocol (QLP) - Non-Destructive Staging Inspector
# Rule #1: NEVER delete or move files automatically.
# Rule #2: Zak retains 100% sovereign veto power.

ROOT_DIR = Path(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS")

CANDIDATE_PATTERNS = [
    "*.log",
    "*_test_out.*",
    "test_*.png",
    "test_*.mp4",
    "temp_*",
    "*.tmp"
]

def audit_candidates():
    candidates = []
    for root, dirs, files in os.walk(ROOT_DIR):
        # Skip node_modules and .git
        if "node_modules" in root or ".git" in root or ".venv" in root:
            continue
        for file in files:
            path = Path(root) / file
            # Flag temporary scripts or test logs
            if file.endswith((".log", ".tmp")) or file.startswith("temp_") or "test_run" in file:
                rel_path = str(path.relative_to(ROOT_DIR))
                size = path.stat().st_size
                candidates.append({
                    "path": rel_path,
                    "size_bytes": size,
                    "state": "State Psi (Quarantine Candidate)",
                    "veto_required": True
                })
    return candidates

if __name__ == "__main__":
    print("[QLP] Initiating Non-Destructive Quarantine Audit...")
    cands = audit_candidates()
    print(f"[QLP] Found {len(cands)} candidate files for quarantine evaluation.")
    
    out_file = ROOT_DIR / "docs" / "symbiorithm" / "QUARANTINE_CANDIDATE_MANIFEST.json"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(cands, f, indent=2)
    print(f"[QLP] Candidate manifest written to: {out_file}")
    print("[QLP] ZERO files were moved or deleted. All files remain in their original paths.")
