#!/usr/bin/env python3
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent))

from art_studio.art_request import (  # noqa: E402
    ArtRequestError,
    TRANSITIONS,
    apply_character_manifest_update,
    build_request,
    deterministic_target_name,
    discover_source,
    load_registry,
    save_registry,
    validate_image_file,
    validate_request,
)


class ArtRequestTests(unittest.TestCase):
    def setUp(self):
        self.temps = []

    def tearDown(self):
        for path in self.temps:
            shutil.rmtree(path, ignore_errors=True)

    def make_root(self):
        root = Path(tempfile.mkdtemp(prefix="bw-t083-"))
        self.temps.append(root)
        for relative in (
            "tools/art_studio/inbox",
            "tools/art_studio/archive",
            "tools/art_studio/fixtures/outputs",
            "assets/characters/approved",
            "assets/stages",
            "assets/production",
            "assets/vfx",
            "data",
        ):
            (root / relative).mkdir(parents=True, exist_ok=True)
        return root

    def make_stage_request(self):
        return build_request(
            request_id="AR-TEST-STAGE-001",
            asset_kind="TEST_STAGE_BACKGROUND_FAR",
            character_id=None,
            subject="fixture-stage",
            what_is_expected="Controlled stage background fixture.",
            camera="WIDE",
            composition="BACKGROUND",
            environment="Test stage.",
            visual_notes="Deterministic fixture.",
            generation_prompt="Controlled local test fixture.",
            negative_prompt="No external dependencies.",
            fmt="svg",
            minimum_width=512,
            minimum_height=256,
        )

    def test_state_machine_is_explicit(self):
        self.assertEqual(TRANSITIONS["REQUESTED"], {"GENERATED", "REJECTED"})
        self.assertEqual(TRANSITIONS["GENERATED"], {"IMPORTED", "REJECTED"})
        self.assertEqual(TRANSITIONS["IMPORTED"], {"VALIDATED", "REJECTED"})
        self.assertEqual(TRANSITIONS["VALIDATED"], {"APPROVED", "REJECTED"})
        self.assertEqual(TRANSITIONS["APPROVED"], set())

    def test_deterministic_naming_and_safe_routing(self):
        name = deterministic_target_name(
            "CHARACTER_BATTLE_ACTION",
            "bw001",
            "Aiko Hanamori",
            "3/4_FRONT",
            "ACTION_POSE",
            "png",
        )
        self.assertEqual(name, "bw001--battle--action--3-4-front.png")
        request = build_request(
            request_id="AR-TEST-AIKO-001",
            asset_kind="CHARACTER_BATTLE_ACTION",
            character_id="bw001",
            subject="Aiko Hanamori",
            what_is_expected="Character action art.",
            camera="3/4_FRONT",
            composition="ACTION_POSE",
            environment="Isolated.",
            visual_notes="Full body.",
            generation_prompt="External generation prompt.",
            negative_prompt="No UI.",
            fmt="png",
            minimum_width=1024,
            minimum_height=1536,
        )
        self.assertEqual(
            request["target_path"],
            "assets/characters/approved/bw001--battle--action--3-4-front.png",
        )
        request["target_path"] = "../escape.png"
        self.assertTrue(any("target_path" in error for error in validate_request(request)))

    def test_character_factory_reuse_and_manifest_handoff(self):
        request = build_request(
            request_id="AR-TEST-AIKO-002",
            asset_kind="CHARACTER_BATTLE_ACTION",
            character_id="bw001",
            subject="Aiko Hanamori",
            what_is_expected="Character action art.",
            camera="3/4_FRONT",
            composition="ACTION_POSE",
            environment="Isolated.",
            visual_notes="Full body.",
            generation_prompt="External generation prompt.",
            negative_prompt="No UI.",
            fmt="png",
            minimum_width=1024,
            minimum_height=1536,
        )
        self.assertEqual(validate_request(request), [])

        temp_manifest_root = Path(tempfile.mkdtemp(prefix="bw-manifest-"))
        self.temps.append(temp_manifest_root)
        original = json.loads((ROOT / "data/character_asset_manifest.json").read_text(encoding="utf-8"))
        manifest_path = temp_manifest_root / "character_asset_manifest.json"
        manifest_path.write_text(json.dumps(original), encoding="utf-8")
        request["source_files"] = [{"archive_path": "tools/art_studio/archive/AR-TEST-AIKO-002/original.png"}]

        apply_character_manifest_update(manifest_path, request)
        result = json.loads(manifest_path.read_text(encoding="utf-8"))
        spec = next(
            x for x in result["characters"] if x["character_id"] == "bw001"
        )["asset_set"]["battle_action"]
        self.assertEqual(spec["path"], request["target_path"])
        self.assertEqual(spec["status"], "VALIDATED")
        self.assertEqual(spec["quality_class"], "REAL_PRODUCTION_ART")
        self.assertEqual(spec["source"], request["source_files"][0]["archive_path"])

    def test_invalid_png_is_rejected(self):
        root = self.make_root()
        request = self.make_stage_request()
        source = root / request["drop_zone"] / "broken.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_bytes(b"not-png")
        request["format"] = "png"
        request["target_name"] = "fixture-stage--background--far--wide.png"
        request["target_path"] = "tools/art_studio/fixtures/outputs/fixture-stage--background--far--wide.png"
        with self.assertRaises(ArtRequestError):
            validate_image_file(request, source)

    def test_format_mismatch_is_rejected(self):
        root = self.make_root()
        request = self.make_stage_request()
        source = root / request["drop_zone"] / "artist-original.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_bytes(b"not-png")
        with self.assertRaises(ArtRequestError):
            validate_image_file(request, source)

    def test_ambiguous_drop_zone_is_rejected(self):
        root = self.make_root()
        request = self.make_stage_request()
        drop = root / request["drop_zone"]
        drop.mkdir(parents=True, exist_ok=True)
        for name in ("a.svg", "b.svg"):
            (drop / name).write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"></svg>',
                encoding="utf-8",
            )
        with self.assertRaises(ArtRequestError):
            discover_source(request, root)

    def test_successful_cli_create_ingest_validate_approve(self):
        root = self.make_root()
        registry_path = root / "tools/art_studio/art_requests.json"
        script = ROOT / "tools/art_studio/art_request.py"
        request_id = "AR-TEST-CLI-001"

        create_args = [
            "create",
            "--request-id", request_id,
            "--asset-kind", "TEST_STAGE_BACKGROUND_FAR",
            "--subject", "fixture-stage",
            "--what-is-expected", "Controlled stage fixture.",
            "--camera", "WIDE",
            "--composition", "BACKGROUND",
            "--environment", "Synthetic.",
            "--visual-notes", "Test-only SVG.",
            "--generation-prompt", "Controlled local fixture.",
            "--negative-prompt", "No external dependency.",
            "--format", "svg",
            "--minimum-width", "512",
            "--minimum-height", "256",
        ]
        created = subprocess.run(
            [sys.executable, str(script), "--root", str(root), "--registry", str(registry_path), *create_args],
            text=True,
            capture_output=True,
            cwd=ROOT,
        )
        self.assertEqual(created.returncode, 0, created.stderr)
        request = json.loads(created.stdout)
        self.assertEqual(request["status"], "REQUESTED")
        self.assertEqual(
            request["target_path"],
            "tools/art_studio/fixtures/outputs/fixture-stage--background--far--wide.svg",
        )

        registry = load_registry(registry_path)
        request = registry["requests"][0]
        drop = root / request["drop_zone"]
        drop.mkdir(parents=True, exist_ok=True)
        (drop / "artist-original.svg").write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">'
            '<rect width="640" height="360" fill="#07101d"/></svg>',
            encoding="utf-8",
        )

        for args in (
            ["generate", request_id],
            ["ingest", request_id],
            ["validate", request_id],
            ["approve", request_id],
        ):
            completed = subprocess.run(
                [sys.executable, str(script), "--root", str(root), "--registry", str(registry_path), *args],
                text=True,
                capture_output=True,
                cwd=ROOT,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)

        final = load_registry(registry_path)["requests"][0]
        self.assertEqual(final["status"], "APPROVED")
        self.assertTrue((root / final["target_path"]).is_file())
        self.assertTrue(final["source_files"][0]["archive_path"].startswith("tools/art_studio/archive/"))
        self.assertEqual(final["source_files"][0]["filename"], "artist-original.svg")
        self.assertEqual(len(final["source_files"][0]["sha256"]), 64)

    def test_aiko_sample_is_not_falsely_approved(self):
        registry = load_registry(ROOT / "tools/art_studio/art_requests.json")
        request = next(item for item in registry["requests"] if item["request_id"] == "AR-T083-AIKO-BW001-01")
        self.assertEqual(request["status"], "REQUESTED")
        self.assertEqual(request["character_id"], "bw001")
        self.assertFalse(request["source_files"])

    def test_unsafe_absolute_path_is_rejected(self):
        request = self.make_stage_request()
        request["target_path"] = "/absolute/escape.svg"
        self.assertTrue(any("target_path" in error for error in validate_request(request)))


if __name__ == "__main__":
    unittest.main()
