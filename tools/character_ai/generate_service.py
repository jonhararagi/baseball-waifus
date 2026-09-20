import base64
import json
import random
from pathlib import Path

from comfy_client import ComfyClient
from prompt_builder import build_prompt

ROOT = Path(__file__).resolve().parent

class ArtGenerationService:
    def __init__(self, config_path=None):
        cfg_path = Path(config_path) if config_path else ROOT / 'config.json'
        self.config = json.loads(cfg_path.read_text(encoding='utf-8'))
        self.client = ComfyClient(self.config['comfyui_url'], int(self.config.get('output_timeout_seconds', 180)))
        template = ROOT / Path(self.config['workflow_template']).name
        self.template = json.loads(template.read_text(encoding='utf-8'))
        self.output_dir = ROOT / self.config.get('output_dir', 'generated')
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _workflow(self, profile, preset, seed):
        positive, negative = build_prompt(profile, preset)
        workflow = json.loads(json.dumps(self.template))
        replacements = {
            '__MODEL__': self.config['model'],
            '__POSITIVE__': positive,
            '__NEGATIVE__': negative,
            '__WIDTH__': 768,
            '__HEIGHT__': 1152,
            '__SEED__': int(seed),
            '__STEPS__': 28,
            '__CFG__': 6.0,
            '__SAMPLER__': 'euler_ancestral',
            '__SCHEDULER__': 'normal'
        }
        for node in workflow.values():
            if 'inputs' not in node:
                continue
            for key, value in list(node['inputs'].items()):
                if isinstance(value, str) and value in replacements:
                    node['inputs'][key] = replacements[value]
        return workflow

    def generate(self, profile, preset=None, seed=None):
        preset = preset or self.config.get('default_preset', 'baseball_waifus_soft')
        seed = random.randrange(0, 2**63) if seed is None else int(seed)
        workflow = self._workflow(profile, preset, seed)
        queued = self.client.queue(workflow)
        prompt_id = queued['prompt_id']
        image_bytes, content_type = self.client.wait_for_image(prompt_id, float(self.config.get('poll_interval_seconds', 1.0)))
        suffix = '.jpg' if 'jpeg' in content_type else '.png'
        filename = f'character_{seed}{suffix}'
        target = self.output_dir / filename
        target.write_bytes(image_bytes)
        return {
            'prompt_id': prompt_id,
            'seed': seed,
            'preset': preset,
            'filename': str(target),
            'content_type': content_type,
            'image_base64': base64.b64encode(image_bytes).decode('ascii')
        }