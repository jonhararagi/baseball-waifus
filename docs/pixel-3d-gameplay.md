# Baseball Waifus - Pixel 3D Gameplay

## Purpose

The flat 2D character artwork is reserved for cards, roster, collection and character-profile presentation. Match gameplay uses a separate 3D representation.

## Architecture

PlayerData -> PlayerAvatarAdapter -> AvatarProfile -> Player3DAvatarAdapter -> Pixel3DBaseballCharacter

The 3D layer is presentation-only. It never resolves:
- contact;
- defense;
- runners;
- rewards;
- gacha;
- charm;
- statistics.

## Prototype model

The prototype is generated from Godot 3D primitives with:
- low-poly silhouettes;
- unshaded materials;
- nearest texture filtering;
- modular body parts;
- separate bat pivot;
- separate limbs;
- deterministic construction.

No third-party art assets are required.

## Animation actions

Pixel3DBattingController supports:
- READY
- LOAD
- SWING
- FOLLOW_THROUGH
- RUN
- SLIDE
- CATCH
- THROW
- CELEBRATE
- DEFEAT

The batting sequence is intentionally staged as:

READY -> LOAD -> SWING -> CONTACT/FOLLOW_THROUGH

Gameplay events can call the same controller without allowing the animation to determine the baseball result.

## Ball presentation

Pixel3DBallPresenter receives origin, destination and duration from the presentation/event layer and interpolates the ball. The ball does not calculate whether the play is a hit, out or error.

## Current status

Implemented:
- procedural 3D character;
- PlayerData-compatible adapter;
- batting animation state machine;
- ball trajectory presenter;
- field test scene;
- gameplay sequence test scene.

Pending:
- production-quality 3D models for the 30-character roster;
- full 3D field positions;
- event bus connection for every baseball event;
- production animation clips;
- camera choreography;
- final materials, textures, lighting and VFX;
- runtime validation in Godot.


## Actualización visual v2

El prototipo 3D dejó de utilizar exclusivamente cajas primitivas. `Pixel3DBaseballCharacter` conserva el mismo contrato, pero construye una figura anime deportiva modular con cabeza, cabello, ojos, uniforme, falda, brazos, piernas, calzado, bate y gorra. El cambio es exclusivamente de presentación.

El stage añade iluminación de prueba y acepta payloads de trayectoria para que la pelota siga siendo una representación de eventos ya resueltos.

El objetivo final continúa siendo sustituir la geometría procedural por modelos 3D de producción sin tocar PlayerData, AvatarProfile, resolvers ni GameState.
