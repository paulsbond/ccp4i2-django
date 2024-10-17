from contextlib import contextmanager
from os import PathLike
from pathlib import Path
from random import choice
from string import ascii_letters, digits
from tempfile import NamedTemporaryFile
from requests_cache import CachedSession
from ..config.settings import USER_DIR


_CHARS = ascii_letters + digits
_HTTP = CachedSession(USER_DIR / "http-cache")


def download(url: str, path: str | PathLike):
    "Download a file to a path in 1 MB chunks. Downloads are cached."
    response = _HTTP.get(url, allow_redirects=True, stream=True, timeout=30)
    response.raise_for_status()
    with open(path, "wb") as writer:
        for chunk in response.iter_content(chunk_size=1_000_000):
            writer.write(chunk)


def puid(length: int = 10):
    "Probably Unique Identifier"
    return "".join(choice(_CHARS) for _ in range(length))


@contextmanager
def temporary_download(url: str, suffix: str):
    "Download a file to a temporary file and return the path"
    with NamedTemporaryFile(suffix=suffix) as tmp_file:
        download(url, tmp_file.name)
        yield Path(tmp_file.name)
