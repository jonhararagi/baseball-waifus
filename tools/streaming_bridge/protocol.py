PROTOCOL_VERSION = 1

def make_payload(tracking: dict, audio: dict | None = None, capture: dict | None = None) -> dict:
	return {
		"protocol": "baseball-waifus-tracking",
		"version": PROTOCOL_VERSION,
		"tracking": tracking,
		"audio": audio or {"enabled": False, "level": 0.0, "peak": 0.0},
		"capture": capture or {"camera": True, "screen": False},
	}
