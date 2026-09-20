import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock, Thread
from typing import Callable


ROOT = Path(__file__).resolve().parent
DASHBOARD = ROOT / "dashboard.html"


class BridgeControl:
    def __init__(
        self,
        host: str,
        port: int,
        status_provider: Callable[[], dict],
        start_recording: Callable[[], dict],
        stop_recording: Callable[[], dict],
    ):
        self.host = host
        self.port = port
        self.status_provider = status_provider
        self.start_recording = start_recording
        self.stop_recording = stop_recording
        self.server = None
        self.thread = None

    def start(self) -> None:
        provider = self

        class Handler(BaseHTTPRequestHandler):
            def _json(self, status: int, payload: dict) -> None:
                raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(raw)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(raw)

            def _text(self, status: int, body: str, content_type: str = "text/html; charset=utf-8") -> None:
                raw = body.encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(raw)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(raw)

            def do_GET(self) -> None:
                if self.path == "/" or self.path.startswith("/?"):
                    try:
                        body = DASHBOARD.read_text(encoding="utf-8")
                    except OSError as exc:
                        self._text(500, f"Dashboard unavailable: {exc}", "text/plain; charset=utf-8")
                        return
                    self._text(200, body)
                    return

                if self.path == "/api/status":
                    self._json(200, provider.status_provider())
                    return

                self._json(404, {"ok": False, "error": "not_found"})

            def do_POST(self) -> None:
                if self.path == "/api/record/start":
                    self._json(200, provider.start_recording())
                    return

                if self.path == "/api/record/stop":
                    self._json(200, provider.stop_recording())
                    return

                self._json(404, {"ok": False, "error": "not_found"})

            def log_message(self, format_string: str, *args) -> None:
                return

        self.server = ThreadingHTTPServer((self.host, self.port), Handler)
        self.thread = Thread(target=self.server.serve_forever, name="baseball-waifus-control", daemon=True)
        self.thread.start()

    def close(self) -> None:
        if self.server is not None:
            self.server.shutdown()
            self.server.server_close()
            self.server = None
