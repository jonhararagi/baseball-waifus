# Avatar Renderer Contract

## Objetivo

El juego no debe conocer si una jugadora utiliza:

- AnimeAvatar2D procedural;
- un rig 2D externo;
- Inochi2D;
- Live2D;
- VRM/Three.js.

La identidad de la jugadora sigue viviendo en AvatarProfile.

## Contrato

AvatarRendererFactory.create(profile, position, order) es el punto único para seleccionar renderer.

Por defecto:

AvatarProfile -> AnimeAvatar2D

Cuando art_style = rig y rig_scene_path apunta a una escena existente:

AvatarProfile -> ExternalRigAvatar2D -> rig scene

El rig externo puede exponer opcionalmente set_pose(pose_id) y apply_tracking(tracking_dictionary).

Esto permite conectar posteriormente un wrapper de Inochi2D, Live2D o un Node3D/VRM sin modificar BaseballSimulator, BaseballGameState, FieldingResolver o RunnerSystem.

## Estado

Implementado:

- ruta procedural estable;
- campo rig_scene_path persistente;
- factory única;
- adaptador externo funcional con fallback procedural.

Pendiente:

- asset artístico definitivo;
- binding real de deformaciones;
- integración concreta Inochi2D/Live2D/VRM;
- pruebas de performance y lip-sync.

## Regla

El gameplay nunca debe importar una librería de rigging. Solo el adaptador visual puede hacerlo.
