from random import choice
from string import ascii_letters, digits
import uuid


_CHARS = ascii_letters + digits


def puid(length: int = 10):
    "Probably Unique Identifier"
    return "".join(choice(_CHARS) for _ in range(length))


def generate_uuid4_no_hyphens():
    """
    Generate a UUID4 string without hyphens.

    Returns:
        str: A 32-character string representing a UUID4 without hyphens.
    """
    return str(uuid.uuid4()).replace("-", "")


def uuid_from_no_hyphens(uuid_no_hyphens):
    """
    Convert a UUID string without hyphens back to a UUID object.

    This function takes a 32-character string (representing a UUID without hyphens),
    reintroduces the hyphens at the standard positions, and converts it into a UUID object.

    Args:
        uuid_no_hyphens (str): A 32-character string representing the UUID without hyphens.

    Returns:
        uuid.UUID: The corresponding UUID object.

    Raises:
        ValueError: If the input string is not 32 characters long.
    """
    if len(uuid_no_hyphens) != 32:
        raise ValueError("Invalid UUID format. Expected a 32-character string.")
    hyphenated_uuid = f"{uuid_no_hyphens[:8]}-{uuid_no_hyphens[8:12]}-{uuid_no_hyphens[12:16]}-{uuid_no_hyphens[16:20]}-{uuid_no_hyphens[20:]}"
    return uuid.UUID(hyphenated_uuid)
