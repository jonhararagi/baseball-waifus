import json
import socket
import tempfile
import unittest
from pathlib import Path

from protocol import PROTOCOL_NAME, PROTOCOL_VERSION, make_payload, validate_payload
from recorder import TrackingRecorder, read_recording
from replay import send_recording


class StreamingPipelineIntegrationTests(unittest.TestCase):
    def test_protocol_recorder_replay_udp_pipeline(self):
        payloads = [
            make_payload(
                {"tracking": True, "yaw": -0.2, "pitch": 0.1, "roll": 0.0},
                {"enabled": False, "level": 0.0, "peak": 0.0},
                {"camera": True, "screen": False},
                sequence=index,
                sent_at_ms=0,
            )
            for index in range(3)
        ]

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pipeline.jsonl"
            recorder = TrackingRecorder(str(path))
            for payload in payloads:
                recorder.write(payload)
            recorder.close()

            loaded = list(read_recording(str(path)))
            self.assertEqual(loaded, payloads)

            listener = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            listener.bind(("127.0.0.1", 0))
            listener.settimeout(2.0)
            address = listener.getsockname()

            try:
                sent = send_recording(str(path), address, speed=1000.0)
                self.assertEqual(sent, 3)

                received = []
                for _ in range(3):
                    raw, _ = listener.recvfrom(65535)
                    received.append(json.loads(raw.decode("utf-8")))

                self.assertEqual(
                    [payload["sequence"] for payload in received],
                    [0, 1, 2],
                )
                for payload in received:
                    valid, reason = validate_payload(payload)
                    self.assertTrue(valid, reason)
                    self.assertEqual(payload["protocol"], PROTOCOL_NAME)
                    self.assertEqual(payload["version"], PROTOCOL_VERSION)
            finally:
                listener.close()

    def test_replay_rejects_invalid_recording(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "invalid.jsonl"
            path.write_text(
                json.dumps({
                    "protocol": PROTOCOL_NAME,
                    "version": 999,
                    "sequence": 0,
                    "tracking": {},
                }) + "\n",
                encoding="utf-8",
            )

            listener = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            listener.bind(("127.0.0.1", 0))
            listener.settimeout(0.2)
            address = listener.getsockname()

            try:
                with self.assertRaises(ValueError):
                    send_recording(str(path), address, speed=1000.0)
            finally:
                listener.close()


if __name__ == "__main__":
    unittest.main()
