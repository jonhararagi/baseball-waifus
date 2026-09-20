import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from generate_service import ArtGenerationService

ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / 'config.json').read_text(encoding='utf-8'))
SERVICE = ArtGenerationService(ROOT / 'config.json')

class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        raw = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path == '/health':
            self._send_json(200, {'ok': True, 'comfyui': SERVICE.client.health()})
        else:
            self._send_json(404, {'ok': False, 'error': 'not found'})

    def do_POST(self):
        if self.path != '/generate':
            self._send_json(404, {'ok': False, 'error': 'not found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            profile = body.get('profile', {})
            result = SERVICE.generate(profile, body.get('preset'), body.get('seed'))
            self._send_json(200, {'ok': True, 'result': result})
        except Exception as exc:
            self._send_json(500, {'ok': False, 'error': str(exc)})

    def log_message(self, format, *args):
        print('[art-server]', format % args)

def run_server():
    host = CONFIG.get('server_host', '127.0.0.1')
    port = int(CONFIG.get('server_port', 8766))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f'Character AI server -> http://{host}:{port}')
    server.serve_forever()

if __name__ == '__main__':
    run_server()