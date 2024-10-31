from functools import cache


L_PEPTIDE_NAMES = {
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
}

D_PEPTIDE_NAMES = {
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
}

DNA_NAMES = {
    "A": "DA",
    "C": "DC",
    "G": "DG",
    "I": "DI",
    "T": "DT",
    "U": "DU",
    "X": "DN",
}

RNA_NAMES = {
    "A": "A",
    "C": "C",
    "G": "G",
    "I": "I",
    "U": "U",
    "X": "N",
}

ONE_LETTER_CODES = {
    name: code
    for code_names in (L_PEPTIDE_NAMES, D_PEPTIDE_NAMES, DNA_NAMES, RNA_NAMES)
    for code, name in code_names.items()
}


@cache
def code1(resname: str) -> str | None:
    "Returns the one-letter code for a residue name"
    return ONE_LETTER_CODES.get(resname)
