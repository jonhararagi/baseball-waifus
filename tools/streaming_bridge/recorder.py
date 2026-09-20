import json
from pathlib import Path
from typing import Iterable


class TrackingRecorder:
    def __init__(self, path: str):
        self.path = Path(path)
        self.file = None
        self.count = 0

    def open(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.file = self.path.open("w", encoding="utf-8")

    def write(self, payload: dict) -> None:
        if self.file is None:
            self.open()
        self.file.write(json.dumps(payload, separators=(",", ":"), ensure_ascii=False) + "\n")
        self.file.flush()
        self.count += 1

    def close(self) -> None:
        if self.file is not None:
            self.file.flush()
            self.file.close()
            self.file = None


def read_recording(path: str) -> Iterable[dict]:
    source = Path(path)
    with source.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            text = line.strip()
            if not text:
                continue
            try:
                value = json.loads(text)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Línea {line_number}: JSON inválido: {exc}") from exc
            if not isinstance(value, dict):
                raise ValueError(f"Línea {line_number}: el registro no es un objeto JSON")
            yield value
