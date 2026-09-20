import importlib.util
import json
import socket
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def check_module(name: str) -> tuple[bool, str]:
	if importlib.util.find_spec(name) is not None:
		return True, "installed"
	return False, "missing"


def check_udp(host: str, port: int) -> tuple[bool, str]:
	sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	try:
		sock.bind((host, port))
		return True, "bind ok"
	except OSError as exc:
		return False, str(exc)
	finally:
		sock.close()


def main() -> int:
	config_path = ROOT / "config.json"
	config = json.loads(config_path.read_text(encoding="utf-8"))

	print("Baseball Waifus Streaming Bridge Healthcheck")
	print("=" * 48)

	required = ["cv2", "numpy", "mediapipe"]
	optional = ["mss", "sounddevice", "obsws_python"]

	ok = True
	for module in required:
		available, detail = check_module(module)
		print(f"[{'OK' if available else 'FAIL'}] Python module: {module} ({detail})")
		ok = ok and available

	for module in optional:
		available, detail = check_module(module)
		print(f"[{'OK' if available else 'WARN'}] Optional module: {module} ({detail})")

	host = config.get("godot_host", "127.0.0.1")
	port = int(config.get("godot_port", 8765))
	available, detail = check_udp(host, port)
	print(f"[{'OK' if available else 'FAIL'}] UDP {host}:{port} ({detail})")
	ok = ok and available

	obs_enabled = bool(config.get("enable_obs", False))
	if obs_enabled:
		obs_host = config.get("obs_host", "127.0.0.1")
		obs_port = int(config.get("obs_port", 4455))
		print(f"[INFO] OBS enabled at {obs_host}:{obs_port}")
	else:
		print("[INFO] OBS integration disabled in config")

	print()
	if ok:
		print("Resultado: base del bridge preparada.")
		return 0

	print("Resultado: faltan dependencias requeridas o el puerto UDP no está disponible.")
	return 2


if __name__ == "__main__":
	sys.exit(main())
