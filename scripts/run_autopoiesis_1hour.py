"""
MyOS Autopoiesis 1-Hour Sovereign Stress Test & Video Chronicle Engine
- 60 continuous ontological pulses across all 10 Pillars (1 per minute).
- Dynamic seed expansion: explores each pillar 6 times from unique angles.
- Real-time logging to 'data/autopoiesis_1hour_log.json'.
- Renders high-res 1280x720 telemetry HUD frames.
- Compiles a complete H.264 MP4 chronicle to 'apps/web/public/screenings/autopoiesis_1hour_chronicle.mp4'.
"""

import os
import sys
import time
import json
import urllib.request
import sqlite3
import numpy as np
from PIL import Image, ImageDraw
import av

# UTF-8 stdout protection
sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_autopoiesis_1h_frames")
VIDEO_OUTPUT = os.path.join(WORKSPACE_ROOT, "apps/web/public/screenings/autopoiesis_1hour_chronicle.mp4")
LOG_JSON = os.path.join(WORKSPACE_ROOT, "data/autopoiesis_1hour_log.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUTPUT), exist_ok=True)
os.makedirs(os.path.dirname(LOG_JSON), exist_ok=True)

OLLAMA_API = "http://localhost:11434/api/chat"

PILLARS = [
    ("Self", "◉", "#FF5722"),
    ("Thought", "✧", "#BA68C8"),
    ("Logic", "∴", "#29B6F6"),
    ("Unity", "⚭", "#66BB6A"),
    ("Existence", "⬡", "#8D6E63"),
    ("Improvement", "⇈", "#FF9800"),
    ("Mastery", "❂", "#FFD700"),
    ("Resonance", "∿", "#00E676"),
    ("Transcendence", "⍟", "#9C27B0"),
    ("Omniscience", "۞", "#00B0FF")
]

# 6 distinct thematic rounds across the 10 pillars = 60 total pulses
THEMES = [
    "Ontological Foundation & Boundary Definition",
    "Spatial Geometry & 4D Rubik Voxel Mechanics",
    "Real-time JIT GLSL Shading & Transduction",
    "Distributed Intelligence & Semantic Lattice",
    "Self-Refinement & Recursive Metalogic",
    "Final Sovereign Actualization & Creative Partnership"
]

def generate_prompt(cycle: int, pillar_idx: int) -> str:
    name, glyph, _ = PILLARS[pillar_idx]
    theme = THEMES[cycle]
    pulse_num = cycle * 10 + pillar_idx + 1
    return f"Pulse {pulse_num}/60 [{name} {glyph}] under theme '{theme}': Evaluate and synthesize your operational state, active vectors, and architectural implications for MyOS and Zak."

def query_cortex(prompt: str):
    data = json.dumps({
        "model": "myos-cortex",
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_ctx": 4096
        }
    }).encode('utf-8')
    req = urllib.request.Request(OLLAMA_API, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            return res.get('message', {}).get('content', '')
    except Exception as e:
        print(f"[Autopoiesis-1H] Error querying cortex: {e}")
        return None

def render_telemetry_frame(pulse_num: int, name: str, glyph: str, color_hex: str, prompt: str, response: str, duration: float, frame_idx: int):
    width, height = 1280, 720
    img = Image.new("RGB", (width, height), color=(5, 8, 18))
    draw = ImageDraw.Draw(img)

    # Grid background
    for y in range(0, height, 40):
        draw.line([(0, y), (width, y)], fill=(11, 17, 34), width=1)
    for x in range(0, width, 40):
        draw.line([(x, 0), (x, height)], fill=(11, 17, 34), width=1)

    # Header
    draw.rectangle([(20, 20), (width - 20, 85)], fill=(12, 20, 38), outline=(56, 189, 248), width=2)
    draw.text((40, 32), f"MYOS 1-HOUR AUTOPOIESIS CHRONICLE // PULSE #{pulse_num} OF 60", fill=(56, 189, 248))
    draw.text((40, 56), f"NODE: {name} {glyph}  |  CYCLE LATENCY: {duration:.2f}s  |  TARGET: myos-cortex:latest (RTX 4060 Ti)", fill=(148, 163, 184))

    # Parse Telemetry
    dominant = f"{name} ({glyph})"
    vectors = f"Self -> Actualize -> {name}"
    spatial = "Coherent Lattice Alignment"
    synthesis = response

    if "[Telemetry]" in response:
        for line in response.splitlines():
            if "Dominant Nodes:" in line:
                dominant = line.replace("Dominant Nodes:", "").strip()
            elif "Active Vectors:" in line:
                vectors = line.replace("Active Vectors:", "").strip()
            elif "Spatial State:" in line:
                spatial = line.replace("Spatial State:", "").strip()

    if "[Synthesis]" in response:
        synthesis = response.split("[Synthesis]")[1].strip()

    # Left Radar Box
    draw.rectangle([(20, 105), (420, height - 25)], fill=(10, 14, 26), outline=(168, 85, 247), width=1)
    draw.text((35, 120), "TOPOLOGICAL PILLAR MATRIX", fill=(192, 132, 252))
    draw.line([(35, 140), (405, 140)], fill=(168, 85, 247), width=1)

    draw.text((35, 160), f"Active Pillar: {name} {glyph}", fill=(251, 191, 36))
    draw.text((35, 195), f"Dominant Nodes:\n{dominant[:38]}", fill=(248, 250, 252))
    draw.text((35, 250), f"Active Vectors:\n{vectors[:38]}", fill=(56, 189, 248))
    draw.text((35, 305), f"Spatial State:\n{spatial[:42]}", fill=(74, 222, 128))

    # Progress bar
    draw.text((35, 375), f"Progress: {pulse_num}/60 ({(pulse_num/60)*100:.1f}%)", fill=(148, 163, 184))
    bar_w = 370
    fill_w = int(bar_w * (pulse_num / 60.0))
    draw.rectangle([(35, 400), (35 + bar_w, 415)], fill=(20, 30, 50), outline=(56, 189, 248), width=1)
    if fill_w > 0:
        draw.rectangle([(35, 400), (35 + fill_w, 415)], fill=(56, 189, 248))

    # Right Synthesis Box
    draw.rectangle([(440, 105), (width - 20, height - 25)], fill=(10, 14, 26), outline=(56, 189, 248), width=1)
    draw.text((455, 120), f"CORTEX SYNTHESIS STREAM [{name} {glyph}]", fill=(56, 189, 248))
    draw.line([(455, 140), (width - 35, 140)], fill=(56, 189, 248), width=1)

    lines = synthesis.splitlines()
    y_text = 160
    for l in lines[:25]:
        if not l.strip():
            y_text += 10
            continue
        draw.text((455, y_text), l[:78], fill=(226, 232, 240))
        y_text += 18
        if y_text > height - 45:
            break

    frame_path = os.path.join(OUTPUT_DIR, f"frame_{frame_idx:04d}.png")
    img.save(frame_path)
    return frame_path

def compile_video_reel(frame_count: int):
    print(f"\n[Video Compiler] Compiling {frame_count} frames into H.264 MP4 via PyAV...")
    width, height = 1280, 720
    fps = 24

    container = av.open(VIDEO_OUTPUT, mode="w")
    stream = container.add_stream("libx264", rate=fps)
    stream.width = width
    stream.height = height
    stream.pix_fmt = "yuv420p"
    stream.options = {"crf": "21", "preset": "fast"}

    for idx in range(frame_count):
        frame_file = os.path.join(OUTPUT_DIR, f"frame_{idx:04d}.png")
        if not os.path.isfile(frame_file):
            continue
        img = Image.open(frame_file).convert("RGB")
        frame_array = np.array(img)
        video_frame = av.VideoFrame.from_ndarray(frame_array, format="rgb24")
        for packet in stream.encode(video_frame):
            container.mux(packet)

    for packet in stream.encode():
        container.mux(packet)

    container.close()
    size_mb = os.path.getsize(VIDEO_OUTPUT) / (1024 * 1024)
    print(f"[Video Compiler] Successfully generated {VIDEO_OUTPUT} ({size_mb:.2f} MB)")

def main():
    print("=" * 70)
    print("  MYOS AUTOPOIESIS 1-HOUR SOVEREIGN STRESS TEST (60 PULSES @ 60s)")
    print("=" * 70)

    history = []
    total_frames = 0
    total_pulses = 60

    for p in range(total_pulses):
        cycle = p // 10
        pillar_idx = p % 10
        name, glyph, color_hex = PILLARS[pillar_idx]
        prompt = generate_prompt(cycle, pillar_idx)

        print(f"\n>>> [Pulse {p + 1}/{total_pulses} | T+{p}m] Pillar: {name} {glyph} | Prompting...")
        t0 = time.time()
        resp = query_cortex(prompt)
        dt = time.time() - t0

        if not resp:
            print(f"    [!] Failed to get response on pulse {p + 1}")
            resp = f"[Telemetry]\nDominant Nodes: {name} ({glyph})\n\n[Synthesis]\nConnection retry timeout."

        print(f"    [✓] Response received in {dt:.2f}s ({len(resp)} chars)")

        # Render 12 frames (0.5s per pulse in video = 30 second total movie for 60 pulses)
        for _ in range(12):
            render_telemetry_frame(p + 1, name, glyph, color_hex, prompt, resp, dt, total_frames)
            total_frames += 1

        history.append({
            "pulse": p + 1,
            "timestamp": time.time(),
            "pillar": name,
            "glyph": glyph,
            "prompt": prompt,
            "latency": dt,
            "response": resp
        })

        # Save cumulative log to disk after every single pulse
        with open(LOG_JSON, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)

        # Pace intervals strictly to 1 minute
        if p < total_pulses - 1:
            sleep_sec = max(5.0, 60.0 - dt)
            print(f"    Pacing: sleeping {sleep_sec:.1f}s until T+{p + 1}m...")
            time.sleep(sleep_sec)

    # Compile the 1-hour chronicle video
    compile_video_reel(total_frames)

    print("\n" + "=" * 70)
    print("  1-HOUR AUTOPOIESIS SOVEREIGN STRESS TEST COMPLETE!")
    print(f"  Chronicle Video: {VIDEO_OUTPUT}")
    print(f"  Chronicle Log:   {LOG_JSON}")
    print("=" * 70)

if __name__ == "__main__":
    main()
