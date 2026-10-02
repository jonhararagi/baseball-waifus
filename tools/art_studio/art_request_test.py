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
    deterministic_runtime_slot,
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

    def test_stage_background_far_runtime_slot_contract(self):
        request = build_request(
            request_id="AR-TEST-STAGE-FAR-001",
            asset_kind="STAGE_BACKGROUND_FAR",
            character_id=None,
            subject="combat-stage",
            what_is_expected="Production-ready far background plate for the CombatStage.",
            camera="WIDE",
            composition="BACKGROUND",
            environment="Deep cyberpunk sports-tech combat arena.",
            visual_notes="Large silhouettes, atmospheric depth, clear negative space, no characters.",
            generation_prompt="Wide anime 2.5D cyberpunk sports-tech combat arena background plate, deep atmospheric layers, distant stadium-scale architecture, readable silhouettes, cinematic negative space for 4v4 character combat, cool cyan and magenta energy accents, designed as a far background layer with subtle parallax, no characters.",
            negative_prompt="No characters, no UI, no text overlays, no watermark, no logos, no camera frame, no giant foreground props, no baseball diamond, no bases, no pitcher mound, no batter box, no runners, no third-party likeness, no game screenshot recreation.",
            fmt="png",
            minimum_width=2048,
            minimum_height=1152,
        )
        self.assertEqual(request["runtime_slot"], "stage.background.far")
        self.assertEqual(deterministic_runtime_slot("STAGE_BACKGROUND_FAR"), "stage.background.far")
        self.assertEqual(request["target_name"], "combat-stage--background--far--wide.png")
        self.assertEqual(
            request["target_path"],
            "assets/stages/combat-stage--background--far--wide.png",
        )
        self.assertEqual(validate_request(request), [])

        wrong_slot = dict(request)
        wrong_slot["runtime_slot"] = "stage.foreground"
        self.assertTrue(any("runtime_slot mismatch" in error for error in validate_request(wrong_slot)))

        wrong_kind_slot = dict(request)
        wrong_kind_slot["target_path"] = "assets/stages/combat-stage--background--mid--wide.png"
        self.assertTrue(any("target_path mismatch" in error for error in validate_request(wrong_kind_slot)))

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

    def test_stage_background_far_fixture_intake_uses_production_semantics(self):
        root = self.make_root()
        registry_path = root / "tools/art_studio/art_requests.json"
        request = build_request(
            request_id="AR-TEST-STAGE-FAR-INTAKE-001",
            asset_kind="STAGE_BACKGROUND_FAR",
            character_id=None,
            subject="combat-stage",
            what_is_expected="Controlled far background fixture using production stage semantics.",
            camera="WIDE",
            composition="BACKGROUND",
            environment="Synthetic CombatStage background.",
            visual_notes="Test-only source; no production approval.",
            generation_prompt="Controlled local stage background fixture.",
            negative_prompt="No external dependencies.",
            fmt="svg",
            minimum_width=512,
            minimum_height=256,
        )
        self.assertEqual(request["runtime_slot"], "stage.background.far")
        self.assertEqual(
            request["target_path"],
            "assets/stages/combat-stage--background--far--wide.svg",
        )
        registry = {"schema_version": 1, "registry_id": "test", "requests": [request]}
        save_registry(registry_path, registry)

        drop = root / request["drop_zone"]
        drop.mkdir(parents=True, exist_ok=True)
        source = ROOT / "tools/art_studio/inbox/AR-T083-FIXTURE-001/fixture-stage.svg"
        (drop / "artist-original.svg").write_text(
            source.read_text(encoding="utf-8"),
            encoding="utf-8",
        )

        script = ROOT / "tools/art_studio/art_request.py"
        for args in (
            ["generate", request["request_id"]],
            ["ingest", request["request_id"]],
            ["validate", request["request_id"]],
        ):
            completed = subprocess.run(
                [sys.executable, str(script), "--root", str(root), "--registry", str(registry_path), *args],
                text=True,
                capture_output=True,
                cwd=ROOT,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)

        final = load_registry(registry_path)["requests"][0]
        self.assertEqual(final["status"], "VALIDATED")
        self.assertEqual(final["runtime_slot"], "stage.background.far")
        self.assertEqual(final["output"]["path"], request["target_path"])
        self.assertEqual(final["source_files"][0]["filename"], "artist-original.svg")
        self.assertEqual(len(final["source_files"][0]["sha256"]), 64)
        self.assertTrue((root / request["target_path"]).is_file())
        self.assertFalse((ROOT / request["target_path"]).exists())

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

    def test_stage_background_far_rejects_wrong_runtime_slot(self):
        request = self.make_stage_request()
        request["asset_kind"] = "STAGE_BACKGROUND_FAR"
        request["subject"] = "combat-stage"
        request["camera"] = "WIDE"
        request["composition"] = "BACKGROUND"
        request["format"] = "png"
        request["minimum_width"] = 2048
        request["minimum_height"] = 1152
        request["runtime_slot"] = "stage.foreground"
        request["target_name"] = "combat-stage--background--far--wide.png"
        request["target_path"] = "assets/stages/combat-stage--background--far--wide.png"
        self.assertTrue(any("runtime_slot mismatch" in error for error in validate_request(request)))

        request["runtime_slot"] = "stage.background.far"
        self.assertEqual(validate_request(request), [])

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

    def test_successful_stage_background_far_intake_reaches_validated(self):
        root = self.make_root()
        registry_path = root / "tools/art_studio/art_requests.json"
        request = build_request(
            request_id="AR-TEST-STAGE-FAR-INTAKE-001",
            asset_kind="STAGE_BACKGROUND_FAR",
            character_id=None,
            subject="combat-stage",
            what_is_expected="Controlled far background intake fixture.",
            camera="WIDE",
            composition="BACKGROUND",
            environment="Synthetic.",
            visual_notes="Test-only far background source.",
            generation_prompt="Controlled local fixture.",
            negative_prompt="No external dependencies.",
            fmt="svg",
            minimum_width=512,
            minimum_height=256,
        )
        save_registry(registry_path, {"schema_version": 1, "registry_id": "test", "requests": [request]})
        drop = root / request["drop_zone"]
        drop.mkdir(parents=True, exist_ok=True)
        (drop / "artist-original.svg").write_text(
            (ROOT / "tools/art_studio/inbox/AR-T083-FIXTURE-001/fixture-stage.svg").read_text(encoding="utf-8"),
            encoding="utf-8",
        )
        script = ROOT / "tools/art_studio/art_request.py"

        for args in (
            ["generate", request["request_id"]],
            ["ingest", request["request_id"]],
            ["validate", request["request_id"]],
        ):
            completed = subprocess.run(
                [sys.executable, str(script), "--root", str(root), "--registry", str(registry_path), *args],
                text=True,
                capture_output=True,
                cwd=ROOT,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)

        final = load_registry(registry_path)["requests"][0]
        self.assertEqual(final["status"], "VALIDATED")
        self.assertEqual(final["runtime_slot"], "stage.background.far")
        self.assertEqual(
            final["output"]["path"],
            request["target_path"],
        )
        self.assertTrue((root / final["output"]["path"]).is_file())
        self.assertEqual(final["source_files"][0]["filename"], "artist-original.svg")
        self.assertEqual(final["source_files"][0]["format"], "svg")
        self.assertEqual(len(final["source_files"][0]["sha256"]), 64)

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


    def test_t085_midground_production_request_and_fixture_intake(self):
        registry = load_registry(ROOT / "tools/art_studio/art_requests.json")
        mid = next(item for item in registry["requests"] if item["request_id"] == "AR-T085-STAGE-BG-MID-01")

        self.assertEqual(mid["status"], "REQUESTED")
        self.assertEqual(mid["asset_kind"], "STAGE_BACKGROUND_MID")
        self.assertEqual(mid["runtime_slot"], "stage.background.mid")
        self.assertEqual(mid["camera"], "WIDE")
        self.assertEqual(mid["composition"], "MIDGROUND")
        self.assertEqual(mid["format"], "png")
        self.assertEqual(mid["minimum_width"], 2048)
        self.assertEqual(mid["minimum_height"], 1152)
        self.assertEqual(
            mid["target_name"],
            "combat-stage--background--mid--wide.png",
        )
        self.assertEqual(
            mid["target_path"],
            "assets/stages/combat-stage--background--mid--wide.png",
        )
        self.assertEqual(
            mid["drop_zone"],
            "tools/art_studio/inbox/AR-T085-STAGE-BG-MID-01",
        )
        self.assertEqual(validate_request(mid), [])
        self.assertFalse(mid["source_files"])
        self.assertIsNone(mid["output"])
        self.assertFalse((ROOT / mid["target_path"]).exists())

        far = next(item for item in registry["requests"] if item["request_id"] == "AR-T084-STAGE-BG-FAR-01")
        self.assertEqual(far["runtime_slot"], "stage.background.far")
        self.assertEqual(far["target_name"], "combat-stage--background--far--wide.png")
        self.assertNotEqual(mid["request_id"], far["request_id"])
        self.assertNotEqual(mid["runtime_slot"], far["runtime_slot"])
        self.assertNotEqual(mid["target_name"], far["target_name"])
        self.assertFalse((ROOT / far["target_path"]).exists())

        wrong_slot = dict(mid)
        wrong_slot["runtime_slot"] = "stage.background.far"
        self.assertTrue(any("runtime_slot mismatch" in error for error in validate_request(wrong_slot)))

        wrong_target = dict(mid)
        wrong_target["target_path"] = "assets/stages/combat-stage--background--far--wide.png"
        self.assertTrue(any("target_path mismatch" in error for error in validate_request(wrong_target)))

        unsafe_target = dict(mid)
        unsafe_target["target_path"] = "../escape.png"
        self.assertTrue(any("target_path" in error for error in validate_request(unsafe_target)))

        wrong_format = dict(mid)
        wrong_format["format"] = "svg"
        self.assertTrue(any("target_name mismatch" in error for error in validate_request(wrong_format)))

        root = self.make_root()
        undersized_source = root / mid["drop_zone"] / "undersized.svg"
        undersized_source.parent.mkdir(parents=True, exist_ok=True)
        undersized_source.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576"></svg>',
            encoding="utf-8",
        )
        with self.assertRaises(ArtRequestError):
            validate_image_file(mid, undersized_source)

        registry_path = root / "tools/art_studio/art_requests.json"
        fixture_request = build_request(
            request_id="AR-TEST-STAGE-MID-INTAKE-001",
            asset_kind="STAGE_BACKGROUND_MID",
            character_id=None,
            subject="combat-stage",
            what_is_expected="Controlled midground fixture using production stage semantics.",
            camera="WIDE",
            composition="BACKGROUND",
            environment="Synthetic CombatStage midground.",
            visual_notes="Test-only source; no production approval.",
            generation_prompt="Controlled local midground fixture.",
            negative_prompt="No external dependencies.",
            fmt="svg",
            minimum_width=512,
            minimum_height=256,
        )
        self.assertEqual(fixture_request["runtime_slot"], "stage.background.mid")
        self.assertEqual(
            fixture_request["target_name"],
            "combat-stage--background--mid--wide.svg",
        )
        self.assertEqual(
            fixture_request["target_path"],
            "assets/stages/combat-stage--background--mid--wide.svg",
        )
        save_registry(
            registry_path,
            {"schema_version": 1, "registry_id": "test", "requests": [fixture_request]},
        )

        drop = root / fixture_request["drop_zone"]
        drop.mkdir(parents=True, exist_ok=True)
        source = ROOT / "tools/art_studio/inbox/AR-T083-FIXTURE-001/fixture-stage.svg"
        (drop / "artist-original.svg").write_text(
            source.read_text(encoding="utf-8"),
            encoding="utf-8",
        )

        script = ROOT / "tools/art_studio/art_request.py"
        for args in (
            ["generate", fixture_request["request_id"]],
            ["ingest", fixture_request["request_id"]],
            ["validate", fixture_request["request_id"]],
        ):
            completed = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    "--root",
                    str(root),
                    "--registry",
                    str(registry_path),
                    *args,
                ],
                text=True,
                capture_output=True,
                cwd=ROOT,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)

        final = load_registry(registry_path)["requests"][0]
        self.assertEqual(final["status"], "VALIDATED")
        self.assertEqual(final["runtime_slot"], "stage.background.mid")
        self.assertEqual(
            final["output"]["path"],
            "assets/stages/combat-stage--background--mid--wide.svg",
        )
        self.assertTrue(
            (root / "assets/stages/combat-stage--background--mid--wide.svg").is_file()
        )
        self.assertEqual(final["source_files"][0]["filename"], "artist-original.svg")
        self.assertEqual(final["source_files"][0]["format"], "svg")
        self.assertEqual(len(final["source_files"][0]["sha256"]), 64)
        self.assertFalse((ROOT / mid["target_path"]).exists())


    def test_t086_ground_production_request_and_fixture_intake(self):
        registry = load_registry(ROOT / "tools/art_studio/art_requests.json")
        ground = next(item for item in registry["requests"] if item["request_id"] == "AR-T086-STAGE-GROUND-01")

        self.assertEqual(ground["status"], "REQUESTED")
        self.assertEqual(ground["asset_kind"], "STAGE_GROUND")
        self.assertEqual(ground["runtime_slot"], "stage.ground")
        self.assertEqual(ground["camera"], "WIDE")
        self.assertEqual(ground["composition"], "GROUND")
        self.assertEqual(ground["format"], "png")
        self.assertEqual(ground["minimum_width"], 2048)
        self.assertEqual(ground["minimum_height"], 1152)
        self.assertEqual(ground["target_name"], "combat-stage--ground--wide.png")
        self.assertEqual(ground["target_path"], "assets/stages/combat-stage--ground--wide.png")
        self.assertEqual(ground["drop_zone"], "tools/art_studio/inbox/AR-T086-STAGE-GROUND-01")
        self.assertEqual(validate_request(ground), [])
        self.assertFalse(ground["source_files"])
        self.assertIsNone(ground["output"])
        self.assertFalse((ROOT / ground["target_path"]).exists())

        far = next(item for item in registry["requests"] if item["request_id"] == "AR-T084-STAGE-BG-FAR-01")
        mid = next(item for item in registry["requests"] if item["request_id"] == "AR-T085-STAGE-BG-MID-01")
        self.assertEqual(far["runtime_slot"], "stage.background.far")
        self.assertEqual(mid["runtime_slot"], "stage.background.mid")
        self.assertNotEqual(ground["runtime_slot"], far["runtime_slot"])
        self.assertNotEqual(ground["runtime_slot"], mid["runtime_slot"])

        wrong_slot = dict(ground)
        wrong_slot["runtime_slot"] = "stage.background.mid"
        self.assertTrue(any("runtime_slot mismatch" in error for error in validate_request(wrong_slot)))

        wrong_target = dict(ground)
        wrong_target["target_path"] = "assets/stages/combat-stage--background--mid--wide.png"
        self.assertTrue(any("target_path mismatch" in error for error in validate_request(wrong_target)))

        unsafe_target = dict(ground)
        unsafe_target["target_path"] = "../escape.png"
        self.assertTrue(any("target_path" in error for error in validate_request(unsafe_target)))

        wrong_format = dict(ground)
        wrong_format["format"] = "svg"
        self.assertTrue(any("target_name mismatch" in error for error in validate_request(wrong_format)))

        root = self.make_root()
        undersized_source = root / ground["drop_zone"] / "undersized.svg"
        undersized_source.parent.mkdir(parents=True, exist_ok=True)
        undersized_source.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576"></svg>',
            encoding="utf-8",
        )
        with self.assertRaises(ArtRequestError):
            validate_image_file(ground, undersized_source)

        registry_path = root / "tools/art_studio/art_requests.json"
        fixture_request = build_request(
            request_id="AR-TEST-STAGE-GROUND-INTAKE-001",
            asset_kind="STAGE_GROUND",
            character_id=None,
            subject="combat-stage",
            what_is_expected="Controlled ground fixture using production stage semantics.",
            camera="WIDE",
            composition="GROUND",
            environment="Synthetic CombatStage ground surface.",
            visual_notes="Test-only source; no production approval.",
            generation_prompt="Controlled local ground fixture.",
            negative_prompt="No external dependencies.",
            fmt="svg",
            minimum_width=512,
            minimum_height=256,
        )
        self.assertEqual(fixture_request["runtime_slot"], "stage.ground")
        self.assertEqual(fixture_request["target_name"], "combat-stage--ground--wide.svg")
        self.assertEqual(fixture_request["target_path"], "assets/stages/combat-stage--ground--wide.svg")
        save_registry(
            registry_path,
            {"schema_version": 1, "registry_id": "test", "requests": [fixture_request]},
        )

        drop = root / fixture_request["drop_zone"]
        drop.mkdir(parents=True, exist_ok=True)
        source = ROOT / "tools/art_studio/inbox/AR-T083-FIXTURE-001/fixture-stage.svg"
        (drop / "artist-original.svg").write_text(
            source.read_text(encoding="utf-8"),
            encoding="utf-8",
        )

        script = ROOT / "tools/art_studio/art_request.py"
        for args in (
            ["generate", fixture_request["request_id"]],
            ["ingest", fixture_request["request_id"]],
            ["validate", fixture_request["request_id"]],
        ):
            completed = subprocess.run(
                [sys.executable, str(script), "--root", str(root), "--registry", str(registry_path), *args],
                text=True,
                capture_output=True,
                cwd=ROOT,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)

        final = load_registry(registry_path)["requests"][0]
        self.assertEqual(final["status"], "VALIDATED")
        self.assertEqual(final["runtime_slot"], "stage.ground")
        self.assertEqual(final["output"]["path"], "assets/stages/combat-stage--ground--wide.svg")
        self.assertTrue((root / "assets/stages/combat-stage--ground--wide.svg").is_file())
        self.assertEqual(final["source_files"][0]["filename"], "artist-original.svg")
        self.assertEqual(final["source_files"][0]["format"], "svg")
        self.assertEqual(len(final["source_files"][0]["sha256"]), 64)
        self.assertFalse((ROOT / ground["target_path"]).exists())


    def test_t087_foreground_production_request_and_fixture_intake(self):
        registry = load_registry(ROOT / "tools/art_studio/art_requests.json")
        foreground = next(
            item for item in registry["requests"]
            if item["request_id"] == "AR-T087-STAGE-FOREGROUND-01"
        )

        self.assertEqual(foreground["status"], "REQUESTED")
        self.assertEqual(foreground["asset_kind"], "STAGE_FOREGROUND")
        self.assertEqual(foreground["runtime_slot"], "stage.foreground")
        self.assertEqual(deterministic_runtime_slot("STAGE_FOREGROUND"), "stage.foreground")
        self.assertEqual(foreground["camera"], "WIDE")
        self.assertEqual(foreground["composition"], "FOREGROUND")
        self.assertEqual(foreground["format"], "png")
        self.assertEqual(foreground["minimum_width"], 2048)
        self.assertEqual(foreground["minimum_height"], 1152)
        self.assertEqual(
            foreground["target_name"],
            "combat-stage--foreground--wide.png",
        )
        self.assertEqual(
            foreground["target_path"],
            "assets/stages/combat-stage--foreground--wide.png",
        )
        self.assertEqual(
            foreground["drop_zone"],
            "tools/art_studio/inbox/AR-T087-STAGE-FOREGROUND-01",
        )
        self.assertEqual(validate_request(foreground), [])
        self.assertIn("near-camera", foreground["what_is_expected"])
        self.assertIn("protected zones", foreground["visual_notes"])
        self.assertIn("projectile path", foreground["visual_notes"])
        self.assertIn("IMPACT", foreground["visual_notes"])
        self.assertIn("no characters", foreground["generation_prompt"].lower())
        negative_prompt = foreground["negative_prompt"].lower()
        for phrase in (
            "No characters",
            "No UI",
            "No text",
            "No logos",
            "No watermark",
            "No screenshot",
            "No photorealism",
            "No semirealistic 3D",
            "No human silhouettes",
            "No mascot silhouettes",
            "No central obstruction",
            "No face-like shapes",
            "No obstruction over playable characters",
            "No obstruction over enemy",
            "No obstruction over bat",
            "No obstruction over projectile path",
            "No obstruction over impact area",
            "No fixed camera crop",
        ):
            self.assertIn(phrase.lower(), negative_prompt)
        self.assertFalse(foreground["source_files"])
        self.assertIsNone(foreground["output"])
        self.assertFalse((ROOT / foreground["target_path"]).exists())

        far = next(item for item in registry["requests"] if item["request_id"] == "AR-T084-STAGE-BG-FAR-01")
        mid = next(item for item in registry["requests"] if item["request_id"] == "AR-T085-STAGE-BG-MID-01")
        ground = next(item for item in registry["requests"] if item["request_id"] == "AR-T086-STAGE-GROUND-01")
        self.assertEqual(far["runtime_slot"], "stage.background.far")
        self.assertEqual(mid["runtime_slot"], "stage.background.mid")
        self.assertEqual(ground["runtime_slot"], "stage.ground")
        self.assertNotEqual(foreground["runtime_slot"], far["runtime_slot"])
        self.assertNotEqual(foreground["runtime_slot"], mid["runtime_slot"])
        self.assertNotEqual(foreground["runtime_slot"], ground["runtime_slot"])
        self.assertNotEqual(foreground["target_name"], far["target_name"])
        self.assertNotEqual(foreground["target_name"], mid["target_name"])
        self.assertNotEqual(foreground["target_name"], ground["target_name"])

        wrong_slot = dict(foreground)
        wrong_slot["runtime_slot"] = "stage.background.mid"
        self.assertTrue(
            any("runtime_slot mismatch" in error for error in validate_request(wrong_slot))
        )

        wrong_target = dict(foreground)
        wrong_target["target_path"] = "assets/stages/combat-stage--background--mid--wide.png"
        self.assertTrue(
            any("target_path mismatch" in error for error in validate_request(wrong_target))
        )

        wrong_filename = dict(foreground)
        wrong_filename["target_name"] = "combat-stage--ground--wide.png"
        self.assertTrue(
            any("target_name mismatch" in error for error in validate_request(wrong_filename))
        )

        unsafe_target = dict(foreground)
        unsafe_target["target_path"] = "../escape.png"
        self.assertTrue(
            any("target_path" in error for error in validate_request(unsafe_target))
        )

        wrong_format_metadata = dict(foreground)
        wrong_format_metadata["format"] = "svg"
        self.assertTrue(
            any("target_name mismatch" in error for error in validate_request(wrong_format_metadata))
        )

        root = self.make_root()
        wrong_format_source = root / foreground["drop_zone"] / "wrong-format.svg"
        wrong_format_source.parent.mkdir(parents=True, exist_ok=True)
        wrong_format_source.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1152"></svg>',
            encoding="utf-8",
        )
        with self.assertRaises(ArtRequestError):
            validate_image_file(foreground, wrong_format_source)

        undersized_source = root / foreground["drop_zone"] / "undersized.svg"
        undersized_source.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576"></svg>',
            encoding="utf-8",
        )
        with self.assertRaises(ArtRequestError):
            validate_image_file(
                {**foreground, "format": "svg"},
                undersized_source,
            )

        ambiguous_drop = root / "tools/art_studio/inbox/AR-T087-AMBIQUOUS-001"
        ambiguous_drop.mkdir(parents=True, exist_ok=True)
        for filename in ("one.svg", "two.svg"):
            (ambiguous_drop / filename).write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256"></svg>',
                encoding="utf-8",
            )
        ambiguous_request = {
            **foreground,
            "request_id": "AR-T087-AMBIQUOUS-001",
            "drop_zone": "tools/art_studio/inbox/AR-T087-AMBIQUOUS-001",
        }
        with self.assertRaises(ArtRequestError):
            discover_source(ambiguous_request, root)

        registry_path = root / "tools/art_studio/art_requests.json"
        fixture_request = build_request(
            request_id="AR-TEST-STAGE-FOREGROUND-INTAKE-001",
            asset_kind="STAGE_FOREGROUND",
            character_id=None,
            subject="combat-stage",
            what_is_expected="Controlled foreground fixture using production stage semantics.",
            camera="WIDE",
            composition="FOREGROUND",
            environment="Synthetic CombatStage near-camera foreground.",
            visual_notes="Test-only source; outer-frame framing only; actors and projectile path protected.",
            generation_prompt="Controlled local foreground fixture.",
            negative_prompt="No external dependencies.",
            fmt="svg",
            minimum_width=512,
            minimum_height=256,
        )
        self.assertEqual(fixture_request["runtime_slot"], "stage.foreground")
        self.assertEqual(
            fixture_request["target_name"],
            "combat-stage--foreground--wide.svg",
        )
        self.assertEqual(
            fixture_request["target_path"],
            "assets/stages/combat-stage--foreground--wide.svg",
        )
        save_registry(
            registry_path,
            {"schema_version": 1, "registry_id": "test", "requests": [fixture_request]},
        )

        drop = root / fixture_request["drop_zone"]
        drop.mkdir(parents=True, exist_ok=True)
        source = ROOT / "tools/art_studio/inbox/AR-T083-FIXTURE-001/fixture-stage.svg"
        (drop / "artist-original.svg").write_text(
            source.read_text(encoding="utf-8"),
            encoding="utf-8",
        )

        script = ROOT / "tools/art_studio/art_request.py"
        for args in (
            ["generate", fixture_request["request_id"]],
            ["ingest", fixture_request["request_id"]],
            ["validate", fixture_request["request_id"]],
        ):
            completed = subprocess.run(
                [sys.executable, str(script), "--root", str(root), "--registry", str(registry_path), *args],
                text=True,
                capture_output=True,
                cwd=ROOT,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)

        final = load_registry(registry_path)["requests"][0]
        self.assertEqual(final["status"], "VALIDATED")
        self.assertEqual(final["runtime_slot"], "stage.foreground")
        self.assertEqual(
            final["output"]["path"],
            "assets/stages/combat-stage--foreground--wide.svg",
        )
        self.assertTrue(
            (root / "assets/stages/combat-stage--foreground--wide.svg").is_file()
        )
        self.assertEqual(final["source_files"][0]["filename"], "artist-original.svg")
        self.assertEqual(final["source_files"][0]["format"], "svg")
        self.assertEqual(len(final["source_files"][0]["sha256"]), 64)
        self.assertFalse((ROOT / foreground["target_path"]).exists())



    def test_t088_combat_stage_request_set_is_coherent(self):
        registry = load_registry(ROOT / "tools/art_studio/art_requests.json")
        request_ids = [
            "AR-T084-STAGE-BG-FAR-01",
            "AR-T085-STAGE-BG-MID-01",
            "AR-T086-STAGE-GROUND-01",
            "AR-T087-STAGE-FOREGROUND-01",
        ]
        requests = [
            next(item for item in registry["requests"] if item["request_id"] == request_id)
            for request_id in request_ids
        ]

        self.assertEqual(
            [request["asset_kind"] for request in requests],
            [
                "STAGE_BACKGROUND_FAR",
                "STAGE_BACKGROUND_MID",
                "STAGE_GROUND",
                "STAGE_FOREGROUND",
            ],
        )
        self.assertEqual(
            [request["runtime_slot"] for request in requests],
            [
                "stage.background.far",
                "stage.background.mid",
                "stage.ground",
                "stage.foreground",
            ],
        )
        self.assertEqual(
            [request["composition"] for request in requests],
            ["BACKGROUND", "MIDGROUND", "GROUND", "FOREGROUND"],
        )
        self.assertTrue(all(request["status"] == "REQUESTED" for request in requests))
        self.assertTrue(all(request["camera"] == "WIDE" for request in requests))
        self.assertTrue(all(request["format"] == "png" for request in requests))
        self.assertTrue(all(request["minimum_width"] == 2048 for request in requests))
        self.assertTrue(all(request["minimum_height"] == 1152 for request in requests))
        self.assertEqual(
            [request["target_name"] for request in requests],
            [
                "combat-stage--background--far--wide.png",
                "combat-stage--background--mid--wide.png",
                "combat-stage--ground--wide.png",
                "combat-stage--foreground--wide.png",
            ],
        )
        self.assertEqual(len({request["target_name"] for request in requests}), 4)
        self.assertEqual(len({request["target_path"] for request in requests}), 4)
        self.assertEqual(len({request["runtime_slot"] for request in requests}), 4)
        self.assertTrue(
            all(request["target_path"].startswith("assets/stages/") for request in requests)
        )

        family_terms = ("anime", "cyberpunk", "sports-tech", "2.5d")
        self.assertTrue(
            all(
                all(term in request["generation_prompt"].lower() for term in family_terms)
                for request in requests
            )
        )

        for request in requests:
            prompt = request["generation_prompt"].lower()
            negative = request["negative_prompt"].lower()
            self.assertIn("basewarriors", prompt)
            self.assertIn("no characters", negative)
            self.assertTrue(
                any(term in negative for term in ("baseball diamond", "pitcher mound", "batter box"))
            )
            self.assertEqual(validate_request(request), [])
            self.assertFalse((ROOT / request["target_path"]).exists())

        far, mid, ground, foreground = requests
        self.assertIn("distant stadium-scale", far["generation_prompt"])
        self.assertIn("secondary environmental structures", mid["generation_prompt"])
        self.assertIn("shared physical combat surface", ground["generation_prompt"])
        self.assertIn("near-camera cinematic framing device", foreground["generation_prompt"])
        self.assertIn("PLAYER_RAMP", ground["visual_notes"])
        self.assertIn("CENTER_PLATFORM", ground["visual_notes"])
        self.assertIn("ENEMY_PLATFORM", ground["visual_notes"])
        self.assertIn("FRONT_STEP", ground["visual_notes"])
        self.assertIn("protected clear space", foreground["generation_prompt"])
        self.assertIn("projectile path", foreground["visual_notes"])
        self.assertIn("impact", foreground["visual_notes"].lower())

        aiko = next(
            item for item in registry["requests"]
            if item["request_id"] == "AR-T083-AIKO-BW001-01"
        )
        self.assertEqual(aiko["status"], "REQUESTED")
        self.assertEqual(aiko["character_id"], "bw001")
        self.assertFalse(aiko["source_files"])

    def test_t084_production_request_is_requested_and_deterministic(self):
        registry = load_registry(ROOT / "tools/art_studio/art_requests.json")
        request = next(item for item in registry["requests"] if item["request_id"] == "AR-T084-STAGE-BG-FAR-01")
        self.assertEqual(request["status"], "REQUESTED")
        self.assertEqual(request["asset_kind"], "STAGE_BACKGROUND_FAR")
        self.assertEqual(request["runtime_slot"], "stage.background.far")
        self.assertEqual(request["camera"], "WIDE")
        self.assertEqual(request["composition"], "BACKGROUND")
        self.assertEqual(request["format"], "png")
        self.assertEqual(request["minimum_width"], 2048)
        self.assertEqual(request["minimum_height"], 1152)
        self.assertEqual(request["target_name"], "combat-stage--background--far--wide.png")
        self.assertEqual(request["target_path"], "assets/stages/combat-stage--background--far--wide.png")
        self.assertEqual(validate_request(request), [])
        self.assertFalse(request["source_files"])
        self.assertIsNone(request["output"])
        self.assertFalse((ROOT / request["target_path"]).exists())

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
