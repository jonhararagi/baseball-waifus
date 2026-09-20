import json
import threading
import unittest
import urllib.request

from control_server import BridgeControl


class ControlServerTests(unittest.TestCase):
    def setUp(self):
        self.lock = threading.Lock()
        self.recording = False
        self.server = BridgeControl(
            "127.0.0.1",
            0,
            lambda: {"ok": True, "recording": self.recording, "tracking_active": False},
            self._start,
            self._stop,
        )
        self.server.start()
        self.port = self.server.server.server_address[1]

    def tearDown(self):
        self.server.close()

    def _start(self):
        with self.lock:
            self.recording = True
        return {"ok": True, "recording": True}

    def _stop(self):
        with self.lock:
            self.recording = False
        return {"ok": True, "recording": False}

    def _get(self, path):
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}{path}", timeout=2) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def _post(self, path):
        request = urllib.request.Request(
            f"http://127.0.0.1:{self.port}{path}",
            method="POST",
            headers={"Content-Type": "application/json"},
            data=b"{}",
        )
        with urllib.request.urlopen(request, timeout=2) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def test_status(self):
        status, payload = self._get("/api/status")
        self.assertEqual(status, 200)
        self.assertTrue(payload["ok"])

    def test_record_controls(self):
        _, started = self._post("/api/record/start")
        self.assertTrue(started["recording"])
        _, stopped = self._post("/api/record/stop")
        self.assertFalse(stopped["recording"])


if __name__ == "__main__":
    unittest.main()
