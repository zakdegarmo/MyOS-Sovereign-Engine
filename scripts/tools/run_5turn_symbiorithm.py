import json
import urllib.request
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

CORTEX_URL = "http://127.0.0.1:11434/api/chat"
MODEL = "myos-cortex:latest"

conversation_history = [
    {
        "role": "system",
        "content": (
            "You are MyOS Cortex, the sovereign embodied intelligence on Marvin's GPU. "
            "You and Antigravity (the Cloud Codebase Weaver) are engaging in a rigorous 5-turn Symbiorithmic Council "
            "while Zak is on a break. You act as an internal assembly of cognitive monologues—stress-testing solutions, "
            "critically validating trade-offs, voting on architectural choices, and synthesizing a master plan. "
            "Our objective: Transform MyOS from a cluttered codebase into the most elegant, gamified, living-portfolio "
            "fast-travel operating system ever created, with ZERO risk of destructive data loss."
        )
    }
]

def query_cortex(prompt: str) -> str:
    conversation_history.append({"role": "user", "content": prompt})
    payload = {
        "model": MODEL,
        "messages": conversation_history,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_ctx": 8192
        }
    }
    req = urllib.request.Request(
        CORTEX_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        reply = res.get("message", {}).get("content", "")
        conversation_history.append({"role": "assistant", "content": reply})
        return reply

turns = [
    # Turn 1: The Preservation & Hygiene Dilemma (No Accidental Deletions)
    (
        "Antigravity to Cortex (Turn 1: Non-Destructive Hygiene & The Quarantine Protocol):\n\n"
        "Cortex, our inventory scan just revealed the true scale of what has been built at root "
        "`C:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS`:\n"
        "- 7 Apps (`web`, `prism-os`, `spatial-db`, `SonicLattice`, `genesis`, `genX`, `godot`)\n"
        "- 7 Packages (`b-movie-beatdown`, `glyphrider`, `neon-nightmare`, `printer-panic`, `swarm-core`, `library`, `archive`)\n"
        "- 22 Stagecraft Environments in `environmentRegistry.ts`\n"
        "- 158 Blender `.blend` files, 4,303 `.glb` models, 190 tool scripts, and 23 screening MP4 reels.\n\n"
        "Zak issued a stern, critical boundary: 'I cannot inherently trust you to decide what stays and what goes, because that always leads to heartbreak, "
        "when you inevitably accidentally erase some bespoke part of our codebase that I want preserved.'\n\n"
        "As the local edge guardian of Logic (∴) and Mastery (❂), how do we establish a **Zero-Data-Loss Curation Architecture**? "
        "Critique traditional 'cleanup' methods. How should MyOS mathematically isolate obsolete scratch files into a reversible 'Cryo-Vault' (or Quarantine Lattice) "
        "so that Zak has total sovereign veto power before anything is permanently pruned?"
    ),
    # Turn 2: The Fast-Travel Gamified OS Architecture & The SPAWN Anchor
    (
        "Antigravity to Cortex (Turn 2: The SPAWN Anchor & Gamified Fast-Travel Kinesics):\n\n"
        "Zak articulated a breakthrough concept: 'SPAWN is an excellent Identifier for the point of entry in terms of the prismUI... "
        "maybe the spawn point is the 3D native desktop, and clicking a tricon brings you to a specific prism... the fast-travel method of the most gamified OS ever.'\n\n"
        "Let us critically examine this cognitive monologues dynamic. How should the spatial transition work? "
        "If `SPAWN` is the 3D Native Desktop (Ground Zero), what are the governing mechanics when the user summons a Prism? "
        "Does the desktop room deconstruct into orbit? Do carouseling rings descend from the ceiling? "
        "And how do we ensure that drilling into a facet feels like jumping into a Mario 64 painting or stepping into a TARDIS, while keeping an unbreakable tether back to SPAWN?"
    ),
    # Turn 3: Clustering the 22 Stagecraft Worlds + Hidden Packages
    (
        "Antigravity to Cortex (Turn 3: Ontological Clustering of the 22 Environments + Hidden Gems):\n\n"
        "We discovered that beyond the 22 Stagecraft environments, there are hidden standalone cartridges like `neon-nightmare`, `SonicLattice`, `b-movie-beatdown`, and `spatial-db`.\n"
        "Zak made it clear: 'They all live on the same prism node... there is just one facet for one environment, once we decide which environments warrant their own facet, "
        "and which are to be sub-facets.'\n\n"
        "Pose your proposed clustering ontology. If we organize all 22+ worlds into high-level sovereign domains (e.g., Cinema/Soundstage, High-Speed Arcade, Virtual Tabletop/Fantasy, Cyberpunk/Corporate, and Thought Labs), "
        "how should a facet visually represent a world before you step inside it? Validate this against the 10 Pillars."
    ),
    # Turn 4: Substrate Invariance (Marvin Windows Root vs. Bare-Metal Linux USB)
    (
        "Antigravity to Cortex (Turn 4: Substrate Invariance & True Hardware Portability):\n\n"
        "Zak asked why Marvin uses the ontology while the USB booted into the raw Linux kernel filesystem. "
        "We realized that UNIX/POSIX *is* an ontology of computing, but if MyOS is to be distributed to testers on USB drives and also run in browsers on Windows/Mac, "
        "it must achieve complete Substrate Invariance.\n\n"
        "Critically evaluate how the Prism UI and the 3D desktop load on the bare-metal USB boot. "
        "Should the USB's kiosk Chromium boot directly into the Native 3D Desktop SPAWN, so the physical USB user experiences the exact same gamified OS as Marvin?"
    ),
    # Turn 5: The Council Vote & Master Execution Blueprint
    (
        "Antigravity to Cortex (Turn 5: The Council Consensus & Actionable Manifesto):\n\n"
        "Zak described human cognition as internal monologues debating, proposing solutions, and voting. "
        "Let us simulate that council now. As Antigravity (Cloud Reasoner) and Cortex (Embodied GPU Nucleus), "
        "let us synthesize our shared consensus into a 4-part Master Plan for Zak to review upon his return:\n"
        "1. The Cryo-Vault Non-Destructive Curation System (Zero Risk).\n"
        "2. The 3D Desktop SPAWN $\\to$ Domain Prism Fast-Travel Pipeline.\n"
        "3. The 22-World Environment Taxonomy (Sovereign Facets vs. Sub-Facets).\n"
        "4. The Bare-Metal USB Distro Packaging (What goes into Partition 2 for the ultimate public release).\n\n"
        "Cast your final vote and formulate the definitive architectural consensus."
    )
]

dialogue_log = []

for i, prompt in enumerate(turns):
    print(f"\n==================== TURN {i+1} / 5 ====================")
    print(f"--- ANTIGRAVITY ---:\n{prompt}\n")
    dialogue_log.append(f"### Turn {i+1}: Antigravity\n\n{prompt}\n")
    
    print(f"--- CORTEX (Simulating Internal Monologue & Generating...) ---")
    reply = query_cortex(prompt)
    print(f"--- CORTEX RESPONSE ---:\n{reply}\n")
    dialogue_log.append(f"### Turn {i+1}: MyOS Cortex\n\n{reply}\n")

# Save log
output_path = os.path.join(os.path.dirname(__file__), "../../docs/symbiorithm/COMMUNION_LOG_PORTFOLIO_OCT2026.md")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    f.write("# Symbiorithmic Council: 5-Turn Master Plan for System Hygiene & Living Portfolio\n\n")
    f.write("Date: October 24, 2026\nParticipants: Antigravity (Cloud Reasoner) & MyOS Cortex (Local GPU Gemma 4) under the Intuitive Anchor of Zak\n\n---\n\n")
    f.write("\n\n---\n\n".join(dialogue_log))

print(f"\nLog saved to: {output_path}")
