try:
    import obsws_python as obs
except ImportError:
    obs = None

class OBSController:
    def __init__(self, host, port, password=""):
        self.client = None
        if obs is not None:
            try:
                self.client = obs.ReqClient(host=host, port=port, password=password, timeout=2)
            except Exception:
                self.client = None

    def switch_scene(self, scene_name):
        if self.client and scene_name:
            self.client.set_current_program_scene(scene_name)

    def status(self):
        if not self.client:
            return {"connected": False}
        try:
            self.client.get_version()
            return {"connected": True}
        except Exception:
            return {"connected": False}
