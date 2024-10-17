from ...lib.utils import puid, temporary_download


def test_download():
    url = "https://www.ebi.ac.uk/pdbe/entry-files/download/8xfm.cif"
    with temporary_download(url, suffix=".cif") as path:
        assert path.suffix == ".cif"
        assert path.exists()
        assert path.stat().st_size > 0


def test_puid():
    assert len(puid(length=10)) == 10
    assert len(puid(length=20)) == 20
    assert isinstance(puid(), str)
