# Approved Character Art

This directory is the production source of truth for runtime-approved character primary art.

Contract:

- One primary production asset per character: `bw001.png`, `bw002.png`, etc.
- PNG with transparency, PNG with white background, and JPG/JPEG with white background are accepted production inputs. T074 does not destructively process artwork.
- Do not commit procedural/generated placeholder art here and do not rename generated art into this directory.
- A character is APPROVED only when the real asset is physically present in this directory and its entry exists in `manifest.json` with `status: APPROVED`.
- Local browser selection never writes to this directory and never changes the manifest.

For the first Aiko production asset, the expected contract is `assets/characters/approved/bw001.png`.

Do not create that file until the real final Aiko artwork is supplied and reviewed.
