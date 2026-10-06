"""Moon Run server: static files plus a tiny shared store for the event (rules, models, replays).
python3 serve.py [--port 8676] -> http://<host>:8676/web/  (binds 0.0.0.0 for LAN/Tailscale)
  GET  /api/state                 everything: {rules: [...], models: {...}, runs: [...]}
  POST /api/rule   {team, who, rule, score, verdict}       a participant publishes a graduated rule
  POST /api/model  {team, rules: [...]}                     a representative locks a model
  POST /api/run    {team, kind, log, score, ...}            a finished model run (archive / sealed / sudden)
  POST /api/reset                                          clear the store (facilitator)
State lives in out/state.json (gitignored)."""
import argparse, functools, http.server, json, threading, time
from pathlib import Path
HERE = Path(__file__).parent; STORE = HERE / 'out' / 'state.json'; LOCK = threading.Lock()
EMPTY = lambda: {'rules': [], 'models': {}, 'runs': []}
def load():
    try: return json.loads(STORE.read_text())
    except Exception: return EMPTY()
def save(s): STORE.parent.mkdir(exist_ok=True); STORE.write_text(json.dumps(s, indent=1))

class H(http.server.SimpleHTTPRequestHandler):
    def reply(self, obj, code=200):
        body = json.dumps(obj).encode(); self.send_response(code)
        self.send_header('Content-Type', 'application/json'); self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        if self.path.startswith('/api/state'):
            with LOCK: return self.reply(load())
        return super().do_GET()
    def do_POST(self):
        try: data = json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
        except Exception: return self.reply({'error': 'bad json'}, 400)
        with LOCK:
            s = load(); data['at'] = time.time()
            if self.path == '/api/rule': s['rules'].append(data)
            elif self.path == '/api/model': s['models'][str(data.get('team', '?'))] = data
            elif self.path == '/api/run': s['runs'].append(data)
            elif self.path == '/api/reset': s = EMPTY()
            else: return self.reply({'error': 'unknown'}, 404)
            save(s); return self.reply({'ok': True, 'counts': {k: len(v) for k, v in s.items()}})
    def end_headers(self):
        if self.path.endswith(('.js', '.json', '.html', '.css')): self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, *a): pass

p = argparse.ArgumentParser(); p.add_argument('--port', type=int, default=8676); a = p.parse_args()
http.server.ThreadingHTTPServer(('0.0.0.0', a.port), functools.partial(H, directory=str(HERE))).serve_forever()
