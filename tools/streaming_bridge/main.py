import argparse
import json
import socket
import threading
import time
from pathlib import Path

from capture import AudioMeter, ScreenCapture, WebcamCapture
from obs_client import OBSController
from protocol import encode_payload, make_payload
from recorder import TrackingRecorder
from tracker import FaceTracker
from synthetic_tracker import SyntheticFaceTracker
from control_server import BridgeControl
from qa_runner import QARunner


ROOT = Path(__file__).resolve().parent


def load_config(path_value: str | None) -> dict:
    path = Path(path_value) if path_value else ROOT / "config.json"
    if not path.is_absolute():
        path = ROOT / path
    return json.loads(path.read_text(encoding="utf-8"))


def parse_args():
    parser = argparse.ArgumentParser(description="Baseball Waifus local streaming bridge")
    parser.add_argument("--config", default=None, help="Ruta opcional al config JSON")
    parser.add_argument("--no-audio", action="store_true", help="Desactiva captura de micrófono")
    parser.add_argument("--no-screen", action="store_true", help="Desactiva captura de pantalla")
    parser.add_argument("--no-obs", action="store_true", help="Desactiva conexión OBS")
    parser.add_argument("--record", action="store_true", help="Graba paquetes JSONL además de enviarlos")
    parser.add_argument("--no-control", action="store_true", help="Desactiva el panel local de control")
    parser.add_argument("--synthetic-tracking", action="store_true", help="Usa tracking facial sintético y evita webcam/MediaPipe")
    parser.add_argument("--max-packets", type=int, default=0, help="Finaliza tras N paquetes; 0 mantiene ejecución continua")
    return parser.parse_args()


def send_udp(sock, address, payload):
    sock.sendto(encode_payload(payload), address)


def main():
    args = parse_args()
    config = load_config(args.config)

    synthetic_tracking = bool(config.get("enable_synthetic_tracking", False)) or args.synthetic_tracking
    camera = None
    tracker = None
    if synthetic_tracking:
        tracker = SyntheticFaceTracker(config.get("tracking_smoothing", 0.45))
    else:
        camera = WebcamCapture(
            config.get("camera_index", 0),
            config.get("camera_width", 1280),
            config.get("camera_height", 720),
        )
        if not camera.opened:
            camera.close()
            raise RuntimeError("No se pudo abrir la webcam configurada.")
        tracker = FaceTracker(config.get("tracking_smoothing", 0.45))

    audio = AudioMeter(
        device=config.get("audio_device"),
        samplerate=config.get("audio_samplerate", 48000),
        blocksize=config.get("audio_blocksize", 1024),
    )
    audio_enabled = bool(config.get("enable_audio", True)) and not args.no_audio
    if audio_enabled:
        audio.start()

    screen = None
    screen_enabled = bool(config.get("enable_screen_capture", False)) and not args.no_screen
    if screen_enabled:
        screen = ScreenCapture()

    obs = None
    record_enabled = bool(config.get("enable_recording", False)) or args.record
    recorder = None
    record_path = str(ROOT / config.get("record_path", "recordings/session.jsonl"))
    record_lock = threading.Lock()
    if record_enabled:
        recorder = TrackingRecorder(record_path)

    obs_enabled = bool(config.get("enable_obs", False)) and not args.no_obs
    if obs_enabled:
        obs = OBSController(
            config.get("obs_host", "127.0.0.1"),
            config.get("obs_port", 4455),
            config.get("obs_password", ""),
        )
        obs.switch_scene(config.get("obs_scene", ""))

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    target = (config.get("godot_host", "127.0.0.1"), config.get("godot_port", 8765))
    interval = 1.0 / max(1, config.get("send_tracking_fps", 30))
    diagnostics_every = max(0.1, config.get("screen_diagnostics_interval", 2.0))
    next_diagnostics = time.perf_counter()
    sequence = 0
    sent_packets = 0
    last_tracking_ms = 0
    started_at = time.monotonic()
    fps_window_start = time.perf_counter()
    fps_window_frames = 0
    current_fps = 0.0
    last_tracking_active = False
    obs_connected_cached = False
    control = None
    qa = QARunner(ROOT / ".", config.get("qa_timeout_seconds", 120.0))

    def start_recording():
        nonlocal recorder
        with record_lock:
            if recorder is None:
                recorder = TrackingRecorder(record_path)
            return {"ok": True, "recording": True, "path": str(recorder.path)}

    def stop_recording():
        nonlocal recorder
        with record_lock:
            if recorder is not None:
                recorder.close()
                recorder = None
            return {"ok": True, "recording": False}

    def status_provider():
        with record_lock:
            current_recorder = recorder
            recording = current_recorder is not None and current_recorder.file is not None
            record_count = current_recorder.count if current_recorder is not None else 0

        now_ms = int(time.time() * 1000)
        tracking_age_ms = None
        if last_tracking_ms > 0:
            tracking_age_ms = max(0, now_ms - last_tracking_ms)

        return {
            "ok": True,
            "service": "streaming_bridge",
            "tracking_active": last_tracking_active,
            "tracking_age_ms": tracking_age_ms,
            "fps": current_fps,
            "sequence": max(sequence - 1, 0),
            "sent_packets": sent_packets,
            "uptime_s": max(0.0, time.monotonic() - started_at),
            "audio_enabled": audio.enabled,
            "screen_enabled": screen is not None,
            "obs_connected": obs_connected_cached,
            "recording": recording,
            "record_count": record_count,
            "record_path": record_path,
            "target": f"{target[0]}:{target[1]}",
        }

    control_enabled = bool(config.get("enable_control_server", True)) and not args.no_control
    if control_enabled:
        control = BridgeControl(
            config.get("control_host", "127.0.0.1"),
            int(config.get("control_port", 8787)),
            status_provider,
            start_recording,
            stop_recording,
            qa.start,
            qa.status,
        )
        control.start()

    print("Baseball Waifus Streaming Bridge")
    print(f"Tracking UDP -> {target[0]}:{target[1]}")
    if synthetic_tracking:
        print("Tracking source -> SYNTHETIC")
    else:
        print(f"Camera -> {camera.index} ({config.get('camera_width', 1280)}x{config.get('camera_height', 720)})")
    print(f"Audio -> {'ON' if audio.enabled else 'OFF'}")
    print(f"Screen diagnostics -> {'ON' if screen else 'OFF'}")
    print(f"Recording -> {'ON' if recorder else 'OFF'}")
    if control is not None:
        print(f"Control panel -> http://{config.get('control_host', '127.0.0.1')}:{control.server.server_address[1]}/")
    else:
        print("Control panel -> OFF")
    if obs is not None:
        print(f"OBS -> {'CONNECTED' if obs.status().get('connected') else 'UNAVAILABLE'}")
    else:
        print("OBS -> OFF")
    print("Ctrl+C para salir.")

    try:
        next_tick = time.perf_counter()
        next_obs_check = 0.0
        while True:
            if synthetic_tracking:
                frame = None
            else:
                frame = camera.read()
                if frame is None:
                    time.sleep(0.05)
                    continue

            now_tick = time.perf_counter()
            if obs is not None and now_tick >= next_obs_check:
                obs_connected_cached = bool(obs.status().get("connected"))
                next_obs_check = now_tick + 2.0

            tracking = tracker.process(frame)
            last_tracking_active = bool(tracking.get("tracking", False))
            if last_tracking_active:
                last_tracking_ms = int(time.time() * 1000)
            capture_status = {
                "camera": not synthetic_tracking,
                "synthetic_tracking": synthetic_tracking,
                "screen": screen is not None,
            }

            now = time.perf_counter()
            if screen is not None and now >= next_diagnostics:
                preview = screen.grab(config.get("screen_monitor", 1))
                capture_status["screen_width"] = int(preview.shape[1])
                capture_status["screen_height"] = int(preview.shape[0])
                next_diagnostics = now + diagnostics_every

            payload = make_payload(tracking, audio.snapshot(), capture_status, sequence=sequence, sent_at_ms=int(time.time() * 1000))
            with record_lock:
                if recorder is not None:
                    recorder.write(payload)
            send_udp(sock, target, payload)
            sequence += 1
            sent_packets += 1
            fps_window_frames += 1

            if args.max_packets > 0 and sent_packets >= args.max_packets:
                break
            fps_now = time.perf_counter()
            elapsed = fps_now - fps_window_start
            if elapsed >= 1.0:
                current_fps = fps_window_frames / elapsed
                fps_window_frames = 0
                fps_window_start = fps_now

            next_tick += interval
            sleep_for = next_tick - time.perf_counter()
            if sleep_for > 0:
                time.sleep(sleep_for)
            else:
                next_tick = time.perf_counter()
    except KeyboardInterrupt:
        pass
    finally:
        if camera is not None:
            camera.close()
        if tracker is not None:
            tracker.close()
        audio.close()
        if screen is not None:
            screen.close()
        with record_lock:
            if recorder is not None:
                recorder.close()
        if control is not None:
            control.close()
        qa.close()
        sock.close()


if __name__ == "__main__":
    main()
