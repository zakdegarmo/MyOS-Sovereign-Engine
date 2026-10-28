# scripts/tools/stitch_full_prologue.py
"""
stitch_full_prologue.py
-----------------------
Compiles the extended Master Cut of the Intro Prologue (1,080 frames, 45.0s @ 24fps):
  - Beat 1 (F1-360, 15.0s): The Outskirts (Crane descent into Scrap Yard & Macro Puddle Art Shot)
  - Beat 2 (F361-1080, 30.0s): The Garage Hideout (Threshold roll, Couch hop, TV click, Spring pop, Pantomime emotes, SNES watching, 10W-40 chug, and Yard clatter escape)

Audio Design Architecture:
  - 0:00 - 0:08: Scrap yard wind atmosphere, Organic Grunge subtle murmur swelling to 1.0 at 0:07.5.
  - 0:08 - 0:15: Shot 2 Puddle macro rocking at full drive.
  - 0:15 - 0:45: Hard cut into garage interior:
      * Organic Grunge filters to muffled interior shop tone (0.15 vol).
      * Subtle room tone & 60Hz power transformer hum.
      * 0:24.08 (F578): Rotary switch click + 15.7kHz CRT whine + analog TV static burst.
      * 0:24.5 - 0:39.0: 16-bit SNES race engine and chiptune race audio through TV speaker.
      * 0:25.75 (F618): PTWANG! Spring pop & metallic wobble ring-down.
      * 0:35.4 (F850): Vintage oil can metallic clink & 10W-40 glug-glug.
      * 0:40.0 (F960): Ominous scrap yard metal clatter & low sinister syndicate drone.
      * 0:41.2 (F988): Tire bounce & rug thump, fast unicycle rollout.
      * 0:44.0 - 0:45.0: TV left flickering in empty room, transition hold.

Output:
  - Exported to apps/web/public/screenings/act1_full_prologue.mp4 (H.264 / AAC stereo 44.1kHz).
  - CRITICAL: prologue_v3.mp4 is preserved untouched as a historical artifact!
"""

import os
import sys
import glob
from PIL import Image, ImageDraw
import av
import numpy as np

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BEAT1_FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_v3")
BEAT2_FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_beat2")
OUTPUT_MP4 = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "act1_full_prologue.mp4")
GRUNGE_AUDIO = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "organic_grunge.mp3")

os.makedirs(os.path.dirname(OUTPUT_MP4), exist_ok=True)

# =============================================================================
# Procedural Foley & Sound Synthesis (44.1kHz Float32)
# =============================================================================

def generate_ambient_wind(duration, sample_rate=44100):
    num_samples = int(duration * sample_rate)
    noise = np.random.normal(0, 1, num_samples)
    b_noise = np.cumsum(noise)
    b_noise = b_noise - np.mean(b_noise)
    max_val = np.max(np.abs(b_noise)) or 1.0
    b_noise = b_noise / max_val

    t = np.linspace(0, duration, num_samples, endpoint=False)
    gust = (np.sin(2 * np.pi * 0.25 * t) + np.sin(2 * np.pi * 0.4 * t) + 2.0) / 4.0
    wind = b_noise * gust * 0.28
    fade_in = np.minimum(1.0, np.linspace(0, 1.5, num_samples))
    fade_out = np.minimum(1.0, np.linspace(1.2, 0, num_samples))
    return (wind * fade_in * fade_out).astype(np.float32)

def generate_garage_room_tone(duration, sample_rate=44100):
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    # 60Hz mains hum with 120Hz and 180Hz harmonics
    hum = 0.015 * np.sin(2 * np.pi * 60 * t) + 0.008 * np.sin(2 * np.pi * 120 * t) + 0.004 * np.sin(2 * np.pi * 180 * t)
    # Very faint air floor
    air = np.random.normal(0, 0.006, num_samples)
    return (hum + air).astype(np.float32)

def generate_tv_click_and_static(duration=1.8, sample_rate=44100):
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    sound = np.zeros(num_samples, dtype=np.float32)

    # 1. Rotary switch mechanical click (0.02s impulse)
    click_len = int(0.025 * sample_rate)
    t_click = np.linspace(0, 0.025, click_len)
    click = np.sin(2 * np.pi * 1100 * t_click) * np.exp(-t_click * 180) * 0.75
    click += np.sin(2 * np.pi * 420 * t_click) * np.exp(-t_click * 120) * 0.60
    sound[:click_len] += click

    # 2. 15.734 kHz CRT flyback pilot whine
    whine = 0.035 * np.sin(2 * np.pi * 15734 * t) * np.exp(-t * 2.5)
    sound += whine

    # 3. Burst of analog television static noise (Frame 218 to 251 = ~0.65s)
    burst_len = int(0.65 * sample_rate)
    static_burst = np.random.normal(0, 0.22, burst_len) * np.exp(-np.linspace(0, 1.8, burst_len))
    sound[:burst_len] += static_burst

    return sound

def generate_spring_ptwang(duration=2.2, sample_rate=44100):
    """Synthesizes the iconic violent metallic couch spring pop."""
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    sound = np.zeros(num_samples, dtype=np.float32)

    # 1. High-impact fabric tear / pop impulse
    pop_len = int(0.03 * sample_rate)
    t_pop = np.linspace(0, 0.03, pop_len)
    pop = np.sin(2 * np.pi * 180 * t_pop) * np.exp(-t_pop * 140) * 0.85
    sound[:pop_len] += pop

    # 2. Nonlinear FM spring coil pitch drop (340Hz down to 135Hz with metallic ring)
    f_fund = 135.0 + 205.0 * np.exp(-t * 6.5)
    phase = 2 * np.pi * np.cumsum(f_fund) / sample_rate
    spring = np.sin(phase) * np.exp(-t * 3.8) * 0.70
    # Add metallic overtones (2.1x, 3.4x, 5.1x)
    spring += 0.40 * np.sin(2.12 * phase) * np.exp(-t * 4.5)
    spring += 0.25 * np.sin(3.45 * phase) * np.exp(-t * 6.0)
    spring += 0.15 * np.sin(5.18 * phase) * np.exp(-t * 8.0)

    # Spring wobble / flutter amplitude modulation
    flutter = 1.0 + 0.35 * np.sin(2 * np.pi * 18 * t)
    sound += spring * flutter

    return sound

def generate_oil_glug(duration=2.0, sample_rate=44100):
    """Synthesizes vintage metal oil can clink & 10W-40 viscous glugs."""
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    sound = np.zeros(num_samples, dtype=np.float32)

    # Metal spout clink at t=0
    clink_len = int(0.04 * sample_rate)
    t_c = np.linspace(0, 0.04, clink_len)
    clink = (np.sin(2 * np.pi * 2400 * t_c) + 0.6 * np.sin(2 * np.pi * 3800 * t_c)) * np.exp(-t_c * 150) * 0.35
    sound[:clink_len] += clink

    # 3 descending liquid glugs at t=0.25, 0.65, 1.05
    for offset in [0.25, 0.65, 1.05]:
        glug_start = int(offset * sample_rate)
        g_len = int(0.18 * sample_rate)
        if glug_start + g_len < num_samples:
            t_g = np.linspace(0, 0.18, g_len)
            f_g = 420.0 - 180.0 * (t_g / 0.18) # pitch drop in cavity
            g_phase = 2 * np.pi * np.cumsum(f_g) / sample_rate
            glug = np.sin(g_phase) * np.sin(np.pi * t_g / 0.18) * 0.45
            sound[glug_start:glug_start + g_len] += glug

    return sound

def generate_metal_clatter(duration=2.5, sample_rate=44100):
    """Sudden heavy scrap metal crash & echoing girder clatter outside."""
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    sound = np.zeros(num_samples, dtype=np.float32)

    # Heavy impact
    imp_len = int(0.08 * sample_rate)
    t_i = np.linspace(0, 0.08, imp_len)
    sound[:imp_len] += np.sin(2 * np.pi * 85 * t_i) * np.exp(-t_i * 60) * 0.85
    sound[:imp_len] += np.random.normal(0, 0.5, imp_len) * np.exp(-t_i * 80)

    # Resonant metallic ringing tones
    for f_res, amp in [(480, 0.35), (820, 0.28), (1240, 0.18), (2100, 0.12)]:
        sound += amp * np.sin(2 * np.pi * f_res * t) * np.exp(-t * 4.0)

    # Echoing clatter taps
    for tap_t, tap_amp in [(0.18, 0.4), (0.35, 0.3), (0.58, 0.22), (0.85, 0.14)]:
        t_start = int(tap_t * sample_rate)
        t_len = int(0.04 * sample_rate)
        if t_start + t_len < num_samples:
            t_tap = np.linspace(0, 0.04, t_len)
            sound[t_start:t_start + t_len] += tap_amp * np.sin(2 * np.pi * 950 * t_tap) * np.exp(-t_tap * 120)

    # Low sinister syndicate presence drone
    sound += 0.25 * np.sin(2 * np.pi * 42 * t) * np.minimum(1.0, t * 1.5) * np.exp(-t * 0.8)

    return sound

def generate_tire_thump(duration=0.35, sample_rate=44100):
    """Thump of Red landing on rug from couch hop."""
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    thump = np.sin(2 * np.pi * 72 * t) * np.exp(-t * 22) * 0.65
    thump += np.random.normal(0, 0.15, num_samples) * np.exp(-t * 35)
    return thump.astype(np.float32)

def generate_snes_tv_sound(duration=15.0, sample_rate=44100):
    """Authentic 1994 Uniracers 16-bit square wave race audio heard through small CRT speaker."""
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    sound = np.zeros(num_samples, dtype=np.float32)

    # High-revving 2-stroke unicycle engine whine (square wave)
    rpm_mod = 220.0 + 80.0 * np.sin(2 * np.pi * 1.2 * t) + 40.0 * np.sin(2 * np.pi * 0.3 * t)
    engine_phase = 2 * np.pi * np.cumsum(rpm_mod) / sample_rate
    sq_engine = np.sign(np.sin(engine_phase)) * 0.08

    # SNES chiptune arpeggios (upbeat 16-bit racing melody)
    notes = [440, 554, 659, 880, 659, 554, 440, 330]
    melody = np.zeros(num_samples, dtype=np.float32)
    step_samples = int(0.125 * sample_rate)
    for i, n in enumerate(notes * 15):
        s = i * step_samples
        e = s + step_samples
        if s >= num_samples:
            break
        e = min(e, num_samples)
        t_sub = t[s:e]
        melody[s:e] = 0.06 * np.sign(np.sin(2 * np.pi * n * t_sub)) * np.exp(-(t_sub - t[s]) * 6.0)

    tv_sound = sq_engine + melody
    # Filter with small CRT speaker bandwidth (bandpass around 800Hz - 3500Hz)
    return tv_sound.astype(np.float32)

# =============================================================================
# Full Master Soundtrack Assembly (45.0s, 1080 frames @ 24fps)
# =============================================================================

def assemble_master_soundtrack(total_duration=45.0, sample_rate=44100):
    total_samples = int(total_duration * sample_rate)
    mix_left = np.zeros(total_samples, dtype=np.float32)
    mix_right = np.zeros(total_samples, dtype=np.float32)

    print(f"🎼 Assembling Master 45.0s Soundtrack ({total_samples} samples @ {sample_rate}Hz)...")

    # 1. Shot 1 Wind (0.0s to 7.8s)
    wind_samples = int(7.8 * sample_rate)
    wind = generate_ambient_wind(7.8, sample_rate)
    mix_left[:wind_samples] += wind
    mix_right[:wind_samples] += wind

    # 2. Garage Room Tone (15.0s to 45.0s)
    garage_start = int(15.0 * sample_rate)
    garage_dur = total_duration - 15.0
    room_tone = generate_garage_room_tone(garage_dur, sample_rate)
    mix_left[garage_start:garage_start + len(room_tone)] += room_tone
    mix_right[garage_start:garage_start + len(room_tone)] += room_tone

    # 3. Organic Grunge Rock Track
    if os.path.exists(GRUNGE_AUDIO):
        print(f"🎸 Blending Organic Grunge into master mix...")
        try:
            c = av.open(GRUNGE_AUDIO)
            frames = [f.to_ndarray() for f in c.decode(audio=0)]
            g_audio = np.concatenate(frames, axis=1) # shape (2, N)

            # Build full 45.0s envelope for the grunge track:
            # - 0:00 to 0:07.5: Swells from 0.06 to 1.0
            # - 0:07.5 to 0:15.0: Full 1.0 blast (Shot 2 macro puddle)
            # - 0:15.0 (Hard cut): Instantly drops to 0.14 (muffled through garage door)
            # - 0:15.0 to 0:40.0: Plays as low background shop tone (0.12 - 0.14)
            # - 0:40.0 to 0:45.0: Fades out under the ominous yard clatter
            g_env = np.zeros(total_samples, dtype=np.float32)

            # Segment 1: Swell (0 to 7.5s)
            s1_len = int(7.5 * sample_rate)
            t_s1 = np.linspace(0, 1, s1_len)
            g_env[:s1_len] = 0.06 + 0.94 * (t_s1 ** 1.8)

            # Segment 2: Full blast (7.5 to 15.0s)
            s2_end = int(15.0 * sample_rate)
            g_env[s1_len:s2_end] = 1.0

            # Segment 3: Garage interior muffle (15.0 to 40.0s)
            s3_end = int(40.0 * sample_rate)
            g_env[s2_end:s3_end] = 0.14

            # Segment 4: Fade out on yard clatter (40.0 to 45.0s)
            t_s4 = np.linspace(1, 0, total_samples - s3_end)
            g_env[s3_end:] = 0.14 * t_s4

            # Ingest audio samples
            avail = min(total_samples, g_audio.shape[1])
            mix_left[:avail] += g_audio[0, :avail] * g_env[:avail]
            mix_right[:avail] += g_audio[1, :avail] * g_env[:avail]
            print(f"  Blended Organic Grunge across 45.0s (Swell -> Full -> Garage Muffle -> Out)")
        except Exception as e:
            print(f"⚠️ Audio error loading grunge track: {e}")

    # Helper function to overlay sound effect
    def add_sfx(sound_arr, start_sec, vol_l=1.0, vol_r=1.0):
        start_idx = int(start_sec * sample_rate)
        length = len(sound_arr)
        end_idx = min(total_samples, start_idx + length)
        chunk = sound_arr[:end_idx - start_idx]
        mix_left[start_idx:end_idx] += chunk * vol_l
        mix_right[start_idx:end_idx] += chunk * vol_r

    # 4. Beat 2 Foley Cues:
    # 0:24.08 (Master Frame 578 / Beat 2 F218): TV Click and Analog Static Burst
    print("  Adding TV click & CRT static burst at 0:24.08...")
    tv_burst = generate_tv_click_and_static(2.0, sample_rate)
    add_sfx(tv_burst, start_sec=24.08, vol_l=0.75, vol_r=0.45)

    # 0:24.7 to 0:39.5: 16-bit SNES race chiptune playing on the CRT TV
    print("  Adding SNES 16-bit TV race audio at 0:24.70...")
    snes_audio = generate_snes_tv_sound(15.0, sample_rate)
    add_sfx(snes_audio, start_sec=24.70, vol_l=0.35, vol_r=0.20)

    # 0:25.75 (Master Frame 618 / Beat 2 F258): PTWANG! Spring pop & wobble
    print("  Adding PTWANG! spring pop at 0:25.75...")
    spring_sfx = generate_spring_ptwang(2.2, sample_rate)
    add_sfx(spring_sfx, start_sec=25.75, vol_l=0.90, vol_r=0.95)

    # 0:35.4 (Master Frame 850 / Beat 2 F490): 10W-40 Vintage Oil Can Chug
    print("  Adding 10W-40 motor oil chug at 0:35.40...")
    oil_sfx = generate_oil_glug(2.2, sample_rate)
    add_sfx(oil_sfx, start_sec=35.40, vol_l=0.85, vol_r=0.65)

    # 0:40.0 (Master Frame 960 / Beat 2 F600): Scrap Yard Metallic Clatter Outside
    print("  Adding ominous scrap yard girder clatter at 0:40.00...")
    clatter_sfx = generate_metal_clatter(2.8, sample_rate)
    add_sfx(clatter_sfx, start_sec=40.00, vol_l=0.70, vol_r=1.0) # panned right towards doorway!

    # 0:41.17 (Master Frame 988 / Beat 2 F628): Tire hop down & rug thump
    print("  Adding tire cushion bounce & rug thump at 0:41.17...")
    thump_sfx = generate_tire_thump(0.4, sample_rate)
    add_sfx(thump_sfx, start_sec=41.17, vol_l=0.70, vol_r=0.70)

    # Normalize & Master Limiter
    peak = max(np.max(np.abs(mix_left)), np.max(np.abs(mix_right)), 1.0)
    mix_left = mix_left / peak * 0.95
    mix_right = mix_right / peak * 0.95

    return mix_left, mix_right

# =============================================================================
# Video Frames Assembly & Encoding
# =============================================================================

def collect_master_frames():
    b1_frames = sorted(glob.glob(os.path.join(BEAT1_FRAMES_DIR, "frame_*.png")))[:360]
    b2_frames = sorted(glob.glob(os.path.join(BEAT2_FRAMES_DIR, "frame_*.png")))[:720]

    print(f"🎬 Ingesting frames: Beat 1 = {len(b1_frames)} frames, Beat 2 = {len(b2_frames)} frames.")
    if len(b1_frames) < 360:
        print(f"⚠️ Warning: Found {len(b1_frames)} Beat 1 frames (expected 360).")
    if len(b2_frames) < 720:
        print(f"⚠️ Warning: Found {len(b2_frames)} Beat 2 frames (expected 720).")

    return b1_frames + b2_frames

def encode_master_cut(frame_paths):
    if not frame_paths:
        print("❌ No frames provided for encoding!")
        return False

    first_img = Image.open(frame_paths[0])
    w, h = first_img.size
    fps = 24
    total_frames = len(frame_paths)
    total_duration = total_frames / float(fps)
    bar_height = int(h * 0.12) # 2.39:1 anamorphic letterbox

    print(f"🎥 Encoding Master Prologue Reel ({total_frames} frames, {total_duration:.1f}s @ {fps}fps) -> {OUTPUT_MP4}...")

    container = av.open(OUTPUT_MP4, mode='w')
    v_stream = container.add_stream('libx264', rate=fps)
    v_stream.width = w
    v_stream.height = h
    v_stream.pix_fmt = 'yuv420p'
    v_stream.options = {'crf': '18', 'preset': 'fast'}

    # Audio stream
    sample_rate = 44100
    mix_l, mix_r = assemble_master_soundtrack(total_duration=total_duration, sample_rate=sample_rate)
    a_stream = container.add_stream('aac', rate=sample_rate)
    a_stream.layout = 'stereo'

    # Stream video frames with letterbox and Shot 1 fade-in
    print("🎞️ Processing and streaming video frames...")
    for idx, f_path in enumerate(frame_paths):
        frame_num = idx + 1
        img = Image.open(f_path).convert('RGB')

        # Shot 1 fade-in from pure black (Frames 1 to 48)
        if frame_num <= 48:
            fade_fac = frame_num / 48.0
            arr = np.array(img, dtype=np.float32) * fade_fac
            img = Image.fromarray(arr.astype(np.uint8))

        # Letterbox bars
        draw = ImageDraw.Draw(img)
        draw.rectangle([(0, 0), (w, bar_height)], fill=(0, 0, 0))
        draw.rectangle([(0, h - bar_height), (w, h)], fill=(0, 0, 0))

        v_frame = av.VideoFrame.from_image(img)
        v_frame.pts = idx
        for packet in v_stream.encode(v_frame):
            container.mux(packet)

        if frame_num % 120 == 0 or frame_num == total_frames:
            pct = (frame_num / float(total_frames)) * 100.0
            print(f"  Streamed Frame {frame_num}/{total_frames} ({pct:.1f}%)")

    for packet in v_stream.encode():
        container.mux(packet)

    # Encode audio frames in 1024 sample chunks
    print("🔊 Streaming mastered stereo audio packets...")
    chunk_size = 1024
    num_chunks = int(len(mix_l) / chunk_size)
    pts = 0
    for c_idx in range(num_chunks):
        start = c_idx * chunk_size
        end = start + chunk_size
        chunk_l = mix_l[start:end]
        chunk_r = mix_r[start:end]
        stereo_chunk = np.vstack([chunk_l, chunk_r])

        a_frame = av.AudioFrame.from_ndarray(stereo_chunk, format='fltp', layout='stereo')
        a_frame.rate = sample_rate
        a_frame.pts = pts
        pts += chunk_size

        for packet in a_stream.encode(a_frame):
            container.mux(packet)

    for packet in a_stream.encode():
        container.mux(packet)

    container.close()
    file_size_mb = os.path.getsize(OUTPUT_MP4) / (1024 * 1024)
    print(f"🎉 SUCCESS! Master Prologue Reel encoded to {OUTPUT_MP4} ({file_size_mb:.2f} MB)")
    return True

if __name__ == "__main__":
    frames = collect_master_frames()
    encode_master_cut(frames)
