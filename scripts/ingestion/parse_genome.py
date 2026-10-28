import re
import json

SOURCE_FILE = r"c:/Users/zakde/Downloads/the-mystra-nexus (12)/symbol reference.md"
OUTPUT_FILE = r"c:/Users/zakde/Downloads/the-mystra-nexus (12)/apps/web/src/Omni/data/FractalGenomeData.ts"

def parse_genome():
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Data structure: { Pillar: { Matrix: [ {id, name, rationale} ] } }
    genome_data = {}
    
    # Regex to find Matrix sections
    # Matrix 1: Self -> Self ("Identity")
    matrix_pattern = re.compile(r"Matrix \d+: (\w+) -> (\w+) \(\"([^\"]+)\"\)")
    
    # Regex to find Data rows
    # ⚹⚹⍽	Ego	The Self (⚹) contained...
    # It seems to be Tab separated, or just whitespace.
    # Looking at the file content: "⚹⚹⍽\tEgo\t" or "⚹⚹⍽\tEgo\n" then rationale on next line?
    # Let's look at the raw lines from the view_file output.
    # 11: ⚹⚹⍽	Ego	
    # 12: The Self (⚹) contained within...
    # It seems the Rationale is often on the NEXT line or after a tab.
    
    lines = content.splitlines()
    current_pillar = ""
    current_matrix = ""
    current_terminals = []
    
    # Pillars map to ensure we group correctly
    # But the file iterates by Pillar sections too (though implicitly).
    
    # We need to capture the PILLAR_GLYPHS too.
    # Assumed from file: Self=⚹, Thought=☿, Logic=🜔, Unity=🝧, Existence=🜄, Improvement=🜏, Mastery=☉, Resonance=♀, Transcendence=🜍, Omnipotence=🜋
    pillar_glyphs = {
        "Self": "⚹",
        "Thought": "☿",
        "Logic": "🜔",
        "Unity": "🝧",
        "Existence": "🜄",
        "Improvement": "🜏",
        "Mastery": "☉",
        "Resonance": "♀",
        "Transcendence": "🜍",
        "Omnipotence": "🜋"
    }

    # Helper to clean text
    def clean(s):
        return s.strip()

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Check for Matrix Header
        m_match = matrix_pattern.search(line)
        if m_match:
            p_name = m_match.group(1)
            target_name = m_match.group(2) # "Self" -> "Thought" means Matrix is "Thought"
            # But the key in our data structure should be the Target Name (the Matrix Name)
            
            # If we switch pillars, we need to handle that.
            if p_name != current_pillar:
                current_pillar = p_name
                if p_name not in genome_data:
                    genome_data[p_name] = {}
            
            current_matrix = target_name
            genome_data[current_pillar][current_matrix] = []
            i += 1
            continue

        # Check for Data Rows
        # They generally start with the 3 symbpl glyphs.
        # Format: G1 G2 G3 [Tab/Space] Name
        # Regex: ^([^\s]{3,})[\s\t]+(.+)$
        # Note: Some symbols are 3 chars, some might be unicode surrogates.
        # The first character is always the Pillar Glyph.
        
        # Let's try a heuristic: line starts with a glyph from our set?
        if not line:
            i += 1
            continue
            
        first_char = line[0]
        # Check against known pillar glyphs
        is_data_line = False
        for pg in pillar_glyphs.values():
            if line.startswith(pg):
                is_data_line = True
                break
        
        if is_data_line and current_matrix:
            # Parse the line
            # Default format: SYMBOL \t NAME \t RATIONALE (maybe)
            # OR SYMBOL \t NAME (newline) RATIONALE
            
            parts = re.split(r'\t+', line)
            if len(parts) >= 2:
                symbol = parts[0].strip()
                name = parts[1].strip()
                rationale = ""
                
                # Check if rationale is in this line (3rd part)
                if len(parts) > 2 and parts[2].strip():
                    rationale = parts[2].strip()
                else:
                    # Look ahead for rationale
                    # Usually the next non-empty line
                    if i + 1 < len(lines):
                        next_line = lines[i+1].strip()
                        if next_line and not any(next_line.startswith(p) for p in pillar_glyphs.values()) and not next_line.startswith("Matrix") and not next_line.startswith("Context"):
                            rationale = next_line
                            # Skip the next line
                            # i += 1 # We'll handle increment at end of loop, but we need to verify if we consumed it.
                            # Actually, let's just peek.
                            pass
                
                # Check for +1 or other noise lines to skip for rationale
                # If rationale is empty, try to find it
                if not rationale:
                     j = i + 1
                     while j < len(lines):
                        nl = lines[j].strip()
                        if not nl: 
                            j += 1
                            continue
                        if nl.startswith("+") or nl.startswith("DNA"):
                             j+=1
                             continue
                        # If it looks like a new data line or header, stop
                        if any(nl.startswith(p) for p in pillar_glyphs.values()) or nl.startswith("Matrix"):
                            break
                        
                        rationale = nl
                        break
            
                # Add to data
                entry = {
                    "id": symbol,
                    "name": name,
                    "rationale": rationale
                }
                
                # Avoid duplicates
                if entry not in genome_data[current_pillar][current_matrix]:
                     genome_data[current_pillar][current_matrix].append(entry)

        i += 1

    # Generate TypeScript File
    ts_content = f"""
// Auto-generated from symbol reference.md
// Contains the 1000-node Fractal Genome for the Mystra Nexus

export const PILLAR_GLYPHS: Record<string, string> = {json.dumps(pillar_glyphs, indent=4)};

export interface TerminalNode {{
    id: string;      // The DNA Symbol (e.g. ⚹⚹⍽)
    name: string;    // The Name (e.g. Ego)
    rationale: string; // The Definition
}}

// Structure: [Pillar] -> [Matrix] -> TerminalNode[]
export const FRACTAL_GENOME_DATA: Record<string, Record<string, TerminalNode[]>> = {json.dumps(genome_data, indent=4, ensure_ascii=False)};
"""
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(ts_content)
        
    print(f"Successfully wrote {len(genome_data)} Pillars to {OUTPUT_FILE}")
    total_nodes = 0
    for p in genome_data:
        for m in genome_data[p]:
            total_nodes += len(genome_data[p][m])
    print(f"Total Terminal Nodes Parsed: {total_nodes}")

if __name__ == "__main__":
    parse_genome()
