from os import PathLike
import gemmi


def parse(path: str | PathLike):
    path = str(path)
    errors = {}
    try:
        return gemmi.read_mtz_file(path)
    except RuntimeError as error:
        errors["MTZ"] = error
    try:
        return gemmi.read_structure(path, format=gemmi.CoorFormat.Mmjson)
    except RuntimeError as error:
        errors["mmJSON"] = error
    try:
        structure = gemmi.read_structure(path, format=gemmi.CoorFormat.Mmcif)
        if valid_structure(structure):
            return structure
        errors["mmCIF"] = "No atoms in the file"
    except ValueError as error:
        errors["mmCIF"] = error
    try:
        structure = gemmi.read_structure(path, format=gemmi.CoorFormat.Pdb)
        if valid_structure(structure):
            return structure
        errors["PDB"] = "No atoms in the file"
    except RuntimeError as error:
        errors["PDB"] = error
    try:
        doc = gemmi.cif.read(path)
        return gemmi.as_refln_blocks(doc)
    except ValueError as error:
        errors["sfCIF"] = error
    try:
        with open(path, encoding="ascii") as f:
            fasta_str = f.read()
        return gemmi.read_pir_or_fasta(fasta_str)
    except RuntimeError as error:
        errors["FASTA"] = error
    return errors


def valid_structure(structure: gemmi.Structure):
    for model in structure:
        if any(model.all()):
            return True
    return False
