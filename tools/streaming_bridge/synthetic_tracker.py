import math
import time


class SyntheticFaceTracker:
    """Generador determinista de tracking facial para pruebas offline."""

    def __init__(self, smoothing: float = 0.45):
        self.smoothing = max(0.0, min(float(smoothing), 1.0))
        self.frame_index = 0
        self.started_at = time.perf_counter()
        self._previous = {
            "yaw": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "blink": 0.0,
            "mouth": 0.0,
        }

    def process(self, _frame=None) -> dict:
        elapsed = time.perf_counter() - self.started_at
        self.frame_index += 1

        raw = {
            "tracking": True,
            "yaw": math.sin(elapsed * 1.7) * 0.55,
            "pitch": math.sin(elapsed * 1.15 + 0.7) * 0.28,
            "roll": math.sin(elapsed * 0.9 + 1.2) * 0.18,
            "blink": 1.0 if math.sin(elapsed * 2.6) > 0.94 else 0.0,
            "mouth": (math.sin(elapsed * 2.1) + 1.0) * 0.5,
            "synthetic": True,
            "frame_index": self.frame_index,
        }

        alpha = self.smoothing
        for key in ("yaw", "pitch", "roll", "blink", "mouth"):
            self._previous[key] = (
                self._previous[key] * alpha
                + float(raw[key]) * (1.0 - alpha)
            )
            raw[key] = self._previous[key]

        return raw

    def close(self) -> None:
        return
