#!/usr/bin/env python3
import tempfile, unittest
from pathlib import Path
from xml.etree import ElementTree
from character_asset_factory import dimensions, manifest, validate, AssetFactoryError, PNG_SIGNATURE

class CharacterAssetFactoryTests(unittest.TestCase):
    def test_manifest_contract(self):
        self.assertEqual(validate(), [])

    def test_canonical_vertical_slice(self):
        entry=next(x for x in manifest()["characters"] if x["character_id"]=="bw001")
        self.assertEqual(entry["display_name"],"Aiko Hanamori")
        self.assertEqual(entry["position"],"3B")
        self.assertEqual(entry["asset_set"]["portrait"]["status"],"VALIDATED")
        self.assertEqual(entry["asset_set"]["battle_action"]["status"],"DRAFT")
        self.assertEqual(entry["asset_set"]["battle_action"]["quality_class"],"PROCESSED_ART")
        self.assertEqual(set(["neutral"]) | set(entry["expression_variants"]),{"neutral","focus","happy","surprised","determined"})

    def test_svg_dimensions(self):
        root=Path(__file__).resolve().parents[1]
        self.assertEqual(dimensions(root/"assets/characters/generated/bw001.svg"),(512,768))
        self.assertEqual(dimensions(root/"assets/production/cards/bw001--normal.svg"),(768,1024))
        self.assertEqual(dimensions(root/"assets/production/sprites/bw001_idle.svg"),(384,512))
        self.assertEqual(dimensions(root/"assets/production/sprites/bw001_action.svg"),(640,640))
        self.assertEqual(dimensions(root/"assets/production/cutins/bw001--power.svg"),(1280,540))
        self.assertEqual(dimensions(root/"assets/production/presentation/bw001--profile.svg"),(1280,720))
        self.assertEqual(dimensions(root/"assets/production/presentation/bw001--victory.svg"),(1024,768))

    def test_bw001_svg_outputs_are_well_formed(self):
        root=Path(__file__).resolve().parents[1]
        entry=next(x for x in manifest()["characters"] if x["character_id"]=="bw001")
        paths=[spec["path"] for spec in entry["asset_set"].values() if spec.get("path") and spec.get("path").endswith(".svg")]
        paths.extend(spec["path"] for spec in entry["expression_variants"].values() if spec.get("path") and spec.get("path").endswith(".svg"))
        for relative in paths:
            parsed=ElementTree.parse(root/relative).getroot()
            self.assertEqual(parsed.tag.rsplit("}",1)[-1],"svg",relative)

    def test_visual_files_are_differentiated(self):
        root=Path(__file__).resolve().parents[1]
        paths=[root/p for p in ("assets/production/cards/bw001--normal.svg","assets/production/sprites/bw001_idle.svg","assets/production/sprites/bw001_action.svg","assets/production/cutins/bw001--power.svg","assets/production/presentation/bw001--profile.svg","assets/production/presentation/bw001--victory.svg")]
        self.assertEqual(len({p.read_text(encoding="utf-8") for p in paths}),len(paths))
        exp=[root/"assets/characters/expressions"/f"bw001_{m}.svg" for m in ("neutral","focus","happy","surprised","determined")]
        self.assertEqual(len({p.read_text(encoding="utf-8") for p in exp}),5)

    def test_invalid_png_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"bad.png"; p.write_bytes(b"not-png")
            with self.assertRaises(AssetFactoryError):
                dimensions(p)

if __name__=="__main__": unittest.main()
