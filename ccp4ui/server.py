from multiprocessing import Process
from os import environ
from socket import socket, SOL_SOCKET, SO_REUSEADDR
import time
from blacknoise import BlackNoise
from django.core.asgi import get_asgi_application
import uvicorn
from .config import STATIC_DIR


class Server:
    def __init__(self):
        self._process = None

    def start(self) -> str:
        """
        Finds an unused localhost port,
        starts the Django application
        using a Uvicorn server (in a background process)
        and returns the URL served.
        """
        # Get Django ASGI app with BlackNoise for static files
        environ["DJANGO_SETTINGS_MODULE"] = "ccp4ui.config.settings"
        application = BlackNoise(get_asgi_application())
        application.add(STATIC_DIR, "/static")

        # Django changes the time zone to UTC
        original_tz = environ.get("TZ", None)

        # Find an available port
        sock = socket()
        sock.bind(("localhost", 0))
        sock.setsockopt(SOL_SOCKET, SO_REUSEADDR, 1)
        host, port = sock.getsockname()

        # Start Uvicorn server
        config = uvicorn.Config(
            app=application,
            host=host,
            port=port,
            log_config=None,
        )
        server = uvicorn.Server(config)
        self._process = Process(target=server.run)
        self._process.start()

        # Reset time zone
        if original_tz is None:
            environ.pop("TZ", None)
        else:
            environ["TZ"] = original_tz
        if hasattr(time, "tzset"):
            time.tzset()

        return f"http://{host}:{port}/"

    def stop(self):
        """Terminates the server process"""
        if self._process is not None:
            self._process.terminate()
