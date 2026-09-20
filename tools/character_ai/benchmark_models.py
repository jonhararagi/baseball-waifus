import json
from pathlib import Path

from generate_service import ArtGenerationService

ROOT = Path(__file__).resolve().parent
BENCHMARK = json.loads((ROOT / 'benchmark_models.json').read_text(encoding='utf-8'))

PROFILE = {
    'display_name': 'Benchmark Player',
    'body_preset': 'shonen_soft',
    'art_style': 'ecchi',
    'hair_style': 'ponytail',
    'uniform_style': 'standard',
    'face_style': 'soft',
    'height': 1.0,
    'shoulder_width': 1.02,
    'waist_width': 0.88,
    'hip_width': 1.12,
    'bust': 1.08,
    'head_scale': 1.0
}

def main():
    service = ArtGenerationService(ROOT / 'config.json')
    original_model = service.config['model']
    base_seed = int(BENCHMARK.get('seed', 424242))
    output = ROOT / 'generated' / 'benchmark'
    output.mkdir(parents=True, exist_ok=True)

    for index, entry in enumerate(BENCHMARK.get('models', [])):
        checkpoint = entry.get('checkpoint', '')
        if not checkpoint or checkpoint.startswith('YOUR_'):
            print(f"SKIP {entry.get('id', index)}: configure checkpoint")
            continue
        service.config['model'] = checkpoint
        seed = base_seed + index
        try:
            result = service.generate(PROFILE, BENCHMARK.get('preset'), seed)
            src = Path(result['filename'])
            target = output / f"{entry.get('id', index)}_{seed}{src.suffix}"
            src.replace(target)
            print(f"OK {entry.get('id', index)} -> {target}")
        except Exception as exc:
            print(f"FAIL {entry.get('id', index)}: {exc}")

    service.config['model'] = original_model

if __name__ == '__main__':
    main()