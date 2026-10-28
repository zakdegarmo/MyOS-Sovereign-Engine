import re
import json
import os

class Categorizer:
    # Load the official mapping if available
    DEWEY_MAPPING_FILE = "apps/web/src/Thought/data/dewey_mapping.json"
    DEWEY_LOOKUP = {}
    
    try:
        if os.path.exists(DEWEY_MAPPING_FILE):
            with open(DEWEY_MAPPING_FILE, "r", encoding="utf-8") as f:
                DEWEY_LOOKUP = json.load(f)
                # Invert for keyword search (Subject -> Code)
                # Actually DEWEY_LOOKUP is Subject -> Code already.
                # We need to keys for searching.
    except Exception:
        pass

    # Dewey Decimal Mapping (000-999)
    # Merging User's Gaming Taxonomy (700s) with General Subjects
    DEWEY_CODES = {
        # 000 - Generalities & Computer Science
        "CS_AI": "006",       # Artificial Intelligence
        "SYSTEMS": "004",     # Computer Systems / OS
        "GENERAL": "000",     # Unclassified
        
        # 100 - Philosophy & Psychology
        "PHILOSOPHY": "100",  # General Philosophy
        "SELF": "150",        # Psychology / Self
        "LOGIC": "160",       # Logic
        
        # 200 - Religion
        "SPIRITUALITY": "200",# Mystra / Soul / Theology
        
        # 300 - Social Sciences
        "SOCIETY": "300",     # Social / Politics
        
        # 400 - Language
        "LANGUAGE": "400",    # NLD / Linguistics
        
        # 500 - Science
        "MATH": "510",        # Mathematics
        "PHYSICS": "530",     # Physics
        
        # 600 - Technology
        "ENGINEERING": "620", # Engineering / Drivers
        "APPLIED": "600",     # Applied Sciences
        
        # 700 - The Arts (User's Gaming Taxonomy)
        "SYSTEM_ART": "700",  # General System, Menus, Fonts
        "CHARACTERS": "710",  # Playable / Main Characters
        "ENEMIES": "720",     # Common Enemies
        "BOSSES": "730",      # Bosses / Big Bad
        "LEVELS": "740",      # Maps / Tilesets / Backgrounds
        "NPCS": "750",        # Non-Playable Characters / Victims
        "HAZARDS": "760",     # Traps / Hazards
        "MUSIC": "780",       # Music / Sound
        
        # 800 - Literature
        "FICTION": "800",     # Narrative / Story / Chronicles
        "POETRY": "810",      # Poetry
        
        # 900 - History
        "HISTORY": "900",     # History / Biography
        "BIOGRAPHY": "920"    # Biography
    }

    # Keyword patterns for mapping
    PATTERNS = {
        # 700s (User Defined)
        "CHARACTERS": [r"playable", r"hero", r"protagonist", r"main", r"player", r"intro", r"stat", r"select", r"gary", r"mindy"],
        "BOSSES": [r"boss", r"guardian", r"king", r"queen", r"overlord", r"final", r"giant", r"super"],
        "ENEMIES": [r"enemy", r"monster", r"creature", r"goon", r"minion", r"mob", r"zombie", r"soldier", r"demon", r"ghost", r"bot"],
        "LEVELS": [r"level", r"map", r"stage", r"area", r"background", r"tileset", r"layout", r"room", r"exterior", r"interior", r"city", r"world"],
        "NPCS": [r"npc", r"town", r"villager", r"victim", r"rescued", r"prisoner", r"people", r"guest", r"shop"],
        "HAZARDS": [r"hazard", r"trap", r"spikes", r"flame", r"pit", r"lava", r"gas", r"mine"],
        "SYSTEM_ART": [r"font", r"menu", r"icon", r"cursor", r"ui", r"border", r"title", r"intro", r"outro", r"cutscene", r"item", r"weapon", r"powerup", r"hud", r"logo"],
        "MUSIC": [r"music", r"sound", r"audio", r"track", r"theme", r"song"],
        
        # 000s (General / CS)
        "CS_AI": [r"ai", r"artificial intelligence", r"neural", r"network", r"learning", r"model", r"gpt", r"llm", r"nld", r"algorithm", r"code", r"script", r"function", r"class", r"variable"],
        "SYSTEMS": [r"system", r"os", r"kernel", r"driver", r"hardware", r"config", r"setup", r"install", r"guide", r"manual"],
        
        # 100s (Philosophy)
        "SELF": [r"self", r"psychology", r"mind", r"identity", r"persona", r"consciousness", r"dream", r"sleep"], # 135 Sleep/Dreams per Dewey text
        "LOGIC": [r"logic", r"reason", r"deduction", r"inference", r"truth", r"falsehood"],
        "PHILOSOPHY": [r"philosophy", r"metaphysics", r"ontology", r"existentialism", r"ethics", r"moral"],
        
        # 200s (Religion)
        "SPIRITUALITY": [r"god", r"soul", r"spirit", r"mystra", r"weave", r"magic", r"divine", r"sacred", r"religion", r"theology", r"bible", r"scripture"],
        
        # 800s (Literature)
        "FICTION": [r"story", r"narrative", r"tale", r"chronicle", r"chapter", r"book", r"draft", r"plot", r"character", r"scene", r"dialogue", r"fiction", r"novel"],
        
        # 900s (History)
        "HISTORY": [r"history", r"past", r"event", r"timeline", r"era", r"age", r"period", r"date", r"year"],
        "BIOGRAPHY": [r"biography", r"life", r"memoir", r"profile"]
    }

    @classmethod
    def get_dewey(cls, name, content_sample=""):
        combined = (name + " " + content_sample).lower()
        
        # 1. Prioritize User's Gaming Categories (700s) specific overrides
        for cat in ["BOSSES", "ENEMIES", "LEVELS", "NPCS", "HAZARDS", "CHARACTERS", "SYSTEM_ART"]:
            if any(re.search(rf"\b{k}\b", name.lower()) for k in cls.PATTERNS.get(cat, [])):
                 return cls.DEWEY_CODES[cat]

        # 2. Check the Official Dewey Mapping (Exact or Fuzzy Match)
        # This is O(N) but N=764 is small enough
        for subject, code in cls.DEWEY_LOOKUP.items():
            # Check if subject/category name appears in content/filename
            # We split subject into keywords to avoid "History of Art" missing "Art History"
            # But simple substring match is safer for now
            if subject.lower() in combined:
                 return code

        # 3. General scan of combined text (Heuristic Fallback)
        best_cat = "GENERAL"
        max_hits = 0

        for cat, keywords in cls.PATTERNS.items():
            hits = sum(1 for k in keywords if re.search(rf"\b{k}\b", combined))
            if hits > max_hits:
                max_hits = hits
                best_cat = cat
        
        return cls.DEWEY_CODES.get(best_cat, "000")

    @classmethod
    def clean_tag(cls, text):
        return re.sub(r"[^a-z0-9]", "_", text.lower()).strip("_")

if __name__ == "__main__":
    # Test cases
    print(f"Julie (Main) -> {Categorizer.get_dewey('Julie', 'Main Characters')}")
    print(f"Zombie (Enemies) -> {Categorizer.get_dewey('Zombie', 'Enemies')}")
    print(f"AI Philosophy -> {Categorizer.get_dewey('AI_Philosophy.txt', 'Artificial Intelligence consciousness')}")
    print(f"Chapter 1 -> {Categorizer.get_dewey('Chapter 1.txt', 'The story begins')}")
    print(f"Mystra Algorithm -> {Categorizer.get_dewey('MystraAlgo.py', 'code class function')}")
