from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from requests_cache import CachedSession
from ..config.settings import USER_DIR


_SESSION = CachedSession(USER_DIR / "http-cache")


@contextmanager
def download(url: str, suffix: str):
    response = _SESSION.get(url, allow_redirects=True, stream=True, timeout=30)
    response.raise_for_status()
    with NamedTemporaryFile(suffix=suffix) as tmp_file:
        with open(tmp_file.name, "wb") as writer:
            for chunk in response.iter_content(chunk_size=1_000_000):
                writer.write(chunk)
        yield Path(tmp_file.name)


@contextmanager
def fasta(code: str):
    url = f"https://www.ebi.ac.uk/pdbe/entry/pdb/{code}/fasta"
    with download(url, suffix=".fasta") as path:
        yield path


@contextmanager
def pdb_mmcif(code: str):
    url = f"https://www.ebi.ac.uk/pdbe/entry-files/download/{code}.cif"
    with download(url, suffix=".cif") as path:
        yield path


@contextmanager
def pdb_sfcif(code: str):
    url = f"https://www.ebi.ac.uk/pdbe/entry-files/download/r{code}sf.ent"
    with download(url, suffix=".cif") as path:
        yield path


@contextmanager
def redo_cif(code: str):
    url = f"https://pdb-redo.eu/db/{code}/{code}_final.cif"
    with download(url, suffix=".cif") as path:
        yield path


@contextmanager
def redo_mtz(code: str):
    url = f"https://pdb-redo.eu/db/{code}/{code}_final.mtz"
    with download(url, suffix=".mtz") as path:
        yield path
