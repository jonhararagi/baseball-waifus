#!/usr/bin/env python3
"""Deterministic Art Request / AI Asset Intake foundation for BaseWarriors."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree

HERE = Path(__file__).resolve().parent
TOOLS_DIR = HERE.parent
ROOT = TOOLS_DIR.parent
SCHEMA_PATH = HERE / "art_request_schema.json"
REGISTRY_PATH = HERE / "art_requests.json"
INBOX_ROOT = ROOT / "tools" / "art_studio" / "inbox"
ARCHIVE_ROOT = ROOT / "tools" / "art_studio" / "archive"

if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from character_asset_factory import (  # noqa: E402
    AssetFactoryError,
    canonical as factory_canonical,
    dimensions as factory_dimensions,
    manifest as factory_manifest,
)

REQUEST_STATES = (
    "REQUESTED",
    "GENERATED",
    "IMPORTED",
    "VALIDATED",
    "REJECTED",
    "APPROVED",
)

TRANSITIONS = {
    "REQUESTED": {"GENERATED", "REJECTED"},
    "GENERATED": {"IMPORTED", "REJECTED"},
    "IMPORTED": {"VALIDATED", "REJECTED"},
    "VALIDATED": {"APPROVED", "REJECTED"},
    "REJECTED": set(),
    "APPROVED": set(),
}

SUPPORTED_FORMATS = {"png", "jpg", "jpeg", "svg"}
CAMERAS = {
    "FRONT",
    "3/4_FRONT",
    "3/4_BACK",
    "SIDE",
    "LOW_ANGLE",
    "HIGH_ANGLE",
    "WIDE",
    "MEDIUM",
    "CLOSE",
    "TOP",
    "PROFILE",
}
COMPOSITIONS = {
    "FULL_BODY",
    "HALF_BODY",
    "PORTRAIT",
    "ACTION_POSE",
    "BATTLE_ACTION",
    "CUTIN",
    "BACKGROUND",
    "MIDGROUND",
    "GROUND",
    "FOREGROUND",
    "PROP",
    "FX",
}
ASSET_KINDS = {
    "CHARACTER_PORTRAIT",
    "CHARACTER_CARD",
    "CHARACTER_BATTLE_IDLE",
    "CHARACTER_BATTLE_ACTION",
    "CHARACTER_CUTIN",
    "CHARACTER_VICTORY",
    "CHARACTER_DEFEAT",
    "CHARACTER_EVENT",
    "STAGE_BACKGROUND_FAR",
    "STAGE_BACKGROUND_MID",
    "STAGE_GROUND",
    "STAGE_FOREGROUND",
    "STAGE_FX_BACK",
    "STAGE_FX_FRONT",
    "VFX",
    "PROP",
    "TEST_STAGE_BACKGROUND_FAR",
}
CHARACTER_KIND_MAP = {
    "CHARACTER_PORTRAIT": "portrait",
    "CHARACTER_CARD": "card",
    "CHARACTER_BATTLE_IDLE": "battle_idle",
    "CHARACTER_BATTLE_ACTION": "battle_action",
    "CHARACTER_CUTIN": "cutin",
    "CHARACTER_VICTORY": "victory",
    "CHARACTER_DEFEAT": "defeat",
    "CHARACTER_EVENT": "event",
}
GENERIC_TARGET_ROOTS = {
    "STAGE_": Path("assets/stages"),
    "VFX": Path("assets/vfx"),
    "PROP": Path("assets/production"),
    "TEST_": Path("tools/art_studio/fixtures/outputs"),
}
KIND_NAME_TOKENS = {
    "CHARACTER_PORTRAIT": ("portrait",),
    "CHARACTER_CARD": ("card",),
    "CHARACTER_BATTLE_IDLE": ("battle", "idle"),
    "CHARACTER_BATTLE_ACTION": ("battle", "action"),
    "CHARACTER_CUTIN": ("cutin",),
    "CHARACTER_VICTORY": ("victory",),
    "CHARACTER_DEFEAT": ("defeat",),
    "CHARACTER_EVENT": ("event",),
    "STAGE_BACKGROUND_FAR": ("background", "far"),
    "STAGE_BACKGROUND_MID": ("background", "mid"),
    "STAGE_GROUND": ("ground",),
    "STAGE_FOREGROUND": ("foreground",),
    "STAGE_FX_BACK": ("fx", "back"),
    "STAGE_FX_FRONT": ("fx", "front"),
    "VFX": ("vfx",),
    "PROP": ("prop",),
    "TEST_STAGE_BACKGROUND_FAR": ("background", "far"),
}
GENERIC_FORMATS = {
    "STAGE_BACKGROUND_FAR": {"png", "jpg", "jpeg", "svg"},
    "STAGE_BACKGROUND_MID": {"png", "jpg", "jpeg", "svg"},
    "STAGE_GROUND": {"png", "jpg", "jpeg", "svg"},
    "STAGE_FOREGROUND": {"png", "jpg", "jpeg", "svg"},
    "STAGE_FX_BACK": {"png", "jpg", "jpeg", "svg"},
    "STAGE_FX_FRONT": {"png", "jpg", "jpeg", "svg"},
    "VFX": {"png", "jpg", "jpeg", "svg"},
    "PROP": {"png", "jpg", "jpeg", "svg"},
    "TEST_STAGE_BACKGROUND_FAR": {"svg", "png"},
}

class ArtRequestError(RuntimeError):
    pass

def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ArtRequestError(f"invalid JSON: {path}: {exc}") from exc

def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def load_schema(path: Path = SCHEMA_PATH) -> dict:
    schema = load_json(path)
    if schema.get("schema_version") != 1:
        raise ArtRequestError("unsupported art request schema version")
    return schema

def load_registry(path: Path = REGISTRY_PATH) -> dict:
    if not path.is_file():
        return {"schema_version": 1, "registry_id": "basewarriors-art-requests", "requests": []}
    data = load_json(path)
    if data.get("schema_version") != 1:
        raise ArtRequestError("unsupported art request registry version")
    if not isinstance(data.get("requests"), list):
        raise ArtRequestError("registry requests must be a list")
    return data

def save_registry(path: Path, data: dict) -> None:
    save_json(path, data)

def normalize_token(value: object) -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")

def canonical_format(value: object) -> str:
    fmt = str(value or "").strip().lower().lstrip(".")
    if fmt not in SUPPORTED_FORMATS:
        raise ArtRequestError(f"unsupported format: {value!r}")
    return "jpg" if fmt == "jpeg" else fmt

def extension_for_format(fmt: str) -> str:
    return "." + canonical_format(fmt)

def is_safe_relative_path(value: object) -> bool:
    try:
        path = Path(str(value))
    except Exception:
        return False
    return not path.is_absolute() and ".." not in path.parts and str(path) not in {"", "."}

def relative_inside(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False

def character_asset_type(asset_kind: str) -> str | None:
    return CHARACTER_KIND_MAP.get(str(asset_kind).upper())

def target_root_for(asset_kind: str) -> Path:
    kind = str(asset_kind).upper()
    if kind.startswith("CHARACTER_"):
        return Path("assets/characters/approved")
    for prefix, root in GENERIC_TARGET_ROOTS.items():
        if kind == prefix or kind.startswith(prefix):
            return root
    raise ArtRequestError(f"no target root for asset kind: {asset_kind}")

def deterministic_target_name(
    asset_kind: str,
    character_id: str | None,
    subject: str,
    camera: str,
    composition: str,
    fmt: str,
) -> str:
    del composition
    kind = str(asset_kind).upper()
    base = normalize_token(character_id or subject)
    if not base:
        raise ArtRequestError("character_id or subject is required for deterministic naming")
    tokens = list(KIND_NAME_TOKENS.get(kind, (normalize_token(kind),)))
    camera_token = normalize_token(camera)
    if camera_token:
        tokens.append(camera_token)
    return "--".join([base] + [token for token in tokens if token]) + extension_for_format(fmt)

def deterministic_drop_zone(request_id: str) -> str:
    return str(Path("tools/art_studio/inbox") / request_id).replace("\\", "/")

def deterministic_target_path(request: dict) -> str:
    return str(
        target_root_for(request["asset_kind"]) / deterministic_target_name(
            request["asset_kind"],
            request.get("character_id"),
            request["subject"],
            request["camera"],
            request["composition"],
            request["format"],
        )
    ).replace("\\", "/")

def deterministic_archive_path(request_id: str, filename: str) -> str:
    return str(Path("tools/art_studio/archive") / request_id / filename).replace("\\", "/")

def request_shape_errors(request: dict) -> list[str]:
    errors: list[str] = []
    required = load_schema()["required"]
    for field in required:
        if field not in request:
            errors.append(f"missing field: {field}")

    request_id = str(request.get("request_id", ""))
    if not re.fullmatch(r"[A-Z0-9][A-Z0-9._-]{3,63}", request_id):
        errors.append("request_id must match [A-Z0-9][A-Z0-9._-]{3,63}")

    state = str(request.get("status", ""))
    if state not in REQUEST_STATES:
        errors.append(f"invalid status: {state!r}")

    kind = str(request.get("asset_kind", "")).upper()
    if kind not in ASSET_KINDS:
        errors.append(f"invalid asset_kind: {kind!r}")

    camera = str(request.get("camera", "")).upper()
    if camera not in CAMERAS:
        errors.append(f"invalid camera: {camera!r}")

    composition = str(request.get("composition", "")).upper()
    if composition not in COMPOSITIONS:
        errors.append(f"invalid composition: {composition!r}")

    fmt = str(request.get("format", "")).lower()
    if fmt not in SUPPORTED_FORMATS:
        errors.append(f"invalid format: {fmt!r}")

    try:
        width = int(request.get("minimum_width"))
        height = int(request.get("minimum_height"))
        if width <= 0 or height <= 0:
            errors.append("minimum dimensions must be positive")
    except (TypeError, ValueError):
        errors.append("minimum dimensions must be integers")

    for field in (
        "what_is_expected",
        "subject",
        "environment",
        "visual_notes",
        "generation_prompt",
        "negative_prompt",
    ):
        if not str(request.get(field, "")).strip():
            errors.append(f"{field} must be non-empty")

    if not is_safe_relative_path(request.get("target_name", "")):
        errors.append("target_name must be a safe relative filename")
    if not is_safe_relative_path(request.get("target_path", "")):
        errors.append("target_path must be safe and relative")
    if not is_safe_relative_path(request.get("drop_zone", "")):
        errors.append("drop_zone must be safe and relative")
    if kind.startswith("CHARACTER_") and not str(request.get("character_id") or ""):
        errors.append("character_id is required for character asset requests")
    return errors

def request_semantic_errors(request: dict) -> list[str]:
    errors: list[str] = []
    kind = request["asset_kind"]
    fmt = canonical_format(request["format"])
    char_id = str(request.get("character_id") or "")

    if kind.startswith("CHARACTER_"):
        character = factory_canonical().get(char_id)
        if not character:
            errors.append(f"unknown character_id: {char_id!r}")
        asset_type = character_asset_type(kind)
        if asset_type:
            rules = factory_manifest()["asset_types"].get(asset_type)
            if not rules:
                errors.append(f"character factory has no asset type mapping: {asset_type}")
            else:
                allowed = {str(value).lower() for value in rules["format"]}
                if fmt not in allowed:
                    errors.append(f"{kind}: format {fmt} not allowed by character asset factory")
                min_w = int(rules["dimensions"]["min_width"])
                min_h = int(rules["dimensions"]["min_height"])
                if int(request["minimum_width"]) < min_w:
                    errors.append(f"{kind}: minimum_width below factory requirement {min_w}")
                if int(request["minimum_height"]) < min_h:
                    errors.append(f"{kind}: minimum_height below factory requirement {min_h}")
    elif char_id:
        errors.append("character_id is only valid for character asset requests")

    allowed_formats = (
        {str(value).lower() for value in factory_manifest()["asset_types"][character_asset_type(kind)]["format"]}
        if kind.startswith("CHARACTER_") and character_asset_type(kind)
        else GENERIC_FORMATS.get(kind, SUPPORTED_FORMATS)
    )
    if fmt not in allowed_formats:
        errors.append(f"{kind}: unsupported format {fmt}")
    return errors

def validate_request(request: dict) -> list[str]:
    errors = request_shape_errors(request)
    if errors:
        return errors

    errors.extend(request_semantic_errors(request))
    expected_name = deterministic_target_name(
        request["asset_kind"],
        request.get("character_id"),
        request["subject"],
        request["camera"],
        request["composition"],
        request["format"],
    )
    expected_path = deterministic_target_path(request)
    expected_drop = deterministic_drop_zone(request["request_id"])

    if request.get("target_name") != expected_name:
        errors.append(f"target_name mismatch: expected {expected_name}")
    if request.get("target_path") != expected_path:
        errors.append(f"target_path mismatch: expected {expected_path}")
    if request.get("drop_zone") != expected_drop:
        errors.append(f"drop_zone mismatch: expected {expected_drop}")

    target_path = Path(request.get("target_path", ""))
    allowed_root = ROOT / target_root_for(request["asset_kind"])
    if target_path.is_absolute() or not relative_inside(ROOT / target_path, allowed_root):
        errors.append("target_path escapes its deterministic target root")
    return errors

def transition(request: dict, new_state: str) -> dict:
    current = str(request.get("status", ""))
    if new_state not in TRANSITIONS.get(current, set()):
        raise ArtRequestError(f"invalid state transition: {current} -> {new_state}")
    request["status"] = new_state
    request["updated_at"] = utc_now()
    return request

def find_request(registry: dict, request_id: str) -> dict:
    for request in registry["requests"]:
        if request["request_id"] == request_id:
            return request
    raise ArtRequestError(f"request not found: {request_id}")

def build_request(
    *,
    request_id: str,
    asset_kind: str,
    character_id: str | None,
    subject: str,
    what_is_expected: str,
    camera: str,
    composition: str,
    environment: str,
    visual_notes: str,
    generation_prompt: str,
    negative_prompt: str,
    fmt: str,
    minimum_width: int,
    minimum_height: int,
    created_at: str | None = None,
) -> dict:
    now = created_at or utc_now()
    kind = str(asset_kind).upper()
    camera_value = str(camera).upper()
    composition_value = str(composition).upper()
    normalized_format = canonical_format(fmt)
    character_value = str(character_id or "") or None
    if character_value and not subject:
        character = factory_canonical().get(character_value)
        if character:
            subject = character["display_name"]

    request = {
        "request_id": request_id,
        "status": "REQUESTED",
        "asset_kind": kind,
        "target_name": deterministic_target_name(
            kind, character_value, subject, camera_value, composition_value, normalized_format
        ),
        "target_path": "",
        "character_id": character_value,
        "what_is_expected": what_is_expected,
        "camera": camera_value,
        "composition": composition_value,
        "subject": subject,
        "environment": environment,
        "visual_notes": visual_notes,
        "generation_prompt": generation_prompt,
        "negative_prompt": negative_prompt,
        "format": normalized_format,
        "minimum_width": int(minimum_width),
        "minimum_height": int(minimum_height),
        "drop_zone": deterministic_drop_zone(request_id),
        "created_at": now,
        "updated_at": now,
        "source_files": [],
        "output": None,
        "failure": None,
    }
    request["target_path"] = deterministic_target_path(request)
    errors = validate_request(request)
    if errors:
        raise ArtRequestError("invalid request: " + "; ".join(errors))
    return request

def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()

def validate_image_file(request: dict, path: Path) -> dict:
    if not path.is_file():
        raise ArtRequestError(f"source file does not exist: {path}")

    expected = canonical_format(request["format"])
    actual = canonical_format(path.suffix)
    if actual != expected:
        raise ArtRequestError(
            f"format mismatch: request expects .{expected}, received {path.suffix.lower()}"
        )

    try:
        width, height = factory_dimensions(path)
    except Exception as exc:
        if isinstance(exc, AssetFactoryError):
            raise ArtRequestError(str(exc)) from exc
        raise ArtRequestError(f"invalid image: {path}: {exc}") from exc

    if width < int(request["minimum_width"]) or height < int(request["minimum_height"]):
        raise ArtRequestError(
            f"dimensions {width}x{height} below request minimum "
            f"{request['minimum_width']}x{request['minimum_height']}"
        )

    if path.suffix.lower() == ".svg":
        try:
            root = ElementTree.parse(path).getroot()
        except ElementTree.ParseError as exc:
            raise ArtRequestError(f"invalid SVG: {exc}") from exc
        if root.tag.rsplit("}", 1)[-1] != "svg":
            raise ArtRequestError("SVG root is not <svg>")

    return {
        "filename": path.name,
        "format": expected,
        "width": int(width),
        "height": int(height),
        "sha256": file_sha256(path),
    }

def discover_source(request: dict, root: Path = ROOT) -> Path:
    drop_zone = root / request["drop_zone"]
    inbox_root = root / "tools" / "art_studio" / "inbox"
    if not relative_inside(drop_zone, inbox_root):
        raise ArtRequestError("drop zone escapes tools/art_studio/inbox")
    if not drop_zone.is_dir():
        raise ArtRequestError(f"drop zone does not exist: {request['drop_zone']}")

    files = sorted(path for path in drop_zone.iterdir() if path.is_file())
    supported = [path for path in files if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".svg"}]
    if not supported:
        names = ", ".join(path.name for path in files) or "none"
        raise ArtRequestError(f"no supported source file in drop zone; found: {names}")
    if len(supported) != 1:
        raise ArtRequestError(
            "ambiguous input: expected exactly one supported source file, found "
            + ", ".join(path.name for path in supported)
        )
    return supported[0]

def archive_and_copy(request: dict, source: Path, root: Path = ROOT) -> dict:
    validate_image_file(request, source)

    target = root / request["target_path"]
    archive = root / deterministic_archive_path(request["request_id"], source.name)
    if not is_safe_relative_path(request["target_path"]) or not relative_inside(target, root / target_root_for(request["asset_kind"])):
        raise ArtRequestError("unsafe target path")
    if target.exists():
        raise ArtRequestError(f"target already exists: {request['target_path']}")

    archive.parent.mkdir(parents=True, exist_ok=True)
    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copy2(source, archive)
        shutil.copy2(source, target)
    except Exception:
        if archive.exists():
            archive.unlink()
        if target.exists():
            target.unlink()
        raise

    target_info = validate_image_file(request, target)
    return {
        "filename": source.name,
        "format": target_info["format"],
        "width": target_info["width"],
        "height": target_info["height"],
        "sha256": file_sha256(source),
        "drop_path": str(source.relative_to(root)).replace("\\", "/"),
        "archive_path": str(archive.relative_to(root)).replace("\\", "/"),
        "target_path": str(target.relative_to(root)).replace("\\", "/"),
    }

def apply_character_manifest_update(manifest_path: Path, request: dict) -> None:
    asset_type = character_asset_type(request["asset_kind"])
    if not asset_type:
        return
    data = load_json(manifest_path)
    entry = next(
        (item for item in data.get("characters", []) if str(item.get("character_id")) == request["character_id"]),
        None,
    )
    if not entry:
        raise ArtRequestError(f"character manifest entry not found: {request['character_id']}")
    asset_set = entry.setdefault("asset_set", {})
    spec = asset_set.setdefault(asset_type, {})
    source_files = request.get("source_files") or []
    archive_path = source_files[0].get("archive_path") if source_files else None
    if not archive_path:
        raise ArtRequestError("approved character request has no archived source trace")
    spec.update(
        {
            "source": archive_path,
            "path": request["target_path"],
            "status": "VALIDATED",
            "quality_class": "REAL_PRODUCTION_ART",
        }
    )
    save_json(manifest_path, data)

def create_request(registry_path: Path, **kwargs) -> dict:
    registry = load_registry(registry_path)
    request_id = kwargs["request_id"]
    if any(item["request_id"] == request_id for item in registry["requests"]):
        raise ArtRequestError(f"request already exists: {request_id}")
    request = build_request(**kwargs)
    registry["requests"].append(request)
    save_registry(registry_path, registry)
    return request

def command_create(args, registry_path: Path) -> int:
    request = create_request(
        registry_path,
        request_id=args.request_id,
        asset_kind=args.asset_kind,
        character_id=args.character_id,
        subject=args.subject or "",
        what_is_expected=args.what_is_expected,
        camera=args.camera,
        composition=args.composition,
        environment=args.environment,
        visual_notes=args.visual_notes,
        generation_prompt=args.generation_prompt,
        negative_prompt=args.negative_prompt,
        fmt=args.format,
        minimum_width=args.minimum_width,
        minimum_height=args.minimum_height,
    )
    print(json.dumps(request, indent=2, ensure_ascii=False))
    return 0

def command_list(args, registry_path: Path) -> int:
    registry = load_registry(registry_path)
    requests = registry["requests"]
    if args.state:
        requests = [item for item in requests if item["status"] == args.state]
    for request in requests:
        print(" | ".join([request["request_id"], request["status"], request["asset_kind"], request["target_name"]]))
    print(f"requests={len(requests)}")
    return 0

def command_show(args, registry_path: Path) -> int:
    request = find_request(load_registry(registry_path), args.request_id)
    print(json.dumps(request, indent=2, ensure_ascii=False))
    return 0

def mutate_registry_request(registry_path: Path, request_id: str, callback) -> dict:
    registry = load_registry(registry_path)
    request = find_request(registry, request_id)
    result = callback(request)
    save_registry(registry_path, registry)
    return result

def command_generate(args, registry_path: Path) -> int:
    def action(request):
        errors = validate_request(request)
        if errors:
            raise ArtRequestError("request invalid: " + "; ".join(errors))
        transition(request, "GENERATED")
        return request
    result = mutate_registry_request(registry_path, args.request_id, action)
    print(f"{result['request_id']} -> {result['status']}")
    return 0

def command_ingest(args, registry_path: Path, root: Path) -> int:
    registry = load_registry(registry_path)
    request = find_request(registry, args.request_id)
    errors = validate_request(request)
    if errors:
        raise ArtRequestError("request invalid: " + "; ".join(errors))
    if request["status"] != "GENERATED":
        raise ArtRequestError(f"ingest requires GENERATED state, found {request['status']}")

    try:
        source = discover_source(request, root)
        trace = archive_and_copy(request, source, root)
    except ArtRequestError as exc:
        transition(request, "REJECTED")
        request["failure"] = {"code": "INGEST_VALIDATION", "message": str(exc)}
        save_registry(registry_path, registry)
        raise

    request["source_files"] = [trace]
    request["output"] = {"path": request["target_path"], "format": trace["format"]}
    transition(request, "IMPORTED")
    save_registry(registry_path, registry)
    print(json.dumps(trace, indent=2))
    return 0

def command_validate(args, registry_path: Path, root: Path) -> int:
    registry = load_registry(registry_path)
    request = find_request(registry, args.request_id)
    if request["status"] != "IMPORTED":
        raise ArtRequestError(f"validate requires IMPORTED state, found {request['status']}")
    try:
        validate_image_file(request, root / request["target_path"])
        errors = request_semantic_errors(request)
        if errors:
            raise ArtRequestError("; ".join(errors))
    except ArtRequestError as exc:
        transition(request, "REJECTED")
        request["failure"] = {"code": "VALIDATION", "message": str(exc)}
        save_registry(registry_path, registry)
        raise
    transition(request, "VALIDATED")
    request["validation"] = {
        "validated_at": request["updated_at"],
        "target_path": request["target_path"],
        "sha256": request["source_files"][0]["sha256"],
    }
    save_registry(registry_path, registry)
    print(f"{request['request_id']} -> {request['status']}")
    return 0

def command_approve(args, registry_path: Path, root: Path) -> int:
    registry = load_registry(registry_path)
    request = find_request(registry, args.request_id)
    if request["status"] != "VALIDATED":
        raise ArtRequestError(f"approve requires VALIDATED state, found {request['status']}")
    manifest_path = root / "data" / "character_asset_manifest.json"
    if request["asset_kind"].startswith("CHARACTER_"):
        apply_character_manifest_update(manifest_path, request)
        request["manifest_handoff"] = {
            "path": str(manifest_path.relative_to(root)).replace("\\", "/"),
            "asset_type": character_asset_type(request["asset_kind"]),
            "status": "UPDATED",
        }
    transition(request, "APPROVED")
    save_registry(registry_path, registry)
    print(f"{request['request_id']} -> {request['status']}")
    return 0

def command_reject(args, registry_path: Path) -> int:
    reason = str(args.reason).strip() or "rejected by operator"
    def action(request):
        transition(request, "REJECTED")
        request["failure"] = {"code": "MANUAL_REJECTION", "message": reason}
        return request
    result = mutate_registry_request(registry_path, args.request_id, action)
    print(f"{result['request_id']} -> {result['status']}")
    return 0

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="BaseWarriors Art Request / AI Asset Intake")
    parser.add_argument("--root", default=str(ROOT), help="repository root")
    parser.add_argument("--registry", default=str(REGISTRY_PATH), help="request registry path")
    sub = parser.add_subparsers(dest="command", required=True)

    create = sub.add_parser("create")
    create.add_argument("--request-id", required=True)
    create.add_argument("--asset-kind", required=True)
    create.add_argument("--character-id")
    create.add_argument("--subject", default="")
    create.add_argument("--what-is-expected", required=True)
    create.add_argument("--camera", required=True)
    create.add_argument("--composition", required=True)
    create.add_argument("--environment", required=True)
    create.add_argument("--visual-notes", required=True)
    create.add_argument("--generation-prompt", required=True)
    create.add_argument("--negative-prompt", required=True)
    create.add_argument("--format", required=True)
    create.add_argument("--minimum-width", type=int, required=True)
    create.add_argument("--minimum-height", type=int, required=True)

    listing = sub.add_parser("list")
    listing.add_argument("--state", choices=REQUEST_STATES)

    show = sub.add_parser("show")
    show.add_argument("request_id")

    generated = sub.add_parser("generate")
    generated.add_argument("request_id")

    ingest = sub.add_parser("ingest")
    ingest.add_argument("request_id")

    validate = sub.add_parser("validate")
    validate.add_argument("request_id")

    approve = sub.add_parser("approve")
    approve.add_argument("request_id")

    reject = sub.add_parser("reject")
    reject.add_argument("request_id")
    reject.add_argument("--reason", required=True)

    return parser

def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    registry_path = Path(args.registry).resolve()
    root = Path(args.root).resolve()

    try:
        if args.command == "create":
            return command_create(args, registry_path)
        if args.command == "list":
            return command_list(args, registry_path)
        if args.command == "show":
            return command_show(args, registry_path)
        if args.command == "generate":
            return command_generate(args, registry_path)
        if args.command == "ingest":
            return command_ingest(args, registry_path, root)
        if args.command == "validate":
            return command_validate(args, registry_path, root)
        if args.command == "approve":
            return command_approve(args, registry_path, root)
        if args.command == "reject":
            return command_reject(args, registry_path)
    except ArtRequestError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
