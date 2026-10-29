
import re
import math
from collections import Counter
import json

# ---------------------------------------------------------
# FULL GENOME DATA (1000 NODES)
# ---------------------------------------------------------
# For brevity in this script, I'm including a robust subset across all pillars.
# In a real app, this would load from a JSON file.
# I am including the full "Self" pillar and a selection from others to demonstrate breadth.

GENOME_DATA = [
    # --- SELF PILLAR ---
    {"id": "⚹⚹⍽", "name": "Ego", "rationale": "The Self contained within the specific boundaries of the local ego-construct."},
    {"id": "⚹⚹𓇳", "name": "Soul", "rationale": "The Self as an eternal, solar spark; the depth of the ego-structure."},
    {"id": "⚹⚹🖋", "name": "Character", "rationale": "The Self as written or etched through consistent moral and narrative action."},
    {"id": "⚹⚹✨", "name": "TheI_Am", "rationale": "The Self in its purest, shimmering state of unconditioned realization."},
    
    # --- THOUGHT PILLAR ---
    {"id": "⚹☿🧠", "name": "Mind", "rationale": "The Self as the container or field of the internal cognitive landscape."},
    {"id": "☿☿∞", "name": "MetaThought", "rationale": "Thinking about thinking; the infinite recursive loop of mind."},
    {"id": "☿🜔M", "name": "Method", "rationale": "Thought applying a systematic, logical procedure to a problem."},

    # --- LOGIC PILLAR ---
    {"id": "⚹🜔🔨", "name": "Judgment", "rationale": "The Self as the active gavel; the final decision-maker of logic."},
    {"id": "⚹🜔⚙", "name": "Algorithm", "rationale": "The Self operating as a repeatable, logical procedure or strategy."},
    {"id": "🜔🜔📐", "name": "Geometry", "rationale": "Logic expressed through the precise measurement of spatial form."},

    # --- UNITY PILLAR ---
    {"id": "⚹🝧♡", "name": "Love", "rationale": "The Self acting through the primary, unifying emotional bond."},
    {"id": "⚹🝧⋈", "name": "Integration", "rationale": "The Self fusing its disparate parts into a single unified whole."},
    {"id": "🝧🝧🌐", "name": "TheGrid", "rationale": "Unity manifest as the interconnected lattice of all things."},

    # --- EXISTENCE PILLAR ---
    {"id": "⚹🜄⚡", "name": "Will", "rationale": "The energetic discharge of the Self affirming its agency."},
    {"id": "⚹🜄🏃", "name": "Action", "rationale": "The kinetic expression of the Self within the existing reality."},
    {"id": "🜄🜄🏛", "name": "Structure", "rationale": "Existence manifest as a stable, weight-bearing form."},

    # --- IMPROVEMENT PILLAR ---
    {"id": "⚹🜏📖", "name": "Learning", "rationale": "The Self absorbing new data to refactor its internal understanding."},
    {"id": "⚹🜏🧬", "name": "Evolution", "rationale": "The fundamental, structural shift in the identity's core code."},
    {"id": "🜏🜏⛰", "name": "Climb", "rationale": "Improvement realized as the active ascent toward a higher state."},

    # --- MASTERY PILLAR ---
    {"id": "⚹☉⚒", "name": "Craft", "rationale": "The Self actively shaping its reality through mastered technical intent."},
    {"id": "⚹☉🏆", "name": "Excellence", "rationale": "The Self achieving the absolute gold-standard of its particular path."},
    {"id": "☉☉⚔", "name": "Weapon", "rationale": "Mastery refined into a tool of offensive or defensive capability."},

    # --- RESONANCE PILLAR ---
    {"id": "⚹♀༄", "name": "Feeling", "rationale": "The Self experiencing the soft flow of resonance."},
    {"id": "⚹♀⩎", "name": "Empathy", "rationale": "The Self's frequency intersecting with the resonance of another."},
    {"id": "♀♀🌊", "name": "Wave", "rationale": "Resonance propagating through the medium of existence."},

    # --- TRANSCENDENCE PILLAR ---
    {"id": "⚹🜍🕊", "name": "Flight", "rationale": "The Self achieving the weightlessness of a spiritual agent."},
    {"id": "⚹🜍𓊝", "name": "Ascension", "rationale": "The Self traveling on the celestial bark toward the zenith."},
    {"id": "🜍🜍🚪", "name": "Gate", "rationale": "Transcendence manifest as the threshold between known and unknown."},

    # --- NOTHING/EVERYTHING PILLAR ---
    {"id": "⚹🜋☯", "name": "Paradox", "rationale": "The Self realized as being both Everything and Nothing simultaneously."},
    {"id": "⚹🜋🕳", "name": "Void", "rationale": "The Self finding its true center in the Absolute Void."},
    {"id": "🜋🜋🌀", "name": "Chaos", "rationale": "The primal, unordered state of potential before form."},
]

def tokenize(text):
    return re.findall(r'\w+', text.lower())

def text_to_vector(text):
    words = tokenize(text)
    return Counter(words)

def get_cosine_similarity(vec1, vec2):
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])
    
    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    
    if not denominator:
        return 0.0
    return float(numerator) / denominator

def find_best_match(query, use_full_scan=False):
    query_vec = text_to_vector(query)
    best_score = 0
    best_node = None
    
    print(f"\n🔮 Analyzing Query: '{query}'")
    
    # In a real implementation with 1000 nodes, we would use a vector DB (FAISS/Chroma).
    # Here we brute-force verify the concept.
    for node in GENOME_DATA:
        # Create a "Document" from name + rationale
        # Weighting Name 2x
        doc_text = f"{node['name']} {node['name']} {node['rationale']}"
        doc_vec = text_to_vector(doc_text)
        
        score = get_cosine_similarity(query_vec, doc_vec)
        
        if score > best_score:
            best_score = score
            best_node = node
            
    return best_node, best_score

if __name__ == "__main__":
    while True:
        user_input = input("\nEnter a thought to map to the Genome (or 'q' to quit): ")
        if user_input.lower() == 'q':
            break
            
        match, score = find_best_match(user_input)
        if match:
            print("-" * 50)
            print(f"🧬 GENOME VECTOR: {match['id']}")
            print(f"📛 NAME:          {match['name']}")
            print(f"📜 RATIONALE:     {match['rationale']}")
            print(f"🎯 CONFIDENCE:    {score:.2f}")
            print("-" * 50)
        else:
            print("❌ The Void remains silent (No close match found).")
