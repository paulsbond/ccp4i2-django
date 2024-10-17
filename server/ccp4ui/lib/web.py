from contextlib import contextmanager
from os import PathLike
from pathlib import Path
from tempfile import NamedTemporaryFile
from requests_cache import CachedSession
from ..config.settings import USER_DIR


_SESSION = CachedSession(USER_DIR / "http-cache")
_PDBE = "https://www.ebi.ac.uk/pdbe"


def download(url: str, path: str | PathLike):
    "Download a file to a path in 1 MB chunks. Downloads are cached."
    response = _SESSION.get(url, allow_redirects=True, stream=True, timeout=30)
    response.raise_for_status()
    with open(path, "wb") as writer:
        for chunk in response.iter_content(chunk_size=1_000_000):
            writer.write(chunk)


@contextmanager
def temporary_download(url: str, suffix: str):
    "Download a file to a temporary file and return the path"
    with NamedTemporaryFile(suffix=suffix) as tmp_file:
        download(url, tmp_file.name)
        yield Path(tmp_file.name)


def fasta(code: str):
    return f"{_PDBE}/entry/pdb/{code}/fasta"


def mmcif(code: str):
    return f"{_PDBE}/entry-files/download/{code}.cif"


def sfcif(code: str):
    return f"{_PDBE}/entry-files/download/r{code}sf.ent"
