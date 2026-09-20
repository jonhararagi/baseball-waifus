PROTOCOL_NAME = "baseball-waifus-tracking"
PROTOCOL_VERSION = 1


def make_payload(
    tracking: dict,
    audio: dict | None = None,
    capture: dict | None = None,
    sequence: int = 0,
    sent_at_ms: int | None = None,
) -> dict:
    return {
        "protocol": PROTOCOL_NAME,
        "version": PROTOCOL_VERSION,
        "sequence": int(sequence),
        "sent_at_ms": int(sent_at_ms) if sent_at_ms is not None else 0,
        "tracking": tracking or {},
        "audio": audio or {"enabled": False, "level": 0.0, "peak": 0.0},
        "capture": capture or {"camera": True, "screen": False},
    }


def validate_payload(payload: object) -> tuple[bool, str]:
    if not isinstance(payload, dict):
        return False, "payload_not_object"
    if payload.get("protocol") != PROTOCOL_NAME:
        return False, "protocol_mismatch"
    try:
        version = int(payload.get("version", -1))
    except (TypeError, ValueError):
        return False, "version_invalid"
    if version != PROTOCOL_VERSION:
        return False, "version_mismatch"
    if not isinstance(payload.get("tracking"), dict):
        return False, "tracking_missing"
    sequence = payload.get("sequence")
    if not isinstance(sequence, int) or sequence < 0:
        return False, "sequence_invalid"
    return True, ""


def encode_payload(payload: dict) -> bytes:
    import json
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
