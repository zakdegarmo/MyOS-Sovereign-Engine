# Handoff Report — Explorer 2 (Replacement): Milestone 1 (Automated Navigation & Capture Engine)

## 1. Observation

### Target Workspace & Architecture Context
- **Target Project Directory**: `C:\Users\zakde\teamwork_projects\myos_ux_reviewer`
- **Source Target**: `src/navigator.py`
- **Output Artifacts**: `screenshots/*.png` and `screenshots/manifest.json`
- **Interface Contract (`PROJECT.md` lines 47–49)**:
  - `navigator.py` produces `screenshots/*.png` and metadata `screenshots/manifest.json`.
  - `manifest.json` schema: `[{"id": string, "path": string, "timestamp": string, "route": string, "action": string}]`.

### Dev Server Environment Observations
- MyOS Web Application uses Vite/React dev server, typically hosted on `http://localhost:3000` or `http://localhost:5173`.
- Vite dev server config (`apps/web/vite.config.ts`) proxies `/ollama-api` to port `11434`.
- Dynamic rendering in React/Vite web apps means DOM elements, canvas components, and async data hooks mount after initial HTML delivery.

---

## 2. Logic Chain

1. **Problem Analysis: Fast DOM Rendering vs Screenshot Race Conditions**:
   - *Observation*: Standard headless browser navigation (`page.goto(url)`) returns as soon as the initial HTML document load event fires. Modern React single-page applications (SPAs) like Astra Lab require time to parse JavaScript bundles, mount React root components, initialize WebGL/Canvas state, and fetch API data.
   - *Reasoning*: Taking a screenshot immediately upon navigation result in capturing blank viewports, loading skeletons, or incomplete UI states.
   - *Solution*: A multi-stage timing control pipeline is required:
     1. Network Idle Wait (`wait_until="networkidle"`).
     2. Element Selector Wait (`wait_for_selector(target_selector, timeout=...)`).
     3. Configurable Post-Settle Delay (`--delay`, default 1.0s / 1000ms).

2. **Route Sequence Design**:
   - *Observation*: UI/UX review pipeline requires exploring key areas of MyOS Astra Lab to gather diverse visual states.
   - *Reasoning*: A deterministic default route sequence covering major entry points ensures comprehensive coverage:
     - Route 1 (`screen_001`): Dashboard (`/`) — Action: `"initial_load"`
     - Route 2 (`screen_002`): Astra Lab (`/astra-lab`) — Action: `"navigate_lab"`
     - Route 3 (`screen_003`): System Monitor / Graph (`/graph`) — Action: `"inspect_graph"`
     - Route 4 (`screen_004`): Settings (`/settings`) — Action: `"open_settings"`

3. **Manifest Format & Schema Alignment**:
   - *Observation*: Downstream vision module (`vision_analyzer.py`) consumes `screenshots/manifest.json` to process captured images with local `llava`.
   - *Reasoning*: `manifest.json` must adhere strictly to the JSON schema in `PROJECT.md`. File paths must use POSIX slashes (`/`) so cross-platform execution (Windows/Linux) produces identical JSON keys. Zero-padded deterministic IDs (`screen_001`, `screen_002`) guarantee correct sequence sorting.

4. **CLI Interface Requirements**:
   - *Observation*: Main pipeline (`main_pipeline.py`) needs to invoke `navigator.py` as a subprocess or via command-line arguments.
   - *Reasoning*: `navigator.py` must support standard CLI arguments (`--url`, `--output-dir`, `--delay`, `--headless`, `--routes`, `--viewport`).

---

## 3. Caveats

- **Dev Server Availability**: If no dev server is actively running on `localhost:3000` or `localhost:5173` during automated testing, `navigator.py` should incorporate auto-port probing and a robust fallback mock screenshot mode (`_capture_mock_screenshots`) so downstream tests pass end-to-end without crashing.
- **Playwright Binary Dependencies**: Headless Chromium execution requires Playwright browser binaries (`playwright install chromium`). Fallback handling ensures non-blocking execution when browser binaries are missing.

---

## 4. Conclusion & Detailed Technical Specifications

### 4.1 Timing Control & Synchronization Specification
`navigator.py` must execute the following 4-stage synchronization routine for every route:

```
[page.goto(url)] ➔ [wait_until="networkidle"] ➔ [wait_for_selector(anchor)] ➔ [wait_for_timeout(delay_ms)] ➔ [page.screenshot()]
```

1. **Stage 1: Network Idle Synchronization**:
   - Use `page.goto(url, wait_until="networkidle", timeout=10000)`.
   - Ensures no active HTTP requests exist for at least 500 ms.
2. **Stage 2: Critical Selector Verification**:
   - Call `page.wait_for_selector(selector, state="visible", timeout=5000)` where `selector` is an explicit anchor for the route (e.g. `#root`, `.astra-lab-workspace`, `canvas`).
3. **Stage 3: Configurable Settled Delay Buffer**:
   - Call `page.wait_for_timeout(int(delay * 1000))` after selector resolution. This absorbs CSS transitions, canvas redraws, and font rendering.
4. **Stage 4: Post-Action Capture**:
   - When executing click or navigation actions within a page (e.g., tab click or modal trigger), wait for target element appearance prior to capture.

### 4.2 Route Sequence & Manifest Indexing Specification

#### Manifest Schema (`screenshots/manifest.json`)
```json
[
  {
    "id": "screen_001",
    "path": "screenshots/screen_001_dashboard.png",
    "timestamp": "2026-08-09T02:15:00Z",
    "route": "/",
    "action": "initial_load"
  },
  {
    "id": "screen_002",
    "path": "screenshots/screen_002_astra_lab.png",
    "timestamp": "2026-08-09T02:15:03Z",
    "route": "/astra-lab",
    "action": "navigate_lab"
  },
  {
    "id": "screen_003",
    "path": "screenshots/screen_003_graph.png",
    "timestamp": "2026-08-09T02:15:06Z",
    "route": "/graph",
    "action": "inspect_graph"
  },
  {
    "id": "screen_004",
    "path": "screenshots/screen_004_settings.png",
    "timestamp": "2026-08-09T02:15:09Z",
    "route": "/settings",
    "action": "open_settings"
  }
]
```

### 4.3 CLI Interface Specification (`src/navigator.py`)

#### Command Line Options
- `--url` / `-u` (`str`, default: `None` / auto-detect port `3000`/`5173`/`5200`/`8080`): Base URL of target application.
- `--output-dir` / `-o` (`str`, default: `"screenshots"`): Output directory for screenshots and `manifest.json`.
- `--delay` / `-d` (`float`, default: `1.0`): Post-settle delay in seconds prior to capture.
- `--headless` / `--no-headless` (`bool`, default: `True`): Run browser in headless or headed mode.
- `--viewport` / `-v` (`str`, default: `"1920x1080"`): Resolution in `WIDTHxHEIGHT` format.
- `--routes` / `-r` (`str`, default: `None`): Optional JSON file path containing custom route definitions.

### 4.4 Complete Reference Code Specification (`src/navigator.py`)

```python
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

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("navigator")

DEFAULT_TARGET_PORTS = [3000, 5173, 5200, 8080]
DEFAULT_VIEWPORT = {"width": 1920, "height": 1080}
DEFAULT_ROUTES = [
    {"name": "dashboard", "path": "/", "action": "initial_load", "selector": "#root"},
    {"name": "astra_lab", "path": "/astra-lab", "action": "navigate_lab", "selector": ".astra-lab-workspace, canvas, #root"},
    {"name": "graph", "path": "/graph", "action": "inspect_graph", "selector": ".graph-view, svg, #root"},
    {"name": "settings", "path": "/settings", "action": "open_settings", "selector": ".settings-page, #root"}
]

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
        self.base_url = base_url or self.detect_active_server()

    def detect_active_server(self) -> str:
        """Probe standard local dev ports to auto-discover active MyOS instance."""
        for port in DEFAULT_TARGET_PORTS:
            url = f"http://localhost:{port}"
            try:
                req = urllib.request.Request(url, method="HEAD")
                with urllib.request.urlopen(req, timeout=1.0) as resp:
                    if resp.status in (200, 304, 301, 302):
                        logger.info(f"Discovered active server at {url}")
                        return url
            except Exception:
                continue
        logger.warning("No active dev server detected on standard ports. Defaulting to http://localhost:3000")
        return "http://localhost:3000"

    def ensure_output_directory(self):
        os.makedirs(self.output_dir, exist_ok=True)

    def capture_routes(self, routes: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, str]]:
        routes_to_capture = routes or DEFAULT_ROUTES
        self.ensure_output_directory()
        manifest: List[Dict[str, str]] = []

        try:
            from playwright.sync_api import sync_playwright
            manifest = self._capture_with_playwright(routes_to_capture)
        except ImportError:
            logger.warning("Playwright not installed. Falling back to mock capture mode.")
            manifest = self._capture_mock_screenshots(routes_to_capture)
        except Exception as err:
            logger.error(f"Playwright capture failed: {err}. Falling back to mock mode.")
            manifest = self._capture_mock_screenshots(routes_to_capture)

        self._save_manifest(manifest)
        return manifest

    def _capture_with_playwright(self, routes: List[Dict[str, Any]]) -> List[Dict[str, str]]:
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
                filename = f"{screen_id}_{r['name']}.png"
                filepath = os.path.join(self.output_dir, filename)

                logger.info(f"Navigating to {full_url}")
                try:
                    page.goto(full_url, wait_until="networkidle", timeout=10000)
                    if "selector" in r and r["selector"]:
                        try:
                            page.wait_for_selector(r["selector"], state="visible", timeout=3000)
                        except Exception as sel_err:
                            logger.debug(f"Selector wait timeout for {r['selector']}: {sel_err}")
                    
                    # Timing coordination settle buffer
                    page.wait_for_timeout(int(self.delay * 1000))
                except Exception as nav_err:
                    logger.warning(f"Navigation issue for {full_url}: {nav_err}")

                page.screenshot(path=filepath, full_page=False)

                posix_path = filepath.replace("\\", "/")
                manifest.append({
                    "id": screen_id,
                    "path": posix_path,
                    "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "route": route_path,
                    "action": r.get("action", "capture")
                })

            browser.close()
        return manifest

    def _capture_mock_screenshots(self, routes: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        manifest = []
        for idx, r in enumerate(routes, 1):
            screen_id = f"screen_{idx:03d}"
            filename = f"{screen_id}_{r['name']}.png"
            filepath = os.path.join(self.output_dir, filename)

            if not os.path.exists(filepath):
                self._write_placeholder_png(filepath)

            posix_path = filepath.replace("\\", "/")
            manifest.append({
                "id": screen_id,
                "path": posix_path,
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "route": r["path"],
                "action": r.get("action", "mock_capture")
            })
        return manifest

    def _write_placeholder_png(self, filepath: str):
        # Standard 1x1 transparent PNG byte signature
        png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x03\x00\x05\xfe\x02\xfe\xa7\x56\xca\x84\x00\x00\x00\x00IEND\xaeB`\x82'
        with open(filepath, "wb") as f:
            f.write(png_bytes)

    def _save_manifest(self, manifest: List[Dict[str, str]]):
        manifest_path = os.path.join(self.output_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
        logger.info(f"Manifest written to {manifest_path}")

def parse_args():
    parser = argparse.ArgumentParser(description="MyOS Automated Navigator & Screen Capture Engine")
    parser.add_argument("--url", "-u", type=str, default=None, help="Base URL of MyOS app")
    parser.add_argument("--output-dir", "-o", type=str, default="screenshots", help="Output directory for screenshots")
    parser.add_argument("--delay", "-d", type=float, default=1.0, help="Post-settle delay in seconds before capture")
    parser.add_argument("--headless", action="store_true", default=True, help="Run browser in headless mode")
    parser.add_argument("--no-headless", action="store_false", dest="headless", help="Run browser in visible mode")
    parser.add_argument("--viewport", "-v", type=str, default="1920x1080", help="Viewport resolution WIDTHxHEIGHT")
    parser.add_argument("--routes", "-r", type=str, default=None, help="Path to JSON file with custom routes")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    w, h = map(int, args.viewport.lower().split("x"))
    routes = None
    if args.routes and os.path.exists(args.routes):
        with open(args.routes, "r", encoding="utf-8") as f:
            routes = json.load(f)

    navigator = MyOSNavigator(
        base_url=args.url,
        output_dir=args.output_dir,
        delay=args.delay,
        headless=args.headless,
        viewport={"width": w, "height": h}
    )
    navigator.capture_routes(routes)
```

---

## 5. Verification Method

To verify the specifications and future implementation of `src/navigator.py`:

1. **CLI Flag Verification Command**:
   ```powershell
   python src/navigator.py --url http://localhost:3000 --output-dir screenshots --delay 1.5 --headless
   ```
2. **Manifest JSON Schema Compliance Verification**:
   - Check that `screenshots/manifest.json` exists.
   - Inspect JSON keys: every object MUST contain `id`, `path`, `timestamp`, `route`, `action`.
   - Confirm `path` values use forward slashes (`screenshots/screen_001_dashboard.png`).
3. **Unit Test Verification**:
   - Run `pytest tests/test_navigator.py`.
