import math
import threading
import cv2
import mss
import numpy as np
import sounddevice as sd


class WebcamCapture:
    def __init__(self, camera_index=0, width=1280, height=720):
        self.index = camera_index
        self.cap = cv2.VideoCapture(camera_index)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

    @property
    def opened(self):
        return self.cap.isOpened()

    def read(self):
        ok, frame = self.cap.read()
        return frame if ok else None

    def close(self):
        if self.cap is not None:
            self.cap.release()


class ScreenCapture:
    def __init__(self):
        self.sct = mss.mss()

    @property
    def monitor_count(self):
        return max(0, len(self.sct.monitors) - 1)

    def grab(self, monitor=1):
        if monitor < 1 or monitor >= len(self.sct.monitors):
            monitor = 1
        monitor_info = self.sct.monitors[monitor]
        image = np.array(self.sct.grab(monitor_info))
        return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)

    def close(self):
        if self.sct is not None:
            self.sct.close()


class AudioMeter:
    def __init__(self, device=None, samplerate=48000, blocksize=1024):
        self.level = 0.0
        self.peak = 0.0
        self.enabled = False
        self.error = ""
        self._lock = threading.Lock()
        try:
            self.stream = sd.InputStream(
                device=device,
                samplerate=samplerate,
                channels=1,
                blocksize=blocksize,
                callback=self._callback,
            )
        except Exception as exc:
            self.stream = None
            self.error = str(exc)

    def _callback(self, indata, frames, _time, _status):
        if frames <= 0:
            return
        rms = float(np.sqrt(np.mean(np.square(indata[:, 0]))))
        db = 20.0 * math.log10(max(rms, 1e-7))
        normalized = max(0.0, min(1.0, (db + 60.0) / 60.0))
        with self._lock:
            self.level = normalized
            self.peak = max(self.peak * 0.92, normalized)

    def start(self):
        if self.stream is None:
            return False
        try:
            self.stream.start()
            self.enabled = True
            return True
        except Exception as exc:
            self.error = str(exc)
            return False

    def snapshot(self):
        with self._lock:
            return {
                "enabled": self.enabled,
                "level": self.level,
                "peak": self.peak,
            }

    def close(self):
        if self.stream is not None:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception:
                pass
