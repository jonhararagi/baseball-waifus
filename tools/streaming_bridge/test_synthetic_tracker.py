import unittest

from synthetic_tracker import SyntheticFaceTracker


class SyntheticTrackerTests(unittest.TestCase):
    def test_generates_valid_tracking_shape(self):
        tracker = SyntheticFaceTracker(0.25)
        payload = tracker.process()
        self.assertTrue(payload["tracking"])
        self.assertTrue(payload["synthetic"])
        for key in ("yaw", "pitch", "roll", "blink", "mouth"):
            self.assertIn(key, payload)
            self.assertGreaterEqual(float(payload[key]), -1.0)
            self.assertLessEqual(float(payload[key]), 1.0)

    def test_sequence_increases(self):
        tracker = SyntheticFaceTracker(0.0)
        first = tracker.process()
        second = tracker.process()
        self.assertEqual(first["frame_index"] + 1, second["frame_index"])


if __name__ == "__main__":
    unittest.main()
