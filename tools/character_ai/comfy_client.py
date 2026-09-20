import json
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

class ComfyClient:
    def __init__(self, base_url: str, timeout: int = 180):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

    def _request(self, method, path, data=None):
        url = self.base_url + path
        body = None if data is None else json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=body, method=method)
        if body is not None:
            req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req, timeout=10) as response:
            raw = response.read()
            return json.loads(raw.decode('utf-8')) if raw else {}

    def health(self):
        try:
            self._request('GET', '/system_stats')
            return True
        except Exception:
            return False

    def queue(self, workflow: dict, client_id=None):
        payload = {'prompt': workflow, 'client_id': client_id or str(uuid.uuid4())}
        return self._request('POST', '/prompt', payload)

    def wait_for_image(self, prompt_id: str, poll_interval=1.0):
        started = time.time()
        while time.time() - started < self.timeout:
            history = self._request('GET', '/history/' + urllib.parse.quote(prompt_id))
            job = history.get(prompt_id)
            if job and job.get('outputs'):
                for node in job['outputs'].values():
                    for image in node.get('images', []):
                        return self.download_image(image['filename'], image.get('subfolder', ''), image.get('type', 'output'))
            time.sleep(poll_interval)
        raise TimeoutError('ComfyUI generation timed out')

    def download_image(self, filename, subfolder='', image_type='output'):
        query = urllib.parse.urlencode({'filename': filename, 'subfolder': subfolder, 'type': image_type})
        req = urllib.request.Request(self.base_url + '/view?' + query, method='GET')
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.read(), response.headers.get('Content-Type', 'image/png')