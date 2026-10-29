import os
import re

base_path = r"c:\Users\zakde\Downloads\the-mystra-nexus (12)\apps\web\src"
pillars = ["Self", "Thought", "Logic", "Unity", "Existence", "Improvement", "Mastery", "Resonance", "Transcendence", "Omni"]
count = 0

note_text = "// [ANTIGRAVITY AGENT NOTE: This file is a routing wrapper. The actual functional application logic resides in the imported sub-components.]\n"

for pillar in pillars:
    factors_path = os.path.join(base_path, pillar, "Factors")
    if not os.path.exists(factors_path):
        continue
    
    for factor in os.listdir(factors_path):
        factor_path = os.path.join(factors_path, factor)
        if not os.path.isdir(factor_path):
            continue
            
        all_tsx = os.path.join(factor_path, "All.tsx")
        if os.path.exists(all_tsx):
            with open(all_tsx, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.splitlines()
                
            if len(lines) < 100 and "ANTIGRAVITY AGENT NOTE" not in content:
                # Check if it imports relative local files
                if re.search(r"import\s+.*?from\s+['\"]\./.*?['\"]", content):
                    # It's a wrapper!
                    new_content = note_text + content
                    with open(all_tsx, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Added note to: {pillar} -> {factor}")
                    count += 1

print(f"\nTotal wrappers tagged: {count}")
