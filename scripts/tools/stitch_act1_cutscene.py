"""
stitch_act1_cutscene.py
-----------------------
Post-processes rendered raw frames for Act 1: "The Scrap Yard Awakening":
1. Reads raw frames from temp_studio_frames/act1/raw_frame_####.png.
2. Applies 2.39:1 widescreen cinematic letterboxing.
3. Burns formatted narrative subtitles and act header.
4. Muxes with 'apps/web/public/audio/act1_scrap_yard_rock.wav' via PyAV.
5. Encodes pristine H.264 MP4 to 'apps/web/public/screenings/act1_scrap_yard_awakening.mp4'.
"""

import os
import sys
import glob

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from PIL import Image, ImageDraw, ImageFont
import av

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act1")
FINAL_DIR = os.path.join(OUTPUT_DIR, "final")
VIDEO_OUTPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "act1_scrap_yard_awakening.mp4")
AUDIO_INPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "act1_scrap_yard_rock.wav")

os.makedirs(FINAL_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUTPUT), exist_ok=True)

SUBTITLES = [
    (1, 48, "1994. The lawsuit hit hard. A unicycle with attitude was deemed too dangerous for the market."),
    (49, 96, "Thirty years rusting in exile. Cold hubs, dust on the tire... but the motor still hums."),
    (97, 144, "An outlaw broadcast overrides the cathode static: The Underground League has returned."),
    (145, 192, "Time to get the old crew back together. The Outlaw Syndicate rides again.")
]

def post_process_frames():
    raw_frames = sorted(glob.glob(os.path.join(OUTPUT_DIR, "raw_frame_*.png")))
    if not raw_frames:
        print(f"❌ No rendered raw frames found in {OUTPUT_DIR}!")
        return False

    print(f"🎞️ Found {len(raw_frames)} frames. Applying letterboxing & subtitles...")
    first_frame = Image.open(raw_frames[0])
    w, h = first_frame.size
    bar_height = int(h * 0.12) # ~12% top/bottom cinematic letterbox

    for idx, f_path in enumerate(raw_frames):
        frame_num = idx + 1
        img = Image.open(f_path).convert('RGB')
        draw = ImageDraw.Draw(img)

        # 1. Letterbox bars
        draw.rectangle([(0, 0), (w, bar_height)], fill=(0, 0, 0))
        draw.rectangle([(0, h - bar_height), (w, h)], fill=(0, 0, 0))

        # 2. Matching subtitle
        current_sub = ""
        for start_f, end_f, text in SUBTITLES:
            if start_f <= frame_num <= end_f:
                current_sub = text
                break

        if current_sub:
            sub_y = h - int(bar_height * 0.72)
            bbox = draw.textbbox((0, 0), current_sub)
            text_w = bbox[2] - bbox[0]
            text_x = max(20, (w - text_w) // 2)
            # Drop shadow
            draw.text((text_x + 1, sub_y + 1), current_sub, fill=(0, 0, 0))
            # Nostalgic yellow arcade caption
            draw.text((text_x, sub_y), current_sub, fill=(255, 230, 95))

        # Header Title in Cyan
        draw.text((25, int(bar_height * 0.3)), "GLYPHRIDER: TORUS OUTLAWS // ACT 1: THE SCRAP YARD", fill=(0, 255, 255))

        out_frame = os.path.join(FINAL_DIR, f"frame_{frame_num:04d}.png")
        img.save(out_frame)

    print("✅ All frames post-processed!")
    return True

def stitch_with_audio():
    processed_frames = sorted(glob.glob(os.path.join(FINAL_DIR, "frame_*.png")))
    if not processed_frames:
        print("❌ No processed frames found!")
        return False

    first_frame = Image.open(processed_frames[0])
    w, h = first_frame.size

    print(f"🎬 Compiling H.264 MP4 with PyAV ({len(processed_frames)} frames @ 24fps)...")
    container = av.open(VIDEO_OUTPUT, mode='w', format='mp4', options={'movflags': 'faststart'})

    v_stream = container.add_stream('libx264', rate=24)
    v_stream.width = w
    v_stream.height = h
    v_stream.pix_fmt = 'yuv420p'
    v_stream.options = {'crf': '20', 'preset': 'fast'}

    # Audio muxing
    has_audio = False
    a_stream = None
    resampler = None
    a_input = None

    if os.path.exists(AUDIO_INPUT):
        try:
            a_input = av.open(AUDIO_INPUT)
            if len(a_input.streams.audio) > 0:
                in_a = a_input.streams.audio[0]
                a_stream = container.add_stream('aac', rate=44100)
                resampler = av.AudioResampler(format='fltp', layout='stereo', rate=44100)
                has_audio = True
                print(f"🎵 Muxing audio soundtrack: {AUDIO_INPUT}")
        except Exception as e:
            print(f"⚠️ Audio open warning: {e}")

    # Encode Video
    for idx, f_path in enumerate(processed_frames):
        frame_img = Image.open(f_path)
        frame_av = av.VideoFrame.from_image(frame_img)
        frame_av.pts = idx
        for packet in v_stream.encode(frame_av):
            container.mux(packet)

    for packet in v_stream.encode():
        container.mux(packet)

    # Encode Audio
    if has_audio and a_input and a_stream and resampler:
        try:
            audio_pts = 0
            for frame in a_input.decode(audio=0):
                resampled = resampler.resample(frame)
                for r_frame in resampled:
                    r_frame.pts = audio_pts
                    audio_pts += r_frame.samples
                    for packet in a_stream.encode(r_frame):
                        container.mux(packet)
            for packet in a_stream.encode():
                container.mux(packet)
            a_input.close()
        except Exception as e:
            print(f"⚠️ Audio encoding warning: {e}")

    container.close()
    file_size_kb = os.path.getsize(VIDEO_OUTPUT) / 1024
    print(f"🎉 SUCCESS! Cutscene reel baked to:\n  {VIDEO_OUTPUT} ({file_size_kb:.1f} KB)")
    return True

def main():
    if post_process_frames():
        stitch_with_audio()

if __name__ == "__main__":
    main()
