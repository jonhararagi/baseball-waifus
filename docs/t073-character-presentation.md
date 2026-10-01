# T073 · Character Presentation / Locker Production Slice

## Finding

`assets/production/presentation/bw001--profile.svg` already exists and is the same profile/hero asset used by Character Detail for Aiko. Locker reuses that existing path through the Character Detail → Locker handoff.

## Locker integration

Locker keeps its existing canvas for background, labels and interaction hit-testing. When the production presentation asset is active, the procedural character body is not drawn. The existing production profile image is layered over the stage with pointer events disabled, preserving tap interaction and the existing rapport/reaction/navigation behavior.

Changing active characters clears the presentation URL so a previous character asset cannot persist into a new Locker context.

## Expression assets

The five Aiko expression files already existed under `assets/characters/expressions/`: neutral, focus, happy, surprised and determined. T072's 404s were a publication gap because the Pages build did not copy that directory into `site/`. T073 copies the existing expression files during site preparation. No artwork was generated.

## Voice

No Aiko production voice file was added. The existing reaction voice hook remains unchanged. Real audio playback remains NOT_READY / NOT_RUN when the production file is absent.

## Browser proof

The existing Chrome/CDP infrastructure is reused. T073 runs the same real-browser journey and additionally verifies the five expression images loaded in Chrome, the Aiko production profile loaded visibly in Locker, and the procedural character body is suppressed while the production asset is active. It also verifies rapport/reaction continuity and Locker → Character Detail identity continuity.

Human clickthrough is a separate evidence class and is not claimed.
