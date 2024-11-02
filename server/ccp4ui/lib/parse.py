from os import PathLike
from pathlib import Path
import re
import gemmi


def parse(path: str | PathLike):
    path = str(path)
    name = Path(path).name
    suffix = Path(path).suffix
    if suffix == ".mtz":
        return gemmi.read_mtz_file(path)
    if suffix in {".fasta", ".pir"}:
        with open(path, encoding="utf-8") as text:
            return gemmi.read_pir_or_fasta(text.read())
    if suffix == ".pdb" or re.search(r"pdb[A-z0-9]{4}\.ent", name):
        return gemmi.read_structure(path, format=gemmi.CoorFormat.Pdb)
    if suffix == ".cif":
        return gemmi.read_structure(path, format=gemmi.CoorFormat.Mmcif)
    if re.search(r"r[A-z0-9]{4}sf\.ent", name):
        return gemmi.as_refln_blocks(gemmi.cif.read(path))
    raise ValueError(f"Unknown file format: {name}")


def valid_structure(structure: gemmi.Structure):
    for model in structure:
        if any(model.all()):
            return True
    return False
