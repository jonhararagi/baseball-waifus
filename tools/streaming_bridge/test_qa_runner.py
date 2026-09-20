import unittest
import tempfile
from pathlib import Path

from qa_runner import QARunner


class QARunnerTests(unittest.TestCase):
    def test_starts_and_reports_successful_command(self):
        with tempfile.TemporaryDirectory() as directory:
            runner = QARunner(Path(directory))
            runner._command = [
                __import__("sys").executable,
                "-c",
                "print('qa-ok')",
            ]
            result = runner.start()
            self.assertTrue(result["ok"])

            import time
            deadline = time.time() + 3.0
            while time.time() < deadline and runner.status()["running"]:
                time.sleep(0.01)

            status = runner.status()
            self.assertFalse(status["running"])
            self.assertEqual(status["exit_code"], 0)
            self.assertTrue(status["passed"])
            self.assertIn("qa-ok", status["output"])

    def test_rejects_concurrent_run(self):
        with tempfile.TemporaryDirectory() as directory:
            runner = QARunner(Path(directory))
            runner._command = [
                __import__("sys").executable,
                "-c",
                "import time; time.sleep(0.2)",
            ]
            first = runner.start()
            second = runner.start()
            self.assertTrue(first["ok"])
            self.assertFalse(second["ok"])
            self.assertEqual(second["error"], "qa_already_running")


if __name__ == "__main__":
    unittest.main()
