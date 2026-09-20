import json
import socket
import time
from pathlib import Path

from capture import AudioMeter, WebcamCapture
from obs_client import OBSController
from tracker import FaceTracker

ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))

def send_udp(sock, address, payload):
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sock.sendto(raw, address)

def main():
    camera = WebcamCapture(CONFIG["camera_index"])
    tracker = FaceTracker()
    audio = AudioMeter()
    audio.start()

    obs = OBSController(CONFIG["obs_host"], CONFIG["obs_port"], CONFIG.get("obs_password", ""))
    obs.switch_scene(CONFIG.get("obs_scene", ""))

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    target = (CONFIG["godot_host"], CONFIG["godot_port"])
    interval = 1.0 / max(1, CONFIG.get("send_tracking_fps", 30))

    print("Baseball Waifus Streaming Bridge")
    print(f"Tracking UDP -> {target[0]}:{target[1]}")
    print("Ctrl+C para salir.")

    try:
        next_tick = time.perf_counter()
        while True:
            frame = camera.read()
            if frame is None:
                time.sleep(0.05)
                continue
            tracking = tracker.process(frame)
            send_udp(sock, target, {**tracking, "audio": audio.snapshot()})
            next_tick += interval
            sleep_for = next_tick - time.perf_counter()
            if sleep_for > 0:
                time.sleep(sleep_for)
            else:
                next_tick = time.perf_counter()
    except KeyboardInterrupt:
        pass
    finally:
        camera.close()
        tracker.close()
        audio.close()
        sock.close()

if __name__ == "__main__":
    main()
