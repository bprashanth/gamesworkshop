"""Serve both versions: python3 serve.py [--port 8670] -> /web/ (v1), /v2/. Binds 0.0.0.0 (LAN/Tailscale)."""
import argparse, functools, http.server
from pathlib import Path
p = argparse.ArgumentParser(); p.add_argument('--port', type=int, default=8670); a = p.parse_args()
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(Path(__file__).parent))
http.server.ThreadingHTTPServer(('0.0.0.0', a.port), handler).serve_forever()
