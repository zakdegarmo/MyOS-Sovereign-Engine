"""
synth_16bit_soundtrack.py
-------------------------
Procedural 16-bit chiptune/hard-rock soundtrack and sound FX generator for Uniracers.
Generates driving power chord riffs, retro bass pulses, and engine revs using pure numpy + wave.
Zero cloud tokens, 100% deterministic, high-energy 1994 SNES arcade feel!
"""

import os
import sys
import wave
import struct
import math
import numpy as np

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
AUDIO_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

SAMPLE_RATE = 44100

def generate_square_wave(freq, duration, duty=0.5):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    wave_data = np.where((t * freq) % 1.0 < duty, 0.6, -0.6)
    return wave_data

def generate_overdrive_guitar(freq, duration):
    """Simulates 16-bit distorted guitar power chords with clipping and harmonics."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Fundamental + Fifth + Octave
    f = freq
    signal = (
        np.sin(2 * np.pi * f * t) * 0.5 +
        np.sin(2 * np.pi * (f * 1.498) * t) * 0.35 +
        np.sin(2 * np.pi * (f * 2.0) * t) * 0.25
    )
    # Hard overdrive clipping
    overdrive = np.clip(signal * 3.5, -0.85, 0.85)
    # Decay envelope
    decay = np.exp(-t * 2.0)
    return overdrive * decay

def generate_motor_rev(duration, start_freq=120, end_freq=380):
    """Simulates unicycle motor spinning up and revving rubber."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    freq = np.linspace(start_freq, end_freq, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    # Sawtooth-like motor buzz
    saw = 2 * (phase / (2 * np.pi) - np.floor(phase / (2 * np.pi) + 0.5))
    noise = np.random.uniform(-0.15, 0.15, len(t))
    rev = np.clip((saw * 0.4 + noise) * 1.5, -0.6, 0.6)
    return rev

def synthesize_rock_track(output_path, bpm=140, total_duration=8.2):
    """Composes an 8-second 16-bit rock riff for cutscenes."""
    total_samples = int(SAMPLE_RATE * total_duration)
    left_channel = np.zeros(total_samples, dtype=np.float32)
    right_channel = np.zeros(total_samples, dtype=np.float32)

    beat_len = 60.0 / bpm # ~0.428s per beat
    # Outlaw rock progression: E5 -> G5 -> A5 -> B5 -> E5
    riff_notes = [
        (82.4, beat_len * 2),   # E2
        (98.0, beat_len),       # G2
        (110.0, beat_len),      # A2
        (82.4, beat_len * 2),   # E2
        (123.47, beat_len),     # B2
        (110.0, beat_len * 2),  # A2
        (98.0, beat_len * 2),   # G2
        (82.4, beat_len * 4),   # E2 long sustain
    ]

    current_idx = 0
    for freq, dur in riff_notes:
        if current_idx >= total_samples:
            break
        chord = generate_overdrive_guitar(freq, dur)
        num_s = min(len(chord), total_samples - current_idx)
        left_channel[current_idx:current_idx + num_s] += chord[:num_s] * 0.7
        right_channel[current_idx:current_idx + num_s] += chord[:num_s] * 0.7
        current_idx += int(dur * SAMPLE_RATE)

    # Add kick/snare pulse
    num_beats = int(total_duration / beat_len)
    for b in range(num_beats):
        b_idx = int(b * beat_len * SAMPLE_RATE)
        if b_idx + 4000 < total_samples:
            if b % 2 == 0:
                # Bass drum thud
                kick_t = np.linspace(0, 0.15, int(SAMPLE_RATE * 0.15), endpoint=False)
                kick = np.sin(2 * np.pi * 55 * np.exp(-kick_t * 25) * kick_t) * np.exp(-kick_t * 18)
                left_channel[b_idx:b_idx + len(kick)] += kick * 0.8
                right_channel[b_idx:b_idx + len(kick)] += kick * 0.8
            else:
                # Snare noise crack
                snare_len = int(SAMPLE_RATE * 0.12)
                snare = np.random.uniform(-0.5, 0.5, snare_len) * np.exp(-np.linspace(0, 5, snare_len))
                left_channel[b_idx:b_idx + snare_len] += snare * 0.5
                right_channel[b_idx:b_idx + snare_len] += snare * 0.5

    # Add accelerating engine burn at the end (Shot 4 peel-out: 6.0s to 8.0s)
    rev_start = int(5.8 * SAMPLE_RATE)
    rev_len = int(2.2 * SAMPLE_RATE)
    if rev_start + rev_len <= total_samples:
        motor = generate_motor_rev(2.2, start_freq=90, end_freq=450)
        left_channel[rev_start:rev_start + rev_len] += motor * 0.55
        right_channel[rev_start:rev_start + rev_len] += motor * 0.55

    # Master limiter & 16-bit PCM conversion
    master = np.stack([left_channel, right_channel], axis=1)
    peak = np.max(np.abs(master))
    if peak > 0.95:
        master = master / peak * 0.95
    
    pcm16 = (master * 32767).astype(np.int16)

    with wave.open(output_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm16.tobytes())

    print(f"Synthesized 16-bit rock soundtrack: {output_path} ({os.path.getsize(output_path)} bytes)")
    return output_path

def generate_rhodes_key(freq, duration):
    """Simulates a vintage 16-bit FM/Rhodes electric piano tine."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Fundamental + Bell tone (approx 3.98x freq) + subtle octave
    bell = np.sin(2 * np.pi * (freq * 3.98) * t) * np.exp(-t * 9.0) * 0.4
    fundamental = np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.8) * 0.6
    octave = np.sin(2 * np.pi * (freq * 2.0) * t) * np.exp(-t * 3.5) * 0.25
    tremolo = 1.0 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    return (fundamental + bell + octave) * tremolo

def synthesize_extended_act1_score(output_path, total_duration=160.0):
    """
    Composes a full 2-minute-40-second (160s) 4-movement procedural symphonic score:
    - Movement 1 (0:00 - 0:50): The Industrial Wasteland (ambient sub-drone, wind, oil drips)
    - Movement 2 (0:50 - 1:20): Echoes of 1994 (melancholic 16-bit Rhodes electric piano)
    - Movement 3 (1:20 - 1:50): The Outlaw Frequency (CRT 15.7kHz, radio static, pirate synth)
    - Movement 4 (1:50 - 2:40): Outlaw Ignition & Peelout (140 BPM heavy rock, engine revs, floor crash)
    """
    total_samples = int(SAMPLE_RATE * total_duration)
    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)

    # =========================================================================
    # MOVEMENT 1 (0.0s to 50.0s): THE INDUSTRIAL WASTELAND
    # =========================================================================
    t_m1 = np.linspace(0, 50.0, int(SAMPLE_RATE * 50.0), endpoint=False)
    # Deep sub-bass resonant hum (46.2 Hz / F#0 with slow 0.05 Hz filter sweep)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.06 * t_m1)
    drone_fund = np.sin(2 * np.pi * 46.2 * t_m1) * 0.25 * lfo
    drone_fifth = np.sin(2 * np.pi * 69.3 * t_m1) * 0.14 * (1.0 - lfo * 0.5)
    drone_oct = np.sin(2 * np.pi * 92.4 * t_m1) * 0.08
    m1_drone = drone_fund + drone_fifth + drone_oct

    # Slow industrial wind noise (filtered noise)
    noise = np.random.uniform(-0.08, 0.08, len(t_m1))
    wind_envelope = (0.5 + 0.5 * np.sin(2 * np.pi * 0.12 * t_m1)) * 0.4
    m1_wind = noise * wind_envelope

    # Gentle tape hiss
    hiss = np.random.uniform(-0.015, 0.015, len(t_m1))

    m1_len = len(t_m1)
    left[:m1_len] += m1_drone * 0.9 + m1_wind * 0.7 + hiss
    right[:m1_len] += m1_drone * 0.9 + m1_wind * 0.8 + hiss

    # Periodic oil drop pings (at 8s, 16s, 24s, 32s, 40s)
    for drop_s in [8.0, 16.5, 25.0, 33.2, 42.0]:
        idx = int(drop_s * SAMPLE_RATE)
        drop_t = np.linspace(0, 0.6, int(SAMPLE_RATE * 0.6), endpoint=False)
        drop_ping = np.sin(2 * np.pi * 1280.0 * np.exp(-drop_t * 6.0) * drop_t) * np.exp(-drop_t * 10.0) * 0.25
        left[idx:idx + len(drop_ping)] += drop_ping * 0.7
        right[idx:idx + len(drop_ping)] += drop_ping * 0.4

    # =========================================================================
    # MOVEMENT 2 (50.0s to 80.0s): ECHOES OF 1994 (Melancholic Rhodes Theme)
    # =========================================================================
    # Chord progression: Em9 -> Cmaj7 -> Am7 -> Bm7 (each 7.5 seconds)
    rhodes_chords = [
        # Em9 (E3, G3, B3, D4, F#4)
        (50.0, [164.8, 196.0, 246.9, 293.7, 370.0], 7.0),
        # Cmaj7 (C3, E3, G3, B3)
        (57.5, [130.8, 164.8, 196.0, 246.9], 7.0),
        # Am7 (A2, C3, E3, G3)
        (65.0, [110.0, 130.8, 164.8, 196.0], 7.0),
        # Bm7 (B2, D3, F#3, A3)
        (72.5, [123.5, 146.8, 185.0, 220.0], 7.0),
    ]
    for start_s, notes, dur in rhodes_chords:
        s_idx = int(start_s * SAMPLE_RATE)
        chord_buf = np.zeros(int(SAMPLE_RATE * dur), dtype=np.float32)
        for n_freq in notes:
            chord_buf += generate_rhodes_key(n_freq, dur) * 0.16
        end_idx = min(s_idx + len(chord_buf), total_samples)
        num_s = end_idx - s_idx
        left[s_idx:end_idx] += chord_buf[:num_s] * 0.85
        right[s_idx:end_idx] += chord_buf[:num_s] * 0.85

    # Continuing warm sub-bass pad through Movement 2
    t_m2 = np.linspace(0, 30.0, int(SAMPLE_RATE * 30.0), endpoint=False)
    m2_bass = np.sin(2 * np.pi * 55.0 * t_m2) * 0.18
    s2_start = int(50.0 * SAMPLE_RATE)
    left[s2_start:s2_start + len(m2_bass)] += m2_bass
    right[s2_start:s2_start + len(m2_bass)] += m2_bass

    # =========================================================================
    # MOVEMENT 3 (80.0s to 110.0s): THE OUTLAW FREQUENCY
    # =========================================================================
    # CRT horizontal flyback trace whine (15.734 kHz, very subtle atmosphere)
    t_m3 = np.linspace(0, 30.0, int(SAMPLE_RATE * 30.0), endpoint=False)
    crt_whine = np.sin(2 * np.pi * 15734.0 * t_m3) * 0.025
    s3_start = int(80.0 * SAMPLE_RATE)
    left[s3_start:s3_start + len(crt_whine)] += crt_whine
    right[s3_start:s3_start + len(crt_whine)] += crt_whine

    # Radio static bursts at TV tuning moments (82s, 86s, 92s, 98s)
    for stat_s, dur in [(82.0, 1.2), (86.5, 0.9), (91.0, 1.8), (96.5, 2.5)]:
        s_idx = int(stat_s * SAMPLE_RATE)
        burst_t = np.linspace(0, dur, int(SAMPLE_RATE * dur), endpoint=False)
        burst = np.random.uniform(-0.35, 0.35, len(burst_t)) * (0.8 + 0.2 * np.sin(2 * np.pi * 60 * burst_t))
        num_s = min(len(burst), total_samples - s_idx)
        left[s_idx:s_idx + num_s] += burst[:num_s] * 0.45
        right[s_idx:s_idx + num_s] += burst[:num_s] * 0.45

    # Accelerating heartbeat pulse as Red perks up (94s to 110s)
    beat_times = [94.0, 95.2, 96.3, 97.3, 98.2, 99.0, 99.7, 100.4, 101.0, 101.6, 102.1, 102.6, 103.0, 103.4, 103.8, 104.2, 104.6, 105.0]
    for b_s in beat_times:
        idx = int(b_s * SAMPLE_RATE)
        hb_t = np.linspace(0, 0.18, int(SAMPLE_RATE * 0.18), endpoint=False)
        heartbeat = np.sin(2 * np.pi * 65.0 * np.exp(-hb_t * 20.0) * hb_t) * np.exp(-hb_t * 12.0) * 0.55
        left[idx:idx + len(heartbeat)] += heartbeat
        right[idx:idx + len(heartbeat)] += heartbeat

    # Pirate synth arpeggio rising into ignition (104.0s to 110.0s)
    arp_notes = [220.0, 261.6, 329.6, 392.0, 440.0, 523.2, 659.2, 784.0]
    arp_dur = 0.18
    for i, a_freq in enumerate(arp_notes * 4):
        a_s = 104.0 + i * arp_dur
        if a_s >= 110.0:
            break
        a_idx = int(a_s * SAMPLE_RATE)
        t_note = np.linspace(0, arp_dur, int(SAMPLE_RATE * arp_dur), endpoint=False)
        sq_wave = np.where((t_note * a_freq) % 1.0 < 0.5, 0.22, -0.22) * np.exp(-t_note * 4.0)
        left[a_idx:a_idx + len(sq_wave)] += sq_wave * 0.4
        right[a_idx:a_idx + len(sq_wave)] += sq_wave * 0.4

    # =========================================================================
    # MOVEMENT 4 (110.0s to 160.0s): OUTLAW IGNITION & ROCK CLIMAX
    # =========================================================================
    # Part 4A: Motor spooling & Bearing lube (110.0s to 132.0s)
    motor_start = int(112.0 * SAMPLE_RATE)
    motor_dur = 20.0
    motor_spool = generate_motor_rev(motor_dur, start_freq=65.0, end_freq=340.0)
    num_s = min(len(motor_spool), total_samples - motor_start)
    left[motor_start:motor_start + num_s] += motor_spool[:num_s] * 0.4
    right[motor_start:motor_start + num_s] += motor_spool[:num_s] * 0.4

    # Part 4B: Full 140 BPM DMA Industrial Rock Drop (132.0s to 160.0s, 28 seconds of rock)
    rock_start_s = 132.0
    rock_dur = 28.0
    bpm = 140.0
    beat_len = 60.0 / bpm # ~0.4285s
    num_rock_beats = int(rock_dur / beat_len)

    # Riff progression: E2 -> G2 -> A2 -> B2 -> D3 -> E3
    riff = [
        (82.4, beat_len * 2),
        (98.0, beat_len),
        (110.0, beat_len),
        (123.5, beat_len * 2),
        (146.8, beat_len),
        (164.8, beat_len),
        (82.4, beat_len * 4),
        (98.0, beat_len * 2),
        (110.0, beat_len * 2),
    ]

    r_idx = int(rock_start_s * SAMPLE_RATE)
    riff_cycle_idx = 0
    while r_idx < total_samples - int(beat_len * SAMPLE_RATE):
        freq, dur = riff[riff_cycle_idx % len(riff)]
        chord = generate_overdrive_guitar(freq, dur)
        num_c = min(len(chord), total_samples - r_idx)
        left[r_idx:r_idx + num_c] += chord[:num_c] * 0.75
        right[r_idx:r_idx + num_c] += chord[:num_c] * 0.75
        r_idx += int(dur * SAMPLE_RATE)
        riff_cycle_idx += 1

    # Heavy Kick & Snare Drums (132.0s to 160.0s)
    for b in range(num_rock_beats):
        b_s = rock_start_s + b * beat_len
        b_idx = int(b_s * SAMPLE_RATE)
        if b_idx >= total_samples - 4000:
            break
        if b % 2 == 0:
            # Kick drum (heavy punch)
            k_t = np.linspace(0, 0.16, int(SAMPLE_RATE * 0.16), endpoint=False)
            kick = np.sin(2 * np.pi * 65.0 * np.exp(-k_t * 22.0) * k_t) * np.exp(-k_t * 14.0) * 0.95
            left[b_idx:b_idx + len(kick)] += kick
            right[b_idx:b_idx + len(kick)] += kick
        else:
            # Snare crack (white noise burst + tone)
            s_len = int(SAMPLE_RATE * 0.15)
            s_t = np.linspace(0, 0.15, s_len, endpoint=False)
            snare_noise = np.random.uniform(-0.6, 0.6, s_len) * np.exp(-s_t * 22.0)
            snare_tone = np.sin(2 * np.pi * 185.0 * s_t) * np.exp(-s_t * 28.0) * 0.4
            snare = snare_noise + snare_tone
            left[b_idx:b_idx + s_len] += snare * 0.8
            right[b_idx:b_idx + s_len] += snare * 0.8

    # Massive Landing Impact Crash at 148.0s (when Red slams the floor)
    crash_s = 148.0
    c_idx = int(crash_s * SAMPLE_RATE)
    c_len = int(SAMPLE_RATE * 2.5)
    c_t = np.linspace(0, 2.5, c_len, endpoint=False)
    # Heavy sub-drop + metal impact
    sub_drop = np.sin(2 * np.pi * 85.0 * np.exp(-c_t * 8.0) * c_t) * np.exp(-c_t * 4.0) * 1.2
    metal_crash = np.random.uniform(-0.7, 0.7, c_len) * np.exp(-c_t * 7.0)
    crash = (sub_drop + metal_crash) * 0.85
    num_cr = min(c_len, total_samples - c_idx)
    left[c_idx:c_idx + num_cr] += crash[:num_cr]
    right[c_idx:c_idx + num_cr] += crash[:num_cr]

    # Full Throttle Roaring Peelout Motor (149.0s to 160.0s)
    peel_idx = int(149.0 * SAMPLE_RATE)
    peel_dur = 11.0
    peel_motor = generate_motor_rev(peel_dur, start_freq=180.0, end_freq=720.0)
    num_p = min(len(peel_motor), total_samples - peel_idx)
    left[peel_idx:peel_idx + num_p] += peel_motor[:num_p] * 0.65
    right[peel_idx:peel_idx + num_p] += peel_motor[:num_p] * 0.65

    # Master Limiter & Normalization
    master = np.stack([left, right], axis=1)
    peak = np.max(np.abs(master))
    if peak > 0.0:
        master = master / peak * 0.94 # normalize to -0.5 dB ceiling

    pcm16 = (master * 32767).astype(np.int16)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with wave.open(output_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm16.tobytes())

    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[SUCCESS] Full 160s Symphonic Score baked to:\n  {output_path} ({file_size_mb:.2f} MB, {total_duration:.1f}s)")
    return output_path

def main():
    act1_audio = os.path.join(AUDIO_DIR, "act1_scrap_yard_rock.wav")
    act2_audio = os.path.join(AUDIO_DIR, "act2_neon_docks_rock.wav")
    act3_audio = os.path.join(AUDIO_DIR, "act3_citadel_ambush_rock.wav")
    act4_audio = os.path.join(AUDIO_DIR, "act4_outlaw_canyon_rock.wav")
    synthesize_rock_track(act1_audio, bpm=142, total_duration=8.2)
    synthesize_rock_track(act2_audio, bpm=150, total_duration=8.2)
    synthesize_rock_track(act3_audio, bpm=160, total_duration=8.2)
    synthesize_rock_track(act4_audio, bpm=170, total_duration=8.2)

    # The Master 160-Second Symphonic Score for the 2.5-Minute Extended Film
    full_act1_audio = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "act1_scrap_yard_rock_full.wav")
    synthesize_extended_act1_score(full_act1_audio, total_duration=160.0)
    print("SUCCESS: All procedural sound tracks compiled.")

if __name__ == "__main__":
    main()
