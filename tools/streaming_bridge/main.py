import json
import socket
import time
from pathlib import Path

from capture import AudioMeter, ScreenCapture, WebcamCapture
from obs_client import OBSController
from protocol import make_payload
from tracker import FaceTracker

ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))


def send_udp(sock, address, payload):
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sock.sendto(raw, address)


def main():
    camera = WebcamCapture(
        CONFIG.get("camera_index", 0),
        CONFIG.get("camera_width", 1280),
        CONFIG.get("camera_height", 720),
    )
    if not camera.opened:
        raise RuntimeError("No se pudo abrir la webcam configurada.")

    tracker = FaceTracker(CONFIG.get("tracking_smoothing", 0.45))

    audio = AudioMeter(
        device=CONFIG.get("audio_device"),
        samplerate=CONFIG.get("audio_samplerate", 48000),
        blocksize=CONFIG.get("audio_blocksize", 1024),
    )
    if CONFIG.get("enable_audio", True):
        audio.start()

    screen = None
    if CONFIG.get("enable_screen_capture", False):
        screen = ScreenCapture()

    obs = OBSController(
        CONFIG.get("obs_host", "127.0.0.1"),
        CONFIG.get("obs_port", 4455),
        CONFIG.get("obs_password", ""),
    )
    obs.switch_scene(CONFIG.get("obs_scene", ""))

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    target = (CONFIG.get("godot_host", "127.0.0.1"), CONFIG.get("godot_port", 8765))
    interval = 1.0 / max(1, CONFIG.get("send_tracking_fps", 30))
    diagnostics_every = max(1, CONFIG.get("screen_diagnostics_interval", 2.0))
    next_diagnostics = time.perf_counter()

    print("Baseball Waifus Streaming Bridge")
    print(f"Tracking UDP -> {target[0]}:{target[1]}")
    print(f"Camera -> {camera.index} ({CONFIG.get('camera_width', 1280)}x{CONFIG.get('camera_height', 720)})")
    print(f"Audio -> {'ON' if audio.enabled else 'OFF'}")
    print(f"Screen diagnostics -> {'ON' if screen else 'OFF'}")
    print("Ctrl+C para salir.")

    try:
        next_tick = time.perf_counter()
        while True:
            frame = camera.read()
            if frame is None:
                time.sleep(0.05)
                continue

            tracking = tracker.process(frame)
            capture_status = {
                "camera": True,
                "screen": screen is not None,
            }

            now = time.perf_counter()
            if screen is not None and now >= next_diagnostics:
                preview = screen.grab(CONFIG.get("screen_monitor", 1))
                capture_status["screen_width"] = int(preview.shape[1])
                capture_status["screen_height"] = int(preview.shape[0])
                next_diagnostics = now + diagnostics_every

            payload = make_payload(tracking, audio.snapshot(), capture_status)
            send_udp(sock, target, payload)

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
        if screen is not None:
            screen.close()
        sock.close()


if __name__ == "__main__":
    main()
