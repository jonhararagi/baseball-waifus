import unittest
from unittest.mock import patch

from tracking_provider import create_tracking_provider


class TrackingProviderTests(unittest.TestCase):
    def test_synthetic_provider(self):
        provider, synthetic = create_tracking_provider(True, 0.0)
        try:
            payload = provider.process()
            self.assertTrue(synthetic)
            self.assertEqual(provider.name, "synthetic")
            self.assertTrue(payload["tracking"])
        finally:
            provider.close()

    def test_mediapipe_provider_creation_is_lazy_to_runtime_path(self):
        fake = object()
        with patch("tracking_provider.MediaPipeTrackingProvider", return_value=fake) as constructor:
            provider, synthetic = create_tracking_provider(False, 0.45)
        self.assertIs(provider, fake)
        self.assertFalse(synthetic)
        constructor.assert_called_once_with(0.45)


if __name__ == "__main__":
    unittest.main()
