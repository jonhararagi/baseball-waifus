from __future__ import annotations

from typing import Protocol

from synthetic_tracker import SyntheticFaceTracker
from tracker import FaceTracker


class TrackingProvider(Protocol):
    name: str

    def process(self, frame=None) -> dict:
        ...

    def close(self) -> None:
        ...


class SyntheticTrackingProvider(SyntheticFaceTracker):
    name = "synthetic"


class MediaPipeTrackingProvider(FaceTracker):
    name = "mediapipe"


def create_tracking_provider(synthetic: bool, smoothing: float = 0.45) -> tuple[TrackingProvider, bool]:
    """Create the selected tracking backend without changing the transport contract."""
    if synthetic:
        return SyntheticTrackingProvider(smoothing), True
    return MediaPipeTrackingProvider(smoothing), False
