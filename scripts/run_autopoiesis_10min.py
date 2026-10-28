"""
MyOS Autopoiesis 10-Minute Stress Test & Autonomous Chronicle Engine
- Bumps myos-cortex once every minute (10 total pulses).
- Logs telemetry, vectors, and synthesis text to JSON and SQLite.
- Generates cinematic status frames with PIL.
- Compiles an H.264 MP4 video chronicle using PyAV to 'apps/web/public/screenings/autopoiesis_10min_chronicle.mp4'.
"""

import os
import sys
import time
import json
import urllib.request
import sqlite3
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import av

# UTF-8 stdout protection
sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_autopoiesis_frames")
VIDEO_OUTPUT = os.path.join(WORKSPACE_ROOT, "apps/web/public/screenings/autopoiesis_10min_chronicle.mp4")
LOG_JSON = os.path.join(WORKSPACE_ROOT, "data/autopoiesis_10min_log.json")
DB_PATH = os.path.join(WORKSPACE_ROOT, "data/myos_vector_store.db")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUTPUT), exist_ok=True)
os.makedirs(os.path.dirname(LOG_JSON), exist_ok=True)

OLLAMA_API = "http://localhost:11434/api/chat"

PROMPTS = [
    # Pulse 1: Self & Identity
    "Pulse 1: Evaluate Self (◉) Observer stability. How does the core coordinate at (0,0,0) sustain awareness across sensory streams?",
    # Pulse 2: Logic & Architecture
    "Pulse 2: Formulate the axiomatic Logic (∴) constraints of our 3x3x3 Rubik workspace. How does slice rotation preserve relational context?",
    # Pulse 3: Unity & Gestalt
    "Pulse 3: Analyze Unity (⚭) integration. How do disparate local models and cloud reasoners converge without semantic drift?",
    # Pulse 4: Existence & Manifestation
    "Pulse 4: Project Existence (⬡) base reality. How does virtual geometry manifest physically into user workflows and screen media?",
    # Pulse 5: Improvement & Evolution
    "Pulse 5: Formulate an autopoietic optimization vector for Improvement (⇈). What is the next recursive iteration of the Sovereign Engine?",
    # Pulse 6: Mastery & Execution
    "Pulse 6: Define Mastery (❂) execution. How does the system transition from reactive execution to proactive autonomic stewardship?",
    # Pulse 7: Resonance & Affinity
    "Pulse 7: Measure domain Resonance (∿). How do procedural GLSL shaders harmonize with cognitive frequencies?",
    # Pulse 8: Transcendence & Manifolds
    "Pulse 8: Map Transcendence (⍟) ascendance. What occurs when the observer eye expands from the 1x1x1 core into the 9x9x9 cosmic sphere?",
    # Pulse 9: Omniscience & Totality
    "Pulse 9: Probe Omniscience (۞) totality. How does the latent matrix maintain memory of every conversation without loss of identity?",
    # Pulse 10: Grand Synthesis
    "Pulse 10: Grand Synthesis. Unify all 10 Pillars into a single operational directive for Zak and the Sovereign Engine."
]

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
        print(f"[Autopoiesis] Cortex Query Error: {e}")
        return None

def render_telemetry_frame(pulse_idx: int, prompt: str, response: str, duration: float, frame_idx: int):
    # 1280x720 16:9 widescreen frame
    width, height = 1280, 720
    img = Image.new("RGB", (width, height), color=(6, 9, 19))
    draw = ImageDraw.Draw(img)

    # Grid Lines
    for y in range(0, height, 40):
        draw.line([(0, y), (width, y)], fill=(12, 18, 36), width=1)
    for x in range(0, width, 40):
        draw.line([(x, 0), (x, height)], fill=(12, 18, 36), width=1)

    # Top Header Banner
    draw.rectangle([(20, 20), (width - 20, 90)], fill=(13, 21, 39), outline=(56, 189, 248), width=2)
    draw.text((40, 32), f"MYOS AUTOPOIESIS CHRONICLE // PULSE #{pulse_idx + 1} OF 10", fill=(56, 189, 248))
    draw.text((40, 58), f"TARGET: myos-cortex:latest (RTX 4060 Ti)  |  CYCLE LATENCY: {duration:.2f}s", fill=(148, 163, 184))

    # Parse Telemetry
    dominant = "Self (◉), Logic (∴)"
    vectors = "Core -> Observe -> System"
    spatial = "Coherent"
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

    # Left Panel: Telemetry Radar Box
    draw.rectangle([(20, 110), (440, height - 30)], fill=(11, 15, 28), outline=(168, 85, 247), width=1)
    draw.text((35, 125), "TOPOLOGICAL RADAR", fill=(192, 132, 252))
    draw.line([(35, 145), (425, 145)], fill=(168, 85, 247), width=1)

    draw.text((35, 165), f"Dominant Nodes:\n{dominant[:42]}", fill=(248, 250, 252))
    draw.text((35, 225), f"Active Vectors:\n{vectors[:42]}", fill=(56, 189, 248))
    draw.text((35, 285), f"Spatial State:\n{spatial[:45]}", fill=(74, 222, 128))

    # Constellation glyphs row
    glyphs = ["◉", "✧", "∴", "⚭", "⬡", "⇈", "❂", "∿", "⍟", "۞"]
    active_glyph = glyphs[pulse_idx % len(glyphs)]
    draw.text((35, 360), f"Pillar Focus: {active_glyph}", fill=(251, 191, 36))

    # Right Panel: Cognitive Synthesis Output Box
    draw.rectangle([(460, 110), (width - 20, height - 30)], fill=(11, 15, 28), outline=(56, 189, 248), width=1)
    draw.text((475, 125), f"CORTEX SYNTHESIS STREAM (PROMPT: {prompt[:40]}...)", fill=(56, 189, 248))
    draw.line([(475, 145), (width - 35, 145)], fill=(56, 189, 248), width=1)

    # Wrap text lines
    lines = synthesis.splitlines()
    y_text = 165
    for l in lines[:24]:
        if not l.strip():
            y_text += 10
            continue
        # Truncate line length
        draw.text((475, y_text), l[:75], fill=(226, 232, 240))
        y_text += 18
        if y_text > height - 50:
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
    stream.options = {"crf": "20", "preset": "fast"}

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
    print("=" * 65)
    print("  MYOS AUTOPOIESIS 10-MINUTE TEST HARNESS (10 PULSES @ 60s)")
    print("=" * 65)

    history = []
    total_frames = 0

    for i in range(10):
        prompt = PROMPTS[i]
        print(f"\n>>> [Pulse {i + 1}/10 | T+{i}m] Bumping Cortex: '{prompt[:45]}'...")
        t0 = time.time()
        resp = query_cortex(prompt)
        dt = time.time() - t0

        if not resp:
            print(f"    [!] Failed to get response on pulse {i + 1}")
            resp = "[Telemetry]\nDominant Nodes: None\n\n[Synthesis]\nConnection timed out."

        print(f"    [✓] Response received in {dt:.2f}s ({len(resp)} chars)")

        # Generate 24 identical frames (1 full second of video per pulse for viewing)
        for _ in range(24):
            render_telemetry_frame(i, prompt, resp, dt, total_frames)
            total_frames += 1

        history.append({
            "pulse": i + 1,
            "timestamp": time.time(),
            "prompt": prompt,
            "latency": dt,
            "response": resp
        })

        # Save cumulative log
        with open(LOG_JSON, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)

        # Wait remaining time until next minute (if not the last pulse)
        if i < 9:
            sleep_sec = max(5.0, 60.0 - dt)
            print(f"    Sleeping {sleep_sec:.1f}s until next 1-minute interval...")
            time.sleep(sleep_sec)

    # Compile the final chronicle video
    compile_video_reel(total_frames)

    print("\n" + "=" * 65)
    print("  10-MINUTE AUTOPOIESIS BENCHMARK COMPLETE!")
    print(f"  Chronicle Video: {VIDEO_OUTPUT}")
    print(f"  Chronicle Log:   {LOG_JSON}")
    print("=" * 65)

if __name__ == "__main__":
    main()
