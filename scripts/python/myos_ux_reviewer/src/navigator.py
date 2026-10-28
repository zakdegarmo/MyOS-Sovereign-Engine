"""
Navigator Module - Automated Navigation & Capture Engine (Milestone 1)
Navigates the MyOS Astra Lab dev environment and produces screenshot artifacts with metadata.
"""

import os
import sys
import json
import time
import logging
import argparse
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import urllib.request
import urllib.error

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("navigator")

DEFAULT_TARGET_PORTS = [3000, 5173, 5200, 8080]
DEFAULT_VIEWPORT = {"width": 1920, "height": 1080}
DEFAULT_ROUTES = [
    {"name": "Dashboard", "path": "/", "action": "initial_load", "selector": "#root"},
    {"name": "Astra Lab", "path": "/astra-lab", "action": "navigate_lab", "selector": ".astra-lab-workspace, canvas, #root"},
    {"name": "System Monitor", "path": "/graph", "action": "inspect_graph", "selector": ".graph-view, svg, #root"},
    {"name": "Settings", "path": "/settings", "action": "open_settings", "selector": ".settings-page, #root"}
]

# Minimal valid 1x1 transparent PNG fallback bytes if PIL is not present
MINIMAL_PNG_BYTES = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4'
    b'\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x03\x00\x05\xfe\x02\xfe\xa7\x56\xca\x84\x00\x00\x00\x00IEND\xaeB`\x82'
)


class MyOSNavigator:
    def __init__(
        self,
        base_url: Optional[str] = None,
        output_dir: str = "screenshots",
        delay: float = 1.0,
        headless: bool = True,
        viewport: Optional[Dict[str, int]] = None
    ):
        self.output_dir = output_dir
        self.delay = delay
        self.headless = headless
        self.viewport = viewport or DEFAULT_VIEWPORT
        self.server_detected = False
        self.base_url = base_url or self.detect_active_server()

    def detect_active_server(self) -> str:
        """Probe standard ports to discover active MyOS dev server."""
        for port in DEFAULT_TARGET_PORTS:
            url = f"http://localhost:{port}"
            if self.check_server_reachable(url):
                logger.info(f"Discovered active MyOS dev server at {url}")
                self.server_detected = True
                return url
        logger.warning("No active dev server detected on standard ports (3000, 5173, 5200, 8080). Defaulting to http://localhost:3000")
        self.server_detected = False
        return "http://localhost:3000"

    def check_server_reachable(self, url: str, timeout: float = 1.0) -> bool:
        """Helper to test HTTP connection to target URL."""
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status in (200, 304, 301, 302, 404):
                    return True
        except Exception:
            pass
        return False

    def ensure_output_directory(self):
        os.makedirs(self.output_dir, exist_ok=True)

    def capture_routes(self, routes: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Navigates target routes, captures PNG screenshots, and outputs manifest.json.
        Returns list of manifest entries.
        """
        routes_to_capture = routes or DEFAULT_ROUTES
        self.ensure_output_directory()

        # Check if server is reachable before attempting Playwright capture
        server_online = self.check_server_reachable(self.base_url)

        manifest: List[Dict[str, Any]] = []

        if not server_online:
            logger.warning(f"Target server {self.base_url} is unreachable. Falling back to mock capture mode.")
            manifest = self._capture_mock_screenshots(routes_to_capture, status_reason="SERVER_UNREACHABLE")
        else:
            try:
                manifest = self._capture_with_playwright(routes_to_capture)
            except ImportError:
                logger.warning("Playwright package not installed. Falling back to mock capture mode.")
                manifest = self._capture_mock_screenshots(routes_to_capture, status_reason="PLAYWRIGHT_MISSING")
            except Exception as err:
                logger.error(f"Playwright capture error: {err}. Falling back to mock mode.")
                manifest = self._capture_mock_screenshots(routes_to_capture, status_reason=f"PLAYWRIGHT_ERROR: {err}")

        self._save_manifest(manifest)
        return manifest

    def _capture_with_playwright(self, routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        from playwright.sync_api import sync_playwright

        manifest = []
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context(viewport=self.viewport)
            page = context.new_page()

            for idx, r in enumerate(routes, 1):
                route_path = r["path"]
                full_url = f"{self.base_url.rstrip('/')}{route_path}"
                screen_id = f"screen_{idx:03d}"
                raw_name = r.get("name", f"route_{idx}").lower().replace(" ", "_")
                filename = f"{screen_id}_{raw_name}.png"
                filepath = os.path.join(self.output_dir, filename)

                logger.info(f"Navigating to {full_url}")
                action = r.get("action", "capture")
                status = "SUCCESS"
                fallback_used = False

                try:
                    # Multi-stage timing synchronization:
                    # 1. Network idle wait
                    page.goto(full_url, wait_until="networkidle", timeout=10000)

                    # 2. Selector wait buffer (if specified)
                    selector = r.get("selector")
                    if selector:
                        try:
                            page.wait_for_selector(selector, state="visible", timeout=3000)
                        except Exception as sel_err:
                            logger.debug(f"Selector wait timeout for {selector}: {sel_err}")

                    # 3. Settle delay buffer
                    if self.delay > 0:
                        page.wait_for_timeout(int(self.delay * 1000))

                    # 4. Screenshot capture
                    page.screenshot(path=filepath, full_page=False)

                except Exception as nav_err:
                    logger.warning(f"Playwright capture error on {full_url}: {nav_err}. Creating mock fallback image for this route.")
                    self._create_mock_image(filepath, title=f"Route: {r.get('name', route_path)}", subtitle="Fallback Capture")
                    status = "NAVIGATION_ERROR"
                    fallback_used = True

                posix_path = filepath.replace("\\", "/")
                manifest.append({
                    "id": screen_id,
                    "path": posix_path,
                    "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "route": route_path,
                    "action": action,
                    "status": status,
                    "fallback_used": fallback_used
                })

            browser.close()
        return manifest

    def _capture_mock_screenshots(self, routes: List[Dict[str, Any]], status_reason: str = "SYNTHETIC_MOCK") -> List[Dict[str, Any]]:
        manifest = []
        for idx, r in enumerate(routes, 1):
            screen_id = f"screen_{idx:03d}"
            raw_name = r.get("name", f"route_{idx}").lower().replace(" ", "_")
            filename = f"{screen_id}_{raw_name}.png"
            filepath = os.path.join(self.output_dir, filename)

            self._create_mock_image(filepath, title=f"MyOS {r.get('name', 'Route')}", subtitle=f"Route: {r['path']}")

            posix_path = filepath.replace("\\", "/")
            manifest.append({
                "id": screen_id,
                "path": posix_path,
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "route": r["path"],
                "action": r.get("action", "mock_capture"),
                "status": status_reason,
                "fallback_used": True
            })
        return manifest

    def _create_mock_image(self, filepath: str, title: str = "MyOS App", subtitle: str = "Mock Viewport"):
        """Generates a synthetic PNG screenshot using PIL if available, or minimal PNG bytes."""
        try:
            from PIL import Image, ImageDraw
            w = self.viewport.get("width", 1920)
            h = self.viewport.get("height", 1080)

            # Dark theme dashboard palette
            img = Image.new("RGB", (w, h), color=(18, 24, 38))
            draw = ImageDraw.Draw(img)

            # Top Navbar
            draw.rectangle([(0, 0), (w, 60)], fill=(28, 36, 56))
            draw.text((30, 20), f"MyOS Astra Lab | {title}", fill=(220, 225, 235))

            # Main content card / canvas mockup
            draw.rectangle([(50, 90), (w - 50, h - 50)], fill=(34, 44, 66), outline=(60, 75, 105), width=2)
            draw.text((80, 130), title, fill=(255, 255, 255))
            draw.text((80, 170), subtitle, fill=(160, 175, 200))
            draw.text((80, 210), f"Captured at: {datetime.now(timezone.utc).isoformat()}", fill=(120, 135, 160))

            # Mock UI Elements (Status indicators, interactive cards)
            draw.rectangle([(80, 260), (400, 400)], fill=(45, 58, 85), outline=(75, 95, 135))
            draw.text((100, 280), "Component Node A", fill=(200, 220, 255))
            draw.text((100, 320), "Status: ACTIVE", fill=(80, 220, 120))

            draw.rectangle([(430, 260), (750, 400)], fill=(45, 58, 85), outline=(75, 95, 135))
            draw.text((450, 280), "Component Node B", fill=(200, 220, 255))
            draw.text((450, 320), "Latency: 12ms", fill=(80, 220, 120))

            img.save(filepath, "PNG")
        except Exception as e:
            logger.debug(f"PIL mock image creation failed ({e}), writing minimal PNG bytes.")
            with open(filepath, "wb") as f:
                f.write(MINIMAL_PNG_BYTES)

    def _save_manifest(self, manifest: List[Dict[str, Any]]):
        manifest_path = os.path.join(self.output_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
        logger.info(f"Manifest successfully written to {manifest_path} ({len(manifest)} entries)")


def parse_args():
    parser = argparse.ArgumentParser(description="MyOS Automated Navigation & Screenshot Capture Engine")
    parser.add_argument("--url", "-u", type=str, default=None, help="Base URL of MyOS app (auto-detected if omitted)")
    parser.add_argument("--output-dir", "-o", type=str, default="screenshots", help="Output directory for screenshots and manifest.json")
    parser.add_argument("--delay", "-d", type=float, default=1.0, help="Post-settle delay in seconds before screenshot capture")
    parser.add_argument("--headless", action="store_true", default=True, help="Run browser in headless mode (default)")
    parser.add_argument("--no-headless", action="store_false", dest="headless", help="Run browser in visible (headed) mode")
    parser.add_argument("--viewport", "-v", type=str, default="1920x1080", help="Viewport resolution as WIDTHxHEIGHT (e.g. 1920x1080)")
    parser.add_argument("--routes", "-r", type=str, default=None, help="Path to JSON file containing custom route definitions")
    return parser.parse_args()


def main():
    args = parse_args()
    try:
        w, h = map(int, args.viewport.lower().split("x"))
        viewport_dict = {"width": w, "height": h}
    except Exception:
        logger.warning(f"Invalid viewport format '{args.viewport}', using default 1920x1080.")
        viewport_dict = DEFAULT_VIEWPORT

    routes = None
    if args.routes:
        if os.path.exists(args.routes):
            with open(args.routes, "r", encoding="utf-8") as f:
                routes = json.load(f)
        else:
            logger.error(f"Specified routes file not found: {args.routes}")
            sys.exit(1)

    navigator = MyOSNavigator(
        base_url=args.url,
        output_dir=args.output_dir,
        delay=args.delay,
        headless=args.headless,
        viewport=viewport_dict
    )
    navigator.capture_routes(routes)


if __name__ == "__main__":
    main()
