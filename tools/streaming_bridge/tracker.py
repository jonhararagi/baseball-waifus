import math
import time
import cv2
import mediapipe as mp


class FaceTracker:
    def __init__(self, smoothing=0.45):
        self.smoothing = max(0.0, min(1.0, smoothing))
        self.mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.last = {
            "tracking": False,
            "yaw": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "blink": 0.0,
            "mouth": 0.0,
            "timestamp": time.time(),
        }

    @staticmethod
    def _dist(a, b):
        return math.hypot(a.x - b.x, a.y - b.y)

    def _smooth(self, current, previous):
        a = self.smoothing
        return previous + (current - previous) * a

    def process(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.mesh.process(rgb)
        if not result.multi_face_landmarks:
            self.last["tracking"] = False
            self.last["timestamp"] = time.time()
            return self.last

        lm = result.multi_face_landmarks[0].landmark

        left_eye = self._dist(lm[159], lm[145]) / max(self._dist(lm[33], lm[133]), 1e-6)
        right_eye = self._dist(lm[386], lm[374]) / max(self._dist(lm[362], lm[263]), 1e-6)
        blink = max(0.0, min(1.0, 1.0 - ((left_eye + right_eye) * 0.5) / 0.28))

        mouth_ratio = self._dist(lm[13], lm[14]) / max(self._dist(lm[78], lm[308]), 1e-6)
        mouth = max(0.0, min(1.0, (mouth_ratio - 0.04) / 0.18))

        nose = lm[1]
        left_face = lm[234]
        right_face = lm[454]
        face_width = max(right_face.x - left_face.x, 1e-6)

        yaw = max(-1.0, min(1.0, (nose.x - (left_face.x + right_face.x) * 0.5) / (face_width * 0.42)))
        pitch = max(-1.0, min(1.0, (nose.y - (lm[10].y + lm[152].y) * 0.5) / 0.22))
        roll = max(-1.0, min(1.0, math.atan2(
            lm[454].y - lm[234].y,
            lm[454].x - lm[234].x,
        ) / 0.45))

        self.last = {
            "tracking": True,
            "yaw": self._smooth(yaw, self.last["yaw"]),
            "pitch": self._smooth(pitch, self.last["pitch"]),
            "roll": self._smooth(roll, self.last["roll"]),
            "blink": self._smooth(blink, self.last["blink"]),
            "mouth": self._smooth(mouth, self.last["mouth"]),
            "timestamp": time.time(),
        }
        return self.last

    def close(self):
        self.mesh.close()
