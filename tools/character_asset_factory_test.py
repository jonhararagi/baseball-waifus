#!/usr/bin/env python3
import tempfile, unittest
from pathlib import Path
from character_asset_factory import dimensions, manifest, validate, AssetFactoryError, PNG_SIGNATURE

class CharacterAssetFactoryTests(unittest.TestCase):
    def test_manifest_contract(self):
        self.assertEqual(validate(), [])

    def test_canonical_vertical_slice(self):
        entry=next(x for x in manifest()["characters"] if x["character_id"]=="bw001")
        self.assertEqual(entry["display_name"],"Aiko Hanamori")
        self.assertEqual(entry["position"],"3B")
        self.assertEqual(entry["asset_set"]["portrait"]["status"],"VALIDATED")
        self.assertEqual(entry["asset_set"]["battle_action"]["status"],"MISSING")

    def test_svg_dimensions(self):
        root=Path(__file__).resolve().parents[1]
        self.assertEqual(dimensions(root/"assets/characters/generated/bw001.svg"),(512,768))
        self.assertEqual(dimensions(root/"assets/production/cards/bw001--normal.svg"),(768,1024))
        self.assertEqual(dimensions(root/"assets/production/sprites/bw001_idle.svg"),(256,384))

    def test_invalid_png_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"bad.png"; p.write_bytes(b"not-png")
            with self.assertRaises(AssetFactoryError):
                dimensions(p)

if __name__=="__main__": unittest.main()
