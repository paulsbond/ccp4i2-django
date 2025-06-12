import gemmi
from Bio import SeqIO
from pathlib import Path


def detect_file_type(file_path):
    path = Path(file_path)
    if not path.exists():
        return "File does not exist"

    # Try detecting an MTZ file
    try:
        mtz = gemmi.read_mtz_file(str(path))
        if mtz:  # If it successfully reads, it's an MTZ file
            return "MTZ file"
    except Exception:
        pass

    # Try detecting an mmCIF file
    try:
        cif_block = gemmi.cif.read(str(path))
        if cif_block:  # If it successfully reads, it's an mmCIF file
            return "mmCIF file"
    except Exception:
        pass

    # Try detecting a PDB file
    try:
        pdb_structure = gemmi.read_structure(str(path))
        if pdb_structure:  # If it successfully reads, it's a PDB file
            return "PDB file"
    except Exception:
        pass

    # Try detecting a sequence file (FASTA, PIR, etc.) using BioPython
    try:
        with path.open("r") as handle:
            format_detected = None
            for record in SeqIO.parse(handle, "fasta"):
                format_detected = "FASTA file"
                break
            if format_detected:
                return format_detected
    except Exception:
        pass

    try:
        with path.open("r") as handle:
            format_detected = None
            for record in SeqIO.parse(handle, "pir"):
                format_detected = "PIR file"
                break
            if format_detected:
                return format_detected
    except Exception:
        pass

    return "Unknown file type"


if __name__ == "__main__":
    file_path = input("Enter the file path: ")
    file_type = detect_file_type(file_path)
    print(f"Detected file type: {file_type}")
