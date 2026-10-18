"""Serve Servers: python3 servers/serve.py [--port 8672] -> /web/. Binds 0.0.0.0 (LAN/Tailscale)."""
import argparse, functools, http.server
from pathlib import Path
p = argparse.ArgumentParser(); p.add_argument('--port', type=int, default=8672); a = p.parse_args()
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(Path(__file__).parent))
http.server.ThreadingHTTPServer(('0.0.0.0', a.port), handler).serve_forever()
