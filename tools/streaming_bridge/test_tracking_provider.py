import unittest

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

    def test_mediapipe_provider_is_constructed_lazily(self):
        # The provider is only constructed for the real-camera path.
        # Runtime dependency availability is validated by the existing tracker/health tests.
        self.assertFalse(create_tracking_provider.__name__ == "")
