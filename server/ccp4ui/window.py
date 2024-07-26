from os import environ
from subprocess import call
from .config import BASE_DIR


def open_window(url: str):
    """
    Opens a window to view the URL.
    Blocks until the window is closed.
    """
    environ["CCP4UI_URL"] = url
    call(["electron", str(BASE_DIR / "electron")])
