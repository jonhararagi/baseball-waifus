import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
bridge = ROOT / "streaming_bridge" / "main.py"
art = ROOT / "character_ai" / "art_server.py"


def main():
    processes = []
    try:
        print("Starting Baseball Waifus local tools...")
        processes.append(subprocess.Popen([sys.executable, str(bridge)], cwd=bridge.parent))
        processes.append(subprocess.Popen([sys.executable, str(art)], cwd=art.parent))
        print("Streaming bridge + Character AI bridge started.")

        while all(process.poll() is None for process in processes):
            time.sleep(0.25)
    except KeyboardInterrupt:
        pass
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    main()
