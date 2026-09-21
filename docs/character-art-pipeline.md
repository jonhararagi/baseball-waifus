# Pipeline de arte de los 30 personajes base

## Objetivo

Los 30 personajes de la primera biblioteca son plantillas de producción, no 30 sistemas separados.

La identidad de gameplay y la silueta base quedan fijas en el catálogo JSON.

Las variaciones posteriores permitidas son únicamente:

- color de cabello;
- peinado;
- escala corporal global.

## Flujo

1. CharacterArchetypeCatalog carga el personaje.
2. AvatarProfile se construye desde la plantilla.
3. Una variante modifica solo los tres campos permitidos.
4. tools/character_ai puede convertir el perfil en un prompt.
5. El generador produce una referencia visual.
6. El arte definitivo reemplaza la referencia sin cambiar PlayerData.

## Lenguaje visual

- mujeres adultas;
- anime deportivo original;
- siluetas atléticas legibles;
- variedad corporal realista dentro del estilo;
- uniformes de béisbol;
- colores vivos;
- cel shading limpio;
- expresiones diferenciadas;
- sin chibi ni proporciones infantiles.

## Generación

El generador debe producir primero hojas de roster para comparar coherencia entre personajes y después retratos individuales.

La referencia generada no se convierte automáticamente en asset de producción. Antes de incorporarla al juego se revisa la licencia del proveedor, el modelo utilizado y las condiciones de redistribución.

## Fuente de verdad

game/characters/character_archetypes.json

No editar una ilustración para cambiar estadísticas. Las estadísticas siguen siendo datos de gameplay.
