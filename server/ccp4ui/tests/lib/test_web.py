from ...lib.web import fasta, pdb_mmcif, pdb_sfcif, redo_cif, redo_mtz


def test_fasta():
    with fasta("8xfm") as path:
        assert path.suffix == ".fasta"
        assert path.exists()
        assert path.stat().st_size > 0


def test_pdb_mmcif():
    with pdb_mmcif("8xfm") as path:
        assert path.suffix == ".cif"
        assert path.exists()
        assert path.stat().st_size > 0


def test_pdb_sfcif():
    with pdb_sfcif("8xfm") as path:
        assert path.suffix == ".cif"
        assert path.exists()
        assert path.stat().st_size > 0


def test_redo_cif():
    with redo_cif("1o6a") as path:
        assert path.suffix == ".cif"
        assert path.exists()
        assert path.stat().st_size > 0


def test_redo_mtz():
    with redo_mtz("1o6a") as path:
        assert path.suffix == ".mtz"
        assert path.exists()
        assert path.stat().st_size > 0
