#!/usr/bin/env python3
"""Serve both independent stages locally from the repository root."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8684)
    parser.add_argument('--bind', default='127.0.0.1')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    print(f'http://{args.bind}:{args.port}/paperweights/web/', flush=True)
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        server.serve_forever()
