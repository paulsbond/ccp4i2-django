"Tests for the parse module"

import gemmi
from pytest import mark
from ...lib.web import (
    download,
    pdbe_fasta,
    pdbe_mmcif,
    pdbe_pdb,
    pdbe_sfcif,
    redo_cif,
    redo_mtz,
    redo_pdb,
)
from ...lib.parse import parse


@mark.parametrize(
    ("url", "cls"),
    [
        (pdbe_fasta, list),
        (pdbe_mmcif, gemmi.Structure),
        (pdbe_pdb, gemmi.Structure),
        (pdbe_sfcif, gemmi.ReflnBlocks),
        (redo_cif, gemmi.Structure),
        (redo_mtz, gemmi.Mtz),
        (redo_pdb, gemmi.Structure),
    ],
)
def test_parse(url, cls):
    with download(url("1o6a")) as path:
        parsed = parse(path)
    message = f"File was not parsed as {cls}."
    if isinstance(parsed, dict):
        for format_, error in parsed.items():
            message += f"\n{format_}: {error}"
    assert isinstance(parsed, cls), message
