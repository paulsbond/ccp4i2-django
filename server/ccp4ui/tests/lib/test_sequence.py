from pytest import mark
from ...lib.sequence import code1


@mark.parametrize(
    ("resname", "expected"),
    [
        ("", None),
        ("A", "A"),
        ("A1LU6", None),
        ("ALA", "A"),
        ("ASX", "B"),
        ("DA", "A"),
        ("DAL", "A"),
        ("DN", "X"),
        ("DU", "U"),
        ("GLX", "Z"),
        ("HOH", None),
        ("I", "I"),
        ("N", "X"),
        ("PYL", "O"),
        ("SEC", "U"),
        ("UNK", "X"),
        ("XXX", None),
    ],
)
def test_code1(resname, expected):
    assert code1(resname) == expected
