import unittest

from protocol import (
    PROTOCOL_NAME,
    PROTOCOL_VERSION,
    make_payload,
    validate_payload,
)


class ProtocolTests(unittest.TestCase):
    def test_versioned_payload_shape(self):
        payload = make_payload(
            {"tracking": True, "yaw": 0.25},
            {"enabled": True, "level": 0.4, "peak": 0.8},
            {"camera": True, "screen": False},
            sequence=7,
            sent_at_ms=123456,
        )
        valid, reason = validate_payload(payload)
        self.assertTrue(valid, reason)
        self.assertEqual(payload["protocol"], PROTOCOL_NAME)
        self.assertEqual(payload["version"], PROTOCOL_VERSION)
        self.assertEqual(payload["sequence"], 7)
        self.assertEqual(payload["sent_at_ms"], 123456)

    def test_defaults_are_safe(self):
        payload = make_payload({"tracking": False})
        valid, reason = validate_payload(payload)
        self.assertTrue(valid, reason)
        self.assertFalse(payload["audio"]["enabled"])
        self.assertFalse(payload["capture"]["screen"])

    def test_rejects_wrong_version(self):
        payload = make_payload({"tracking": False})
        payload["version"] = 999
        valid, reason = validate_payload(payload)
        self.assertFalse(valid)
        self.assertEqual(reason, "version_mismatch")

    def test_rejects_missing_tracking(self):
        payload = make_payload({"tracking": False})
        payload.pop("tracking")
        valid, reason = validate_payload(payload)
        self.assertFalse(valid)
        self.assertEqual(reason, "tracking_missing")


if __name__ == "__main__":
    unittest.main()
