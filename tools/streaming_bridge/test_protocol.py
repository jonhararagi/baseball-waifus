import json
import unittest

from protocol import PROTOCOL_VERSION, make_payload


class ProtocolTests(unittest.TestCase):
    def test_versioned_payload_shape(self):
        payload = make_payload(
            {"tracking": True, "yaw": 0.25},
            {"enabled": True, "level": 0.4, "peak": 0.8},
            {"camera": True, "screen": False},
        )
        self.assertEqual(payload["protocol"], "baseball-waifus-tracking")
        self.assertEqual(payload["version"], PROTOCOL_VERSION)
        self.assertIn("tracking", payload)
        self.assertIn("audio", payload)
        self.assertIn("capture", payload)

    def test_defaults_are_safe(self):
        payload = make_payload({"tracking": False})
        self.assertEqual(payload["audio"]["enabled"], False)
        self.assertEqual(payload["capture"]["screen"], False)


if __name__ == "__main__":
    unittest.main()
