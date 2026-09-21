import unittest

from generate_motion_svg_roster import svg_for


class MotionSvgGeneratorTests(unittest.TestCase):
    def _character(self):
        return {
            "id": "bw_test",
            "display_name": "Test Player",
            "visual": {
                "skin": "#d99a78",
                "hair_color": "#5a3327",
                "uniform_color": "#fff3dc",
                "accent": "#e4572e",
                "eye": "#4a2b24",
                "hair_style": "ponytail",
                "height": 1.0,
                "shoulder_width": 1.0,
                "hip_width": 1.0,
                "bust": 1.0,
            },
        }

    def test_motion_sheet_contains_four_frames(self):
        svg = svg_for(self._character())
        self.assertTrue(svg.startswith('<?xml'))
        self.assertIn("IDLE", svg) is False
        self.assertEqual(svg.count("<g transform="), 4)
        self.assertIn("Test Player", svg)

    def test_output_is_deterministic(self):
        character = self._character()
        self.assertEqual(svg_for(character), svg_for(character))


if __name__ == "__main__":
    unittest.main()
