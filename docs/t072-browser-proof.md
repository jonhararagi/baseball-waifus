# T072 · Browser Proof Infrastructure

T072 requires real browser evidence. The repository did not contain Playwright, Puppeteer, a dedicated Chromium runner, or another browser automation framework.

The minimal isolated mechanism added for this task uses the system-installed Chrome/Chromium binary with Chrome DevTools Protocol (CDP). It runs inside the existing GitHub Pages deployment workflow after the static site is prepared, so it validates the same built site that the Pages job is about to deploy.

The probe:
- starts an ephemeral local HTTP server for `site/`;
- launches a fresh browser profile;
- performs real mouse events against the rendered DOM through CDP;
- never injects `ADD_CHARACTER`, starter fixtures, or direct ownership mutations;
- verifies the T071 STARTER state through product runtime state and rendered DOM;
- follows Home → Character Detail → Story → ARC0 → Skip/Complete → Locker → Character Detail → Home;
- observes the Aiko `REACTION_SKIP.mp3` request separately from actual audio playback;
- captures Home, Character Detail, Story, and Locker screenshots;
- writes JSON evidence under `browser-evidence/T072/<sha>/<run-id>/`;
- treats same-origin page exceptions as blocking failures.

No gameplay, PlayerMeta schema, Gacha rates/pity, economy, shop, Telegram Stars, combat, Timing Ring, Student 4v4, Kytos, collection redesign, or character production assets are changed by the probe.

The Locker presentation is intentionally observed rather than redesigned. Its current UI is a procedural canvas, so the existing production character asset gap is recorded as a presentation follow-up when the browser confirms it.

Human clickthrough is a separate evidence class and is not represented by this automation.
