try:
    import obsws_python as obs
except ImportError:
    obs = None


class OBSController:
    def __init__(self, host, port, password=""):
        self.host = host
        self.port = port
        self.client = None
        self.error = ""
        if obs is None:
            self.error = "obsws-python no está instalado"
            return
        try:
            self.client = obs.ReqClient(host=host, port=port, password=password, timeout=2)
        except Exception as exc:
            self.error = str(exc)

    def switch_scene(self, scene_name):
        if self.client and scene_name:
            try:
                self.client.set_current_program_scene(scene_name)
                return True
            except Exception as exc:
                self.error = str(exc)
        return False

    def status(self):
        if not self.client:
            return {"connected": False, "error": self.error}
        try:
            self.client.get_version()
            return {"connected": True, "error": ""}
        except Exception as exc:
            self.error = str(exc)
            return {"connected": False, "error": self.error}
