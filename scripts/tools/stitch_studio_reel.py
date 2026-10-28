#!/usr/bin/env python3
"""
Studio Reel Stitcher: Compiles rendered frames into H.264 MP4 using PyAV
Deterministic video assembly module for MyOS 3D Animation Studio.
"""

import os
import sys
import glob
import argparse
import numpy as np
from PIL import Image
import av

# Windows PowerShell UTF-8 encoding protection
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames")
OUTPUT_PATH = os.path.join(WORKSPACE_ROOT, "apps/web/public/screenings/crimson_zenith_teaser.mp4")


def verify_video_stream(video_path, expected_fps=24):
    """Probes the generated MP4 container and stream parameters using PyAV."""
    if not os.path.isfile(video_path):
        return False, f"File does not exist: {video_path}"

    size_bytes = os.path.getsize(video_path)
    if size_bytes < 1024:
        return False, f"File size too small: {size_bytes} bytes"

    try:
        container = av.open(video_path)
        if len(container.streams.video) == 0:
            container.close()
            return False, "No video stream found in container"

        stream = container.streams.video[0]
        codec = stream.codec_context.name
        pix_fmt = stream.pix_fmt
        width = stream.width
        height = stream.height
        rate = float(stream.average_rate) if stream.average_rate else 0.0

        container.close()

        if codec != "h264":
            return False, f"Unexpected codec: {codec} (expected h264)"
        if pix_fmt != "yuv420p":
            return False, f"Unexpected pixel format: {pix_fmt} (expected yuv420p)"

        return True, f"Verified: codec={codec}, format={pix_fmt}, res={width}x{height}, fps={rate:.1f}, size={size_bytes} bytes"
    except Exception as e:
        return False, f"Verification failed with exception: {e}"


def stitch_movie(frames_dir=None, output_path=None, fps=24):
    """
    Ingests a sequence of rendered PNG frames and encodes an H.264 MP4 reel using PyAV.
    Falls back to module-level FRAMES_DIR and OUTPUT_PATH if arguments are omitted.
    """
    target_frames_dir = frames_dir if frames_dir is not None else FRAMES_DIR
    target_output_path = output_path if output_path is not None else OUTPUT_PATH

    if not os.path.isdir(target_frames_dir):
        print(f"[Studio Stitcher] ❌ Frame directory not found: {target_frames_dir}")
        return False

    frame_files = sorted(glob.glob(os.path.join(target_frames_dir, "frame_*.png")))
    if not frame_files:
        print(f"[Studio Stitcher] ❌ No frames found matching 'frame_*.png' in {target_frames_dir}")
        return False

    first_frame = Image.open(frame_files[0])
    width, height = first_frame.size
    print(f"[Studio Stitcher] 🎞️ Found {len(frame_files)} frames ({width}x{height}) @ {fps} fps")

    target_output_path = os.path.abspath(target_output_path)
    out_dir = os.path.dirname(target_output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    try:
        container = av.open(target_output_path, mode='w', format='mp4', options={'movflags': 'faststart'})
        stream = container.add_stream('libx264', rate=fps)
        stream.width = width
        stream.height = height
        stream.pix_fmt = 'yuv420p'
        stream.options = {
            'crf': '18',
            'preset': 'fast',
            'tune': 'animation',
            'bf': '0'
        }

        for idx, fpath in enumerate(frame_files):
            img = Image.open(fpath).convert('RGB')
            arr = np.array(img)
            frame = av.VideoFrame.from_ndarray(arr, format='rgb24')
            frame.pts = idx
            for packet in stream.encode(frame):
                container.mux(packet)

        # Flush stream
        for packet in stream.encode():
            container.mux(packet)

        container.close()

        # Validate resulting output
        valid, report = verify_video_stream(target_output_path, expected_fps=fps)
        if not valid:
            print(f"[Studio Stitcher] ⚠️ Video verification warning: {report}")
            return False

        file_size_kb = os.path.getsize(target_output_path) / 1024
        print(f"[Studio Stitcher] 🎬 SUCCESS! Output baked to:\n  {target_output_path} ({file_size_kb:.1f} KB)\n  {report}")
        return True
    except Exception as e:
        print(f"[Studio Stitcher] ❌ Encoding error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="MyOS PyAV Video Reel Compiler")
    parser.add_argument("--frames-dir", dest="frames_dir", default=FRAMES_DIR, help="Path to directory of rendered PNG frames")
    parser.add_argument("--output", dest="output", default=OUTPUT_PATH, help="Path for output H.264 MP4 video")
    parser.add_argument("--fps", dest="fps", type=int, default=24, help="Playback frame rate (default: 24)")

    args = parser.parse_args()
    success = stitch_movie(frames_dir=args.frames_dir, output_path=args.output, fps=args.fps)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
