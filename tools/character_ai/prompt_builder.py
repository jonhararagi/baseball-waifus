import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PRESETS = json.loads((ROOT / 'style_presets.json').read_text(encoding='utf-8'))

def build_prompt(profile: dict, preset_name: str = 'baseball_waifus_soft') -> tuple[str, str]:
    preset = PRESETS.get(preset_name, PRESETS['baseball_waifus_soft'])
    body = profile.get('body_preset', 'balanced')
    hair = profile.get('hair_style', 'long')
    uniform = profile.get('uniform_style', 'standard')
    face = profile.get('face_style', 'soft')
    height = profile.get('height', 1.0)
    shoulders = profile.get('shoulder_width', 1.0)
    waist = profile.get('waist_width', 0.9)
    hips = profile.get('hip_width', 1.0)
    bust = profile.get('bust', 1.0)
    head = profile.get('head_scale', 1.0)
    display_name = profile.get('display_name', 'Baseball Waifu')
    body_language = {
        preset['positive'],
        f'character name {display_name}',
        body_language,
        f'body preset {body}',
        f'hair style {hair}',
        f'uniform style {uniform}',
        f'face style {face}',
        f'height proportion {height:.2f}',
        f'shoulder proportion {shoulders:.2f}',
        f'waist proportion {waist:.2f}',
        f'hip proportion {hips:.2f}',
        f'bust proportion {bust:.2f}',
        f'head proportion {head:.2f}',
        'adult character, original game character, no franchise imitation'
    ])
    return positive, preset['negative']