from logging.config import dictConfig
from .config import USER_DIR

_LOGS_DIR = USER_DIR / "logs"
_PREFIX = "[%(asctime)s] %(levelprefix)s "
_DATEFMT = "%Y-%m-%d %H:%M:%S UTC"
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "uvicorn": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": _PREFIX + "%(message)s",
            "datefmt": _DATEFMT,
            "use_colors": False,
        },
        "uvicorn.access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": _PREFIX + '%(client_addr)s - "%(request_line)s" %(status_code)s',
            "datefmt": _DATEFMT,
            "use_colors": False,
        },
    },
    "handlers": {
        "uvicorn": {
            "formatter": "uvicorn",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(_LOGS_DIR / "server.log"),
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 1,
        },
        "uvicorn.access": {
            "formatter": "uvicorn.access",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(_LOGS_DIR / "server.log"),
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 1,
        },
    },
    "loggers": {
        "uvicorn": {
            "handlers": ["uvicorn"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": ["uvicorn.access"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn.error": {
            "level": "INFO",
        },
    },
}


def configure_logging():
    _LOGS_DIR.mkdir(parents=True, exist_ok=True)
    dictConfig(LOGGING_CONFIG)
