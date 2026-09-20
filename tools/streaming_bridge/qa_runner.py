import subprocess
import sys
import threading
import time
from pathlib import Path


class QARunner:
    def __init__(self, root: Path, timeout_seconds: float = 120.0):
        self.root = Path(root)
        self.timeout_seconds = max(5.0, float(timeout_seconds))
        self._lock = threading.RLock()
        self._running = False
        self._started_at = None
        self._finished_at = None
        self._exit_code = None
        self._output = ""
        self._command = None
        self._process = None

    def status(self) -> dict:
        with self._lock:
            return {
                "running": self._running,
                "started_at": self._started_at,
                "finished_at": self._finished_at,
                "exit_code": self._exit_code,
                "passed": self._exit_code == 0 if self._exit_code is not None else None,
                "command": list(self._command) if self._command else None,
                "output": self._output,
            }

    def start(self) -> dict:
        with self._lock:
            if self._running:
                return {"ok": False, "error": "qa_already_running", **self.status()}

            self._running = True
            self._started_at = int(time.time() * 1000)
            self._finished_at = None
            self._exit_code = None
            self._output = ""
            self._command = [
                sys.executable,
                "-m",
                "unittest",
                "discover",
                "-p",
                "test_*.py",
            ]

        thread = threading.Thread(target=self._worker, name="baseball-waifus-qa", daemon=True)
        thread.start()
        return {"ok": True, **self.status()}

    def _worker(self) -> None:
        command = self._command or []
        try:
            process = subprocess.Popen(
                command,
                cwd=self.root,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
            )
            with self._lock:
                self._process = process
            try:
                stdout, _ = process.communicate(timeout=self.timeout_seconds)
                exit_code = int(process.returncode)
                output = stdout or ""
            except subprocess.TimeoutExpired:
                process.kill()
                stdout, _ = process.communicate()
                exit_code = 124
                output = (stdout or "") + "\nQA timeout after %.1fs" % self.timeout_seconds
            finally:
                with self._lock:
                    self._process = None
        except OSError as exc:
            exit_code = 127
            output = f"QA launch failed: {exc}"

        with self._lock:
            self._running = False
            self._finished_at = int(time.time() * 1000)
            self._exit_code = exit_code
            self._output = output[-20000:]

    def close(self) -> None:
        with self._lock:
            process = self._process
            self._process = None
            running = self._running
            if process is not None and running:
                process.kill()
        return
