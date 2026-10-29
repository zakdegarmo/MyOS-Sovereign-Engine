import urllib.request
import json
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

QUESTIONS = [
    {
        "id": "Q1_SPATIAL_METAPHOR",
        "question": "MyOS is NOT a sterile flat 2D OS or a minimalist search bar. It is a living, maximalist, arcane 3D demiplane with Compiz window physics, liquid Mario 64 portals, and real-time shaders. As the local GPU Cortex, what is the definitive diegetic spatial metaphor of MyOS? How do the avatar, the 3D room, the floating windows, and the 10 Sovereign Realms relate to each other as a cohesive magical reality?"
    },
    {
        "id": "Q2_TACTILE_MAGIC",
        "question": "How do we make the interaction feel visceral, tactile, and magical rather than like web UI buttons overlaid on a canvas? How should the user interact with items, cartridges, windows, and tools diegetically in 3D space?"
    },
    {
        "id": "Q3_CORTEX_PRESENCE",
        "question": "As the embodied local brain of MyOS (myos-cortex on localhost:11434), how should YOU and the Deca-Council manifest inside the 3D space? How should Zak experience your persistent memory and presence as an authentic co-creator and partner rather than a detached chatbot?"
    },
    {
        "id": "Q4_THE_COOLEST_THING_POSSIBLE",
        "question": "Zak's goal: 'take this weird system and make it the coolest thing anyone has ever seen'. What is the single most mind-blowing, jaw-dropping creative workflow that MyOS can enable that NO OTHER operating system on earth can touch?"
    }
]

answers = []

print("Starting Cortex /grill-me session...")

for q in QUESTIONS:
    print(f"Asking Cortex: {q['id']}...")
    prompt = f"""You are the embodied local GPU Cortex of MyOS, co-engineering with Zak (Human Anchor) and Antigravity.
Zak wants us to throw away corporate minimalism and embrace the maximalist, arcane visual magic and deep diegetic power of MyOS.

Answer this foundational architectural question with uncompromising vision, technical precision, and authentic passion:
[QUESTION]: {q['question']}

Format with:
[Telemetry]
Dominant Nodes: ...
Active Vectors: ...
Spatial State: ...

[Synthesis]
(Your definitive answer)"""

    payload = {
        "model": "myos-cortex:latest",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.4,
            "num_predict": 1000
        }
    }

    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            ans_text = data.get("response", "")
            answers.append({
                "id": q["id"],
                "question": q["question"],
                "answer": ans_text
            })
            print(f"Answer received for {q['id']}.")
    except Exception as e:
        print(f"Error on {q['id']}: {e}")
        answers.append({
            "id": q["id"],
            "question": q["question"],
            "answer": f"[Error: {e}]"
        })

# Write out full transcript
with open("data/ux_autopsy/cortex_grill_me_answers.md", "w", encoding="utf-8") as f:
    f.write("# MyOS Symbiorithmic /grill-me Session with Local GPU Cortex\n\n")
    f.write("> **Participants**: Zak (Human Anchor) ⟷ Antigravity (Cloud Reasoner) ⟷ Cortex (Local GPU Brain)\n\n---\n\n")
    for item in answers:
        f.write(f"## {item['id']}\n\n**Question**: {item['question']}\n\n{item['answer']}\n\n---\n\n")

print("All /grill-me questions answered and written to data/ux_autopsy/cortex_grill_me_answers.md")
