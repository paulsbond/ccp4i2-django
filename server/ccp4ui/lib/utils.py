from contextlib import contextmanager
from os import PathLike
from pathlib import Path
from random import choice
from string import ascii_letters, digits
from tempfile import NamedTemporaryFile
import requests
import requests_cache


def download(url: str, path: str | PathLike):
    "Download a file to a path in 1 MB chunks. Downloads are cached for 24 hours."
    requests_cache.install_cache(expire_after=86_400)
    requests_cache.delete(expired=True)
    response = requests.get(url, allow_redirects=True, stream=True, timeout=30)
    response.raise_for_status()
    with open(path, "wb") as writer:
        for chunk in response.iter_content(chunk_size=1_000_000):
            writer.write(chunk)


def puid(length: int = 10):
    "Probably Unique Identifier"
    chars = ascii_letters + digits
    return "".join(choice(chars) for _ in range(length))


@contextmanager
def temporary_download(url: str, suffix: str):
    "Download a file to a temporary file and return the path"
    with NamedTemporaryFile(suffix=suffix) as tmp_file:
        download(url, tmp_file.name)
        yield Path(tmp_file.name)
