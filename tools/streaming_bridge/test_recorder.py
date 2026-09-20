import json
import tempfile
import unittest
from pathlib import Path

from recorder import TrackingRecorder, read_recording


class RecorderTests(unittest.TestCase):
    def test_round_trip_jsonl(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "session.jsonl"
            payloads = [
                {"protocol": "baseball-waifus-tracking", "version": 1, "sequence": 0},
                {"protocol": "baseball-waifus-tracking", "version": 1, "sequence": 1},
            ]

            recorder = TrackingRecorder(str(path))
            recorder.write(payloads[0])
            recorder.write(payloads[1])
            recorder.close()

            loaded = list(read_recording(str(path)))
            self.assertEqual(loaded, payloads)

    def test_invalid_json_is_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "broken.jsonl"
            path.write_text("{broken}\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                list(read_recording(str(path)))


if __name__ == "__main__":
    unittest.main()
