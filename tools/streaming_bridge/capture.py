import math
import threading
import cv2
import mss
import numpy as np
import sounddevice as sd

class WebcamCapture:
    def __init__(self, camera_index=0, width=1280, height=720):
        self.cap = cv2.VideoCapture(camera_index)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

    def read(self):
        ok, frame = self.cap.read()
        return frame if ok else None

    def close(self):
        self.cap.release()

class ScreenCapture:
    def __init__(self):
        self.sct = mss.mss()

    def grab(self, monitor=1):
        monitor_info = self.sct.monitors[monitor]
        image = np.array(self.sct.grab(monitor_info))
        return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)

    def close(self):
        self.sct.close()

class AudioMeter:
    def __init__(self, device=None, samplerate=48000, blocksize=1024):
        self.level = 0.0
        self.peak = 0.0
        self._lock = threading.Lock()
        self.stream = sd.InputStream(device=device, samplerate=samplerate, channels=1, blocksize=blocksize, callback=self._callback)

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
        self.stream.start()

    def snapshot(self):
        with self._lock:
            return {"level": self.level, "peak": self.peak}

    def close(self):
        self.stream.stop()
        self.stream.close()
