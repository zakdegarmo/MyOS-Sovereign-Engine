#!/usr/bin/env python3
"""
Standalone Bering Sea Shader Lab Server (Port 5175)
Serves the isolated 2.5D Parallax Shader Lab without touching port 5173.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import sys

HTML_PATH = Path(__file__).resolve().parent / "bering_sea_standalone.html"

class StandaloneHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            with open(HTML_PATH, "rb") as f:
                self.wfile.write(f.read())
            return
        return super().do_GET()

def main():
    port = 5175
    server = HTTPServer(("0.0.0.0", port), StandaloneHandler)
    print(f"==> Standalone Bering Sea Shader Lab LIVE on http://localhost:{port} <==")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Server stopped.")

if __name__ == "__main__":
    main()
