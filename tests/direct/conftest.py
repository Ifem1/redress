from pathlib import Path
import os
import tempfile
from gltest.direct.vm import VMContext


CONTRACT = str(Path(__file__).parents[2] / "contract" / "redress.py")


def pytest_configure(config):
    config.addinivalue_line("python_files", "test_*.py")


# gltest 0.29.2 duplicates stdin onto its temporary message file and unlinks
# it before Windows releases that handle. Keep only that disposable temp file
# until process cleanup; this does not alter contract execution.
_unlink = os.unlink


def _windows_gltest_unlink(path, *args, **kwargs):
    try:
        return _unlink(path, *args, **kwargs)
    except PermissionError:
        if str(path).startswith(tempfile.gettempdir()):
            return None
        raise


os.unlink = _windows_gltest_unlink

_warp = VMContext.warp


def _warp_with_message_datetime(self, timestamp):
    _warp(self, timestamp)
    try:
        import genlayer.gl as gl
        if isinstance(getattr(gl, "message_raw", None), dict):
            gl.message_raw["datetime"] = timestamp
    except ImportError:
        pass


VMContext.warp = _warp_with_message_datetime
