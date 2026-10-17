#!/usr/bin/env python3
"""Serve both independent stages locally from the repository root."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class RehearsalHandler(SimpleHTTPRequestHandler):
    """Keep phones from mixing assets from different prototype revisions."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8684)
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--rover-only', action='store_true', help='Serve only the assembled collaborative and competitive Rover stages')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    if args.rover_only:
        from build_site import build
        root = build(Path(__file__).resolve().parent / 'out' / 'rover-review')
    handler = partial(RehearsalHandler, directory=str(root))
    print(f'http://{args.bind}:{args.port}/paperweights/web/', flush=True)
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        server.serve_forever()
