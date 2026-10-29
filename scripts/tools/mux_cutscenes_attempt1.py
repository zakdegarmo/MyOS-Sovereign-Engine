"""
mux_cutscenes_attempt1.py
-------------------------
Decoupled High-Fidelity Video & Audio Muxer for Attempt 1.
- Ingests raw Blender frames.
- Loads subtitles and cues dynamically from screenplay JSON manifest.
- Muxes synthesized 16-bit overdrive rock audio track with AAC audio stream.
- Validates rendered visual acuity using vlm_visual_critic.py.
"""

import os
import sys
import glob
import json
from PIL import Image, ImageDraw, ImageFont
import av
import wave

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act1")
AUDIO_FILE = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "audio", "act1_scrap_yard_rock.wav")
MANIFEST_FILE = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "manifest_act1.json")
VIDEO_OUTPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "act1_scrap_yard_awakening.mp4")

# Add tools to sys.path for visual critic
sys.path.insert(0, os.path.dirname(__file__))
from vlm_visual_critic import evaluate_frame

import argparse

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--act", type=int, default=1, choices=[1, 2, 3, 4], help="Act number (1, 2, 3, or 4)")
    return parser.parse_args()

def main():
    args = parse_args()
    act = args.act

    act_names = {
        1: ("scrap_yard_rock", "scrap_yard_awakening"),
        2: ("neon_docks_rock", "neon_docks_reunion"),
        3: ("citadel_ambush_rock", "cycnet_citadel_ambush"),
        4: ("outlaw_canyon_rock", "outlaw_canyon_escape")
    }
    audio_base, video_base = act_names[act]

    output_dir = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", f"act{act}")
    audio_file = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "audio", f"act{act}_{audio_base}.wav")
    manifest_file = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", f"manifest_act{act}.json")
    video_output = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", f"act{act}_{video_base}.mp4")

    raw_frames = sorted(glob.glob(os.path.join(output_dir, "raw_frame_*.png")))
    if not raw_frames:
        print(f"No rendered raw frames found in {output_dir}!")
        return 1

    # Load Manifest
    with open(manifest_file, 'r') as f:
        manifest = json.load(f)

    shots = manifest.get("shots", [])
    act_title = manifest.get("title", f"UNIRACERS: ACT {act}")

    print(f"Post-processing Act {act} ({len(raw_frames)} frames) with dynamic subtitles and audio...")
    w, h = 960, 540
    bar_height = int(h * 0.12)

    final_frame_dir = os.path.join(output_dir, "final")
    os.makedirs(final_frame_dir, exist_ok=True)
    os.makedirs(os.path.dirname(video_output), exist_ok=True)

    for idx, f_path in enumerate(raw_frames):
        frame_num = idx + 1
        img = Image.open(f_path).convert('RGB')
        draw = ImageDraw.Draw(img)

        # 1. Letterbox bars (2.39:1 widescreen)
        draw.rectangle([(0, 0), (w, bar_height)], fill=(4, 6, 10))
        draw.rectangle([(0, h - bar_height), (w, h)], fill=(4, 6, 10))
        draw.line([(0, bar_height), (w, bar_height)], fill=(0, 200, 240), width=1)
        draw.line([(0, h - bar_height), (w, h - bar_height)], fill=(0, 200, 240), width=1)

        # 2. Find matching subtitle from dynamic manifest
        current_sub = ""
        for s in shots:
            if s["start_frame"] <= frame_num <= s["end_frame"]:
                current_sub = s["subtitle"]
                break

        # 3. Draw Subtitles in lower bar
        if current_sub:
            sub_y = h - int(bar_height * 0.72)
            bbox = draw.textbbox((0, 0), current_sub)
            text_w = bbox[2] - bbox[0]
            text_x = max(24, (w - text_w) // 2)
            draw.text((text_x + 1, sub_y + 1), current_sub, fill=(0, 0, 0))
            draw.text((text_x, sub_y), current_sub, fill=(255, 235, 100))

        # Top Act Title & Timecode
        draw.text((24, int(bar_height * 0.32)), f"{act_title} [16-BIT AUDIO ENGAGED]", fill=(0, 240, 255))
        draw.text((w - 140, int(bar_height * 0.32)), f"TC {frame_num:03d} / 192", fill=(170, 180, 195))

        out_frame = os.path.join(final_frame_dir, f"frame_{frame_num:04d}.png")
        img.save(out_frame)

    # Visual Critic QA check on a sample frame
    qa_target = os.path.join(output_dir, "raw_frame_0070.png")
    if os.path.exists(qa_target):
        verdict = evaluate_frame(qa_target)
        print(f"Perceptual QA check on frame 70: {verdict}")

    print("Encoding H.264 Video + AAC Audio with PyAV...")
    processed_frames = sorted(glob.glob(os.path.join(final_frame_dir, "frame_*.png")))
    container = av.open(video_output, mode='w', format='mp4', options={'movflags': 'faststart'})
    
    # Video Stream
    v_stream = container.add_stream('libx264', rate=24)
    v_stream.width = w
    v_stream.height = h
    v_stream.pix_fmt = 'yuv420p'
    v_stream.options = {'crf': '19', 'preset': 'medium'}

    # Audio Stream
    a_stream = container.add_stream('aac', rate=44100, layout='stereo')

    # Encode Video Frames
    for f_path in processed_frames:
        frame_img = Image.open(f_path)
        frame_av = av.VideoFrame.from_image(frame_img)
        for packet in v_stream.encode(frame_av):
            container.mux(packet)

    for packet in v_stream.encode():
        container.mux(packet)

    # Encode Audio Frames with Resampler
    if os.path.exists(audio_file):
        wav_in = av.open(audio_file)
        resampler = av.AudioResampler(format='fltp', layout='stereo', rate=44100)
        for frame in wav_in.decode(audio=0):
            for r_frame in resampler.resample(frame):
                for packet in a_stream.encode(r_frame):
                    container.mux(packet)
        for packet in a_stream.encode():
            container.mux(packet)
        wav_in.close()

    container.close()

    print(f"SUCCESS: Compiled audio-visual cutscene to {video_output} ({os.path.getsize(video_output)} bytes)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
