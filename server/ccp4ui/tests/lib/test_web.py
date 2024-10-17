from ...lib.web import temporary_download


def test_download():
    url = "https://www.ebi.ac.uk/pdbe/entry-files/download/8xfm.cif"
    with temporary_download(url, suffix=".cif") as path:
        assert path.suffix == ".cif"
        assert path.exists()
        assert path.stat().st_size > 0
