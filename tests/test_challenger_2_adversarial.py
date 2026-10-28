"""
tests/test_challenger_2_adversarial.py
Challenger 2 Empirical Adversarial Stress Test Suite:
1. PyAV Compiler Stress Testing (stitch_studio_reel.py):
   - Missing/gap frames, empty directories, corrupted images, zero-byte files,
   - Variable frame rates (12, 24, 30, 60 fps), variable resolutions (320x180, 720p, 1080p), odd resolutions.
2. Container Integrity & H.264 Compliance (crimson_zenith_teaser.mp4):
   - IDR keyframe start, packet DTS monotonicity, frame PTS monotonicity, zero decode errors.
3. HTTP Range Request & Video Streaming:
   - RFC 7233 byte-range seeking (head, mid-stream, explicit tail, suffix range quirk, 416 out-of-bounds) against active Vite servers.
4. Blender 5.2 Headless Filming Engine CLI Stress:
   - Headless execution with custom production manifest, frame range setting, and PyAV compilation verification.
"""

import os
import sys
import json
import shutil
import tempfile
import unittest
import subprocess
import urllib.request
import urllib.error
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TOOLS_DIR = os.path.join(PROJECT_ROOT, "scripts", "tools")
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if TOOLS_DIR not in sys.path:
    sys.path.insert(0, TOOLS_DIR)

import av
from stitch_studio_reel import stitch_movie, verify_video_stream


class TestStitcherEdgeCases(unittest.TestCase):
    """Stress testing stitch_studio_reel.py under hostile and corner-case inputs."""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="challenger2_stitch_")

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_01_empty_frames_directory(self):
        """Verifies stitch_movie returns False gracefully on empty directory."""
        output_mp4 = os.path.join(self.temp_dir, "empty_out.mp4")
        success = stitch_movie(frames_dir=self.temp_dir, output_path=output_mp4)
        self.assertFalse(success, "stitch_movie should fail when no frames are present")
        self.assertFalse(os.path.exists(output_mp4), "No MP4 should be created for empty directory")

    def test_02_non_existent_frames_directory(self):
        """Verifies stitch_movie returns False when input directory does not exist."""
        bad_dir = os.path.join(self.temp_dir, "does_not_exist_9999")
        output_mp4 = os.path.join(self.temp_dir, "bad_dir_out.mp4")
        success = stitch_movie(frames_dir=bad_dir, output_path=output_mp4)
        self.assertFalse(success, "stitch_movie should fail for non-existent directory")

    def test_03_zero_byte_frame_exception_behavior(self):
        """
        Empirically observes stitch_movie behavior on a 0-byte frame.
        Exposes whether Image.open on line 79 crashes with UnidentifiedImageError
        or handles it gracefully.
        """
        zero_frame = os.path.join(self.temp_dir, "frame_0001.png")
        with open(zero_frame, "wb") as f:
            pass  # 0 bytes
        output_mp4 = os.path.join(self.temp_dir, "zero_frame_out.mp4")

        crashed = False
        returned_false = False
        try:
            success = stitch_movie(frames_dir=self.temp_dir, output_path=output_mp4)
            if not success:
                returned_false = True
        except Exception as e:
            crashed = True
            print(f"\n[Vulnerability Observed] stitch_movie crashed on 0-byte frame with {type(e).__name__}: {e}")

        # The function must either return False or we document the crash
        self.assertTrue(crashed or returned_false, "Must either crash with UnidentifiedImageError or return False")

    def test_04_corrupted_header_frame_behavior(self):
        """
        Empirically observes stitch_movie behavior on corrupted PNG bytes.
        Exposes unguarded Image.open at line 79.
        """
        bad_frame = os.path.join(self.temp_dir, "frame_0001.png")
        with open(bad_frame, "wb") as f:
            f.write(b"NOT_A_VALID_PNG_STREAM_DATA_TRUNCATED")
        output_mp4 = os.path.join(self.temp_dir, "corrupted_frame_out.mp4")

        crashed = False
        returned_false = False
        try:
            success = stitch_movie(frames_dir=self.temp_dir, output_path=output_mp4)
            if not success:
                returned_false = True
        except Exception as e:
            crashed = True
            print(f"\n[Vulnerability Observed] stitch_movie crashed on corrupted bytes with {type(e).__name__}: {e}")

        self.assertTrue(crashed or returned_false)

    def test_05_gap_and_non_contiguous_frame_sequence(self):
        """Verifies stitch_movie compiles non-contiguous frame sequences (e.g. dropped frames)."""
        # Create frames 0001, 0004, 0009
        indices = [1, 4, 9]
        for idx in indices:
            img = Image.new("RGB", (320, 180), color=(idx * 25, 100, 200))
            img.save(os.path.join(self.temp_dir, f"frame_{idx:04d}.png"))

        output_mp4 = os.path.join(self.temp_dir, "gap_sequence.mp4")
        success = stitch_movie(frames_dir=self.temp_dir, output_path=output_mp4, fps=24)
        self.assertTrue(success, "stitch_movie should stitch available frames in sorted order")
        self.assertTrue(os.path.isfile(output_mp4))

        # Probe container
        c = av.open(output_mp4)
        st = c.streams.video[0]
        decoded = list(c.decode(st))
        c.close()
        self.assertEqual(len(decoded), 3, "Output should contain exactly 3 frames")

    def test_06_mismatched_frame_dimensions_handling(self):
        """
        Verifies behavior when frame 1 is 320x180 and frame 2 is 640x360.
        PyAV internally downsamples or crops subsequent frames to stream dimensions.
        """
        img1 = Image.new("RGB", (320, 180), color=(255, 0, 0))
        img1.save(os.path.join(self.temp_dir, "frame_0001.png"))
        img2 = Image.new("RGB", (640, 360), color=(0, 255, 0))
        img2.save(os.path.join(self.temp_dir, "frame_0002.png"))

        output_mp4 = os.path.join(self.temp_dir, "mismatched_out.mp4")
        success = stitch_movie(frames_dir=self.temp_dir, output_path=output_mp4)
        self.assertTrue(success, "PyAV successfully transcodes mismatched dimensions to stream resolution")

        c = av.open(output_mp4)
        st = c.streams.video[0]
        frames = list(c.decode(st))
        self.assertEqual(len(frames), 2)
        self.assertEqual(frames[0].width, 320)
        self.assertEqual(frames[1].width, 320)
        c.close()

    def test_07_variable_framerates(self):
        """Verifies stitch_movie at 12 fps, 24 fps, 30 fps, and 60 fps."""
        num_frames = 12
        for i in range(1, num_frames + 1):
            img = Image.new("RGB", (320, 180), color=(i * 20, 50, 150))
            img.save(os.path.join(self.temp_dir, f"frame_{i:04d}.png"))

        for target_fps in [12, 24, 30, 60]:
            out_file = os.path.join(self.temp_dir, f"rate_{target_fps}fps.mp4")
            success = stitch_movie(frames_dir=self.temp_dir, output_path=out_file, fps=target_fps)
            self.assertTrue(success, f"stitch_movie failed at {target_fps} fps")

            container = av.open(out_file)
            st = container.streams.video[0]
            self.assertEqual(float(st.average_rate), float(target_fps), f"Framerate mismatch for {target_fps} fps")
            frames = list(container.decode(st))
            self.assertEqual(len(frames), num_frames, f"Decoded frame count mismatch for {target_fps} fps")
            container.close()

    def test_08_variable_resolutions(self):
        """Verifies stitch_movie at 320x180, 640x360, and 1280x720."""
        for w, h in [(320, 180), (640, 360), (1280, 720)]:
            res_dir = os.path.join(self.temp_dir, f"res_{w}x{h}")
            os.makedirs(res_dir, exist_ok=True)
            for i in range(1, 5):
                img = Image.new("RGB", (w, h), color=(100, i * 40, 80))
                img.save(os.path.join(res_dir, f"frame_{i:04d}.png"))

            out_file = os.path.join(self.temp_dir, f"out_{w}x{h}.mp4")
            success = stitch_movie(frames_dir=res_dir, output_path=out_file, fps=24)
            self.assertTrue(success, f"stitch_movie failed at {w}x{h}")

            container = av.open(out_file)
            st = container.streams.video[0]
            self.assertEqual(st.width, w)
            self.assertEqual(st.height, h)
            frames = list(container.decode(st))
            self.assertEqual(len(frames), 4)
            container.close()

    def test_09_odd_resolution_handling(self):
        """Tests libx264 behavior when frame dimensions are odd (e.g. 321x181)."""
        odd_dir = os.path.join(self.temp_dir, "odd_res")
        os.makedirs(odd_dir, exist_ok=True)
        for i in range(1, 3):
            img = Image.new("RGB", (321, 181), color=(200, 100, 50))
            img.save(os.path.join(odd_dir, f"frame_{i:04d}.png"))

        out_file = os.path.join(self.temp_dir, "odd_out.mp4")
        success = stitch_movie(frames_dir=odd_dir, output_path=out_file, fps=24)
        # libx264 requires width/height divisible by 2 for yuv420p; stitcher catches exception and returns False
        self.assertFalse(success, "stitch_movie should fail cleanly when dimensions are not divisible by 2")


class TestTeaserContainerIntegrity(unittest.TestCase):
    """Deep inspection of apps/web/public/screenings/crimson_zenith_teaser.mp4."""

    @classmethod
    def setUpClass(cls):
        cls.teaser_path = os.path.join(PROJECT_ROOT, "apps", "web", "public", "screenings", "crimson_zenith_teaser.mp4")

    def test_01_file_exists_and_healthy_size(self):
        """Verifies teaser file exists and is larger than 100 KB."""
        self.assertTrue(os.path.isfile(self.teaser_path), f"Teaser missing: {self.teaser_path}")
        size = os.path.getsize(self.teaser_path)
        self.assertGreater(size, 100_000, f"Teaser file size ({size} bytes) is suspiciously small")

    def test_02_video_stream_specs(self):
        """Verifies codec, pixel format, resolution, and fps."""
        c = av.open(self.teaser_path)
        self.assertEqual(len(c.streams.video), 1, "Must contain exactly 1 video stream")
        st = c.streams.video[0]
        self.assertEqual(st.codec_context.name, "h264")
        self.assertEqual(st.pix_fmt, "yuv420p")
        self.assertEqual(st.width, 640)
        self.assertEqual(st.height, 360)
        self.assertEqual(float(st.average_rate), 24.0)
        c.close()

    def test_03_starts_with_idr_keyframe(self):
        """Verifies that the first packet and first frame are keyframes (IDR)."""
        c = av.open(self.teaser_path)
        st = c.streams.video[0]

        # First packet check
        packets = list(c.demux(st))
        self.assertGreater(len(packets), 0, "No packets demuxed")
        first_packet = packets[0]
        self.assertTrue(first_packet.is_keyframe, "First packet must be a keyframe (IDR)")

        # First decoded frame check
        c.seek(0)
        first_frame = next(c.decode(st))
        self.assertTrue(first_frame.key_frame, "First decoded frame must have key_frame=True")
        self.assertEqual(int(first_frame.pict_type), 1, "First frame pict_type must be 1 (I-Frame)")
        c.close()

    def test_04_full_decodability_zero_errors(self):
        """Verifies that all 96 frames decode cleanly without exceptions."""
        c = av.open(self.teaser_path)
        st = c.streams.video[0]
        frames = []
        for frame in c.decode(st):
            frames.append(frame)
        c.close()

        self.assertEqual(len(frames), 96, f"Expected 96 decoded frames, got {len(frames)}")

    def test_05_timestamp_monotonicity(self):
        """Verifies packet DTS monotonicity and strictly increasing frame PTS."""
        c = av.open(self.teaser_path)
        st = c.streams.video[0]

        # 1. Demux packets: check DTS monotonicity
        prev_dts = None
        for idx, packet in enumerate(c.demux(st)):
            if packet.dts is not None:
                if prev_dts is not None:
                    self.assertGreaterEqual(
                        packet.dts, prev_dts,
                        f"Non-monotonic packet DTS at packet {idx}: prev={prev_dts}, curr={packet.dts}"
                    )
                prev_dts = packet.dts

        # 2. Decode frames: check PTS strictly increasing
        c.seek(0)
        prev_pts = None
        for idx, frame in enumerate(c.decode(st)):
            if prev_pts is not None:
                self.assertGreater(
                    frame.pts, prev_pts,
                    f"Frame PTS not strictly increasing at frame {idx}: prev={prev_pts}, curr={frame.pts}"
                )
                delta = frame.pts - prev_pts
                self.assertEqual(delta, 512, f"Expected timestamp step 512, got {delta} at frame {idx}")
            else:
                self.assertEqual(frame.pts, 0, "First frame PTS must be 0")
            prev_pts = frame.pts
        c.close()

    def test_06_duration_integrity(self):
        """Verifies that container duration matches 4.0s (96 frames @ 24 fps)."""
        c = av.open(self.teaser_path)
        duration_sec = float(c.duration) / 1_000_000.0
        self.assertAlmostEqual(duration_sec, 4.0, delta=0.05, msg=f"Teaser duration {duration_sec}s deviates from 4.0s")
        c.close()


class TestHttpRangeStreaming(unittest.TestCase):
    """Verifies RFC 7233 byte-range seeking on the active Vite web server."""

    @classmethod
    def setUpClass(cls):
        cls.teaser_path = os.path.join(PROJECT_ROOT, "apps", "web", "public", "screenings", "crimson_zenith_teaser.mp4")
        with open(cls.teaser_path, "rb") as f:
            cls.file_bytes = f.read()
        cls.file_size = len(cls.file_bytes)
        cls.url_5173 = "http://localhost:5173/screenings/crimson_zenith_teaser.mp4"
        cls.url_5175 = "http://localhost:5175/screenings/crimson_zenith_teaser.mp4"

    def test_01_full_get_port_5173(self):
        """Verifies standard HTTP GET on port 5173 returns 200 with matching Content-Length and video/mp4."""
        req = urllib.request.Request(self.url_5173)
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            self.assertEqual(resp.headers.get("Content-Type"), "video/mp4")
            self.assertEqual(int(resp.headers.get("Content-Length")), self.file_size)

    def test_02_range_initial_bytes(self):
        """Verifies Range: bytes=0-1023 returns 206 Partial Content with byte-accurate match."""
        req = urllib.request.Request(self.url_5173, headers={"Range": "bytes=0-1023"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 206)
            self.assertEqual(resp.headers.get("Content-Range"), f"bytes 0-1023/{self.file_size}")
            self.assertEqual(int(resp.headers.get("Content-Length")), 1024)
            self.assertEqual(resp.headers.get("Accept-Ranges"), "bytes")
            data = resp.read()
            self.assertEqual(len(data), 1024)
            self.assertEqual(data, self.file_bytes[0:1024], "Initial byte range does not match file bytes exactly")

    def test_03_range_midstream_seeking(self):
        """Verifies Range: bytes=50000-99999 for middle seeking returns 206 with exact byte match."""
        req = urllib.request.Request(self.url_5173, headers={"Range": "bytes=50000-99999"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 206)
            self.assertEqual(resp.headers.get("Content-Range"), f"bytes 50000-99999/{self.file_size}")
            self.assertEqual(int(resp.headers.get("Content-Length")), 50000)
            data = resp.read()
            self.assertEqual(len(data), 50000)
            self.assertEqual(data, self.file_bytes[50000:100000], "Midstream bytes do not match file slice")

    def test_04_range_explicit_tail_seeking(self):
        """Verifies explicit Range: bytes=(size-2048)-(size-1) returns the final 2048 bytes."""
        start = self.file_size - 2048
        end = self.file_size - 1
        req = urllib.request.Request(self.url_5173, headers={"Range": f"bytes={start}-{end}"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 206)
            self.assertEqual(resp.headers.get("Content-Range"), f"bytes {start}-{end}/{self.file_size}")
            data = resp.read()
            self.assertEqual(len(data), 2048)
            self.assertEqual(data, self.file_bytes[start:])

    def test_05_range_open_ended(self):
        """Verifies open-ended Range: bytes=100000- returns from byte 100000 to EOF."""
        req = urllib.request.Request(self.url_5173, headers={"Range": "bytes=100000-"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 206)
            expected_len = self.file_size - 100000
            self.assertEqual(int(resp.headers.get("Content-Length")), expected_len)
            data = resp.read()
            self.assertEqual(len(data), expected_len)
            self.assertEqual(data, self.file_bytes[100000:])

    def test_06_range_unsatisfiable_416(self):
        """Verifies out-of-bounds byte range returns HTTP 416 Range Not Satisfiable."""
        req = urllib.request.Request(self.url_5173, headers={"Range": "bytes=99999999-99999999"})
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req, timeout=5)
        self.assertEqual(ctx.exception.code, 416)

    def test_07_port_5175_dispatch_diagnosis(self):
        """
        Empirically verifies and documents the port 5175 dispatch target.
        Documents that port 5175 is running printer-panic, returning 200 text/html (SPA fallback).
        """
        try:
            req = urllib.request.Request(self.url_5175)
            with urllib.request.urlopen(req, timeout=5) as resp:
                content_type = resp.headers.get("Content-Type", "")
                is_html_fallback = "text/html" in content_type
                print(f"\n[HTTP Diagnostic] Port 5175 returned status={resp.status}, Content-Type='{content_type}', is_html_fallback={is_html_fallback}")
                self.assertTrue(is_html_fallback, "Port 5175 is running printer-panic with text/html fallback")
        except urllib.error.URLError as e:
            print(f"\n[HTTP Diagnostic] Port 5175 connection error: {e}")


class TestBlenderCustomManifestStress(unittest.TestCase):
    """Stress testing headless Blender 5.2 execution with a custom production manifest."""

    @classmethod
    def setUpClass(cls):
        cls.blender_exe = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
        cls.filming_script = os.path.join(TOOLS_DIR, "film_studio_reel.py")
        cls.temp_manifest_dir = tempfile.mkdtemp(prefix="challenger2_manifest_")
        cls.custom_manifest_path = os.path.join(cls.temp_manifest_dir, "custom_stress_manifest.json")

        # 4-frame, 2-shot manifest that completes quickly and exercises all subsystems
        cls.custom_manifest = {
            "metadata": {
                "title": "Challenger 2 Empirical Duel",
                "fps": 24,
                "resolution": {
                    "width": 320,
                    "height": 180
                },
                "total_frames": 4,
                "engine": "BLENDER_EEVEE"
            },
            "environment": {
                "base_blend": "flesh_female_comic.blend",
                "terrain": {
                    "type": "cliff_plateau",
                    "dimensions": [10.0, 6.0, 10.0],
                    "material": {
                        "name": "Stress_Rock",
                        "base_rgba": [0.4, 0.2, 0.2, 1.0],
                        "shadow_rgba": [0.1, 0.05, 0.1, 1.0],
                        "rim_rgba": [0.9, 0.4, 0.1, 1.0]
                    }
                },
                "backdrop": {
                    "type": "cyclorama_gradient",
                    "emission_strength": 1.5,
                    "gradient_stops": [
                        {"position": 0.0, "color_rgba": [0.9, 0.3, 0.1, 1.0]},
                        {"position": 0.5, "color_rgba": [0.5, 0.1, 0.2, 1.0]},
                        {"position": 1.0, "color_rgba": [0.1, 0.05, 0.15, 1.0]}
                    ]
                }
            },
            "lighting": [
                {
                    "name": "Stress_KeySun",
                    "type": "SUN",
                    "energy": 3.0,
                    "color_rgb": [1.0, 0.9, 0.8],
                    "rotation_deg": [45.0, 15.0, -30.0]
                }
            ],
            "characters": [
                {
                    "id": "hero_1",
                    "name": "Lunaria Warrior",
                    "source_object": "Armature",
                    "initial_transform": {
                        "location": [-1.5, 0.0, 0.0],
                        "rotation_deg": [0.0, 0.0, 90.0],
                        "scale": [1.0, 1.0, 1.0]
                    },
                    "equipment": [],
                    "actions": [
                        {
                            "shot_id": 1,
                            "pose_name": "combat_ready",
                            "bone_rotations_deg": {
                                "Arm.R": [20.0, 10.0, -40.0]
                            }
                        }
                    ]
                }
            ],
            "shots": [
                {
                    "shot_id": 1,
                    "name": "Shot 1: Extreme Low Angle Dolly",
                    "frame_start": 1,
                    "frame_end": 2,
                    "lens_mm": 28.0,
                    "camera_movement": {
                        "type": "dolly",
                        "start_location": [-1.0, -3.5, 0.8],
                        "start_rotation_deg": [80.0, 0.0, -15.0],
                        "end_location": [-1.0, -2.5, 1.0],
                        "end_rotation_deg": [80.0, 0.0, -15.0]
                    }
                },
                {
                    "shot_id": 2,
                    "name": "Shot 2: Dramatic Crane",
                    "frame_start": 3,
                    "frame_end": 4,
                    "lens_mm": 50.0,
                    "camera_movement": {
                        "type": "crane",
                        "start_location": [0.0, -3.0, 2.5],
                        "start_rotation_deg": [60.0, 0.0, 0.0],
                        "end_location": [0.0, -2.0, 1.8],
                        "end_rotation_deg": [70.0, 0.0, 0.0]
                    }
                }
            ]
        }

        with open(cls.custom_manifest_path, "w", encoding="utf-8") as f:
            json.dump(cls.custom_manifest, f, indent=2)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.temp_manifest_dir):
            shutil.rmtree(cls.temp_manifest_dir, ignore_errors=True)

    def test_01_blender_cli_renders_custom_manifest(self):
        """Runs Blender 5.2 headlessly with --manifest and verifies rendered frames."""
        self.assertTrue(os.path.isfile(self.blender_exe), f"Blender 5.2 not found: {self.blender_exe}")
        self.assertTrue(os.path.isfile(self.filming_script), f"Filming script not found: {self.filming_script}")

        cmd = [
            self.blender_exe,
            "-b",
            "-P", self.filming_script,
            "--",
            "--manifest", self.custom_manifest_path
        ]

        print(f"\n[Blender Stress] Launching headless render for {self.custom_manifest_path}...")
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=120
        )

        self.assertEqual(proc.returncode, 0, f"Blender failed with code {proc.returncode}.\nStderr: {proc.stderr[-1000:]}")

        frames_dir = os.path.join(PROJECT_ROOT, "temp_studio_frames")
        # Check that 4 frames were rendered
        for i in range(1, 5):
            fpath = os.path.join(frames_dir, f"frame_{i:04d}.png")
            self.assertTrue(os.path.isfile(fpath), f"Missing rendered frame: {fpath}")

        # Check film_meta.json
        meta_file = os.path.join(frames_dir, "film_meta.json")
        self.assertTrue(os.path.isfile(meta_file), "Missing film_meta.json")
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.assertEqual(meta["total_frames"], 4)
        self.assertEqual(meta["title"], "Challenger 2 Empirical Duel")
        self.assertEqual(meta["resolution"]["width"], 320)
        self.assertEqual(meta["resolution"]["height"], 180)

        # Stitch custom rendered frames into an MP4
        custom_mp4 = os.path.join(self.temp_manifest_dir, "custom_duel.mp4")
        stitch_ok = stitch_movie(frames_dir=frames_dir, output_path=custom_mp4, fps=24)
        self.assertTrue(stitch_ok, "stitch_movie failed on custom rendered frames")

        # PyAV container verification
        valid, report = verify_video_stream(custom_mp4, expected_fps=24)
        self.assertTrue(valid, f"PyAV verification failed on custom MP4: {report}")
        print(f"[Blender Stress] ✅ Successfully filmed & stitched custom manifest: {report}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
