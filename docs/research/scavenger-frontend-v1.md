# SCAVENGER frontend research note v1

Date: 2026-09-21

## Scope

The visual layer was compared against public open-source frontend patterns because the requested target was a cyberpunk / arcade / CRT presentation with a low-overhead Canvas2D implementation.

Live browsing of Qiita and BOOTH is not available in this environment, so no Qiita article or BOOTH asset was imported, copied, or treated as a verified source. The implementation uses native browser APIs and patterns independently implemented in Baseball Waifus.

## Public GitHub references inspected

| Repository | License status | Pattern studied | Decision |
|---|---|---|---|
| AdnaneKhan/Gitarium | License not verified in this pass | GPU-oriented cyberpunk HUD layering and Canvas2D fallback philosophy | Visual/architecture reference only. No code copied. |
| suryanarayanrenjith/SYNX | License not verified in this pass | CRT scanline/vignette composition and cheap layered presentation | Reimplemented with project-owned CSS/Canvas effects. |
| Pixygon/micromachee | License not verified in this pass | Small hidden Canvas surfaces for presentation rendering | Lightweight buffer pattern adopted without copying source. |

## Technical decision

The web combat renderer stays on Canvas2D. Static background and stadium geometry are cached in an in-memory canvas and redrawn only after resize. Dynamic combat state continues to render every animation frame. Impact frames use a second in-memory canvas so RGB-split presentation can be applied only during hit/swing windows.

No external rendering library is introduced.
