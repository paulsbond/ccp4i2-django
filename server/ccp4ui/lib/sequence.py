from functools import cache


class SequenceType:
    def __init__(self, name: str, codes: dict[str, str]):
        self.name = name
        self.codes = codes

    def parse(self, sequence: str) -> list[str]:
        "Parse a string of one-letter codes to a list of residue names"
        names = []
        for code in sequence.strip().strip("-*"):
            if code in {" ", "-"}:
                continue
            if code not in self.codes:
                raise ValueError(f"'{code}' is not a valid {self.name} code")
            names.append(self.codes[code])
        return names


L_PEPTIDE = SequenceType(
    "L-Peptide",
    {
        "A": "ALA",
        "B": "ASX",
        "C": "CYS",
        "D": "ASP",
        "E": "GLU",
        "F": "PHE",
        "G": "GLY",
        "H": "HIS",
        "I": "ILE",
        "K": "LYS",
        "L": "LEU",
        "M": "MET",
        "N": "ASN",
        "O": "PYL",
        "P": "PRO",
        "Q": "GLN",
        "R": "ARG",
        "S": "SER",
        "T": "THR",
        "U": "SEC",
        "V": "VAL",
        "W": "TRP",
        "X": "UNK",
        "Y": "TYR",
        "Z": "GLX",
    },
)

D_PEPTIDE = SequenceType(
    "D-Peptide",
    {
        "A": "DAL",
        "C": "DCY",
        "D": "DAS",
        "E": "DGL",
        "F": "DPN",
        "G": "GLY",
        "H": "DHI",
        "I": "DIL",
        "K": "DLY",
        "L": "DLE",
        "M": "MED",
        "N": "DSG",
        "P": "DPR",
        "Q": "DGN",
        "R": "DAR",
        "S": "DSN",
        "T": "DTH",
        "V": "DVA",
        "W": "DTR",
        "Y": "DTY",
    },
)

DNA = SequenceType(
    "DNA",
    {
        "A": "DA",
        "C": "DC",
        "G": "DG",
        "I": "DI",
        "T": "DT",
        "U": "DU",
        "X": "DN",
    },
)

RNA = SequenceType(
    "RNA",
    {
        "A": "A",
        "C": "C",
        "G": "G",
        "I": "I",
        "U": "U",
        "X": "N",
    },
)

ONE_LETTER_CODES = {
    name: code
    for sequence_type in (L_PEPTIDE, D_PEPTIDE, DNA, RNA)
    for code, name in sequence_type.codes.items()
}


@cache
def code1(resname: str) -> str | None:
    "Returns the one-letter code for a residue name"
    return ONE_LETTER_CODES.get(resname)
