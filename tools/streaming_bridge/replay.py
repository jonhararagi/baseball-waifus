import argparse
import socket
import time

from protocol import encode_payload, validate_payload
from recorder import read_recording


def parse_args():
    parser = argparse.ArgumentParser(description="Replay del tracking grabado hacia Godot")
    parser.add_argument("recording", help="Archivo JSONL generado por el Streaming Bridge")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--speed", type=float, default=1.0, help="1.0 = tiempo real")
    parser.add_argument("--loop", action="store_true")
    return parser.parse_args()


def send_recording(path: str, address: tuple[str, int], speed: float) -> int:
    speed = max(speed, 0.05)
    packets = list(read_recording(path))
    if not packets:
        raise RuntimeError("La grabación está vacía.")

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sent = 0
    previous_ts = None
    try:
        for payload in packets:
            valid, reason = validate_payload(payload)
            if not valid:
                raise ValueError(f"Payload inválido en replay: {reason}")

            current_ts = int(payload.get("sent_at_ms", 0))
            if previous_ts is not None and current_ts > previous_ts > 0:
                delay = (current_ts - previous_ts) / 1000.0 / speed
                if delay > 0:
                    time.sleep(min(delay, 2.0))
            previous_ts = current_ts

            sock.sendto(encode_payload(payload), address)
            sent += 1
    finally:
        sock.close()

    return sent


def main() -> int:
    args = parse_args()
    total = 0
    while True:
        sent = send_recording(args.recording, (args.host, args.port), args.speed)
        total += sent
        print(f"Replay enviado: {sent} paquetes | total {total}")
        if not args.loop:
            break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
