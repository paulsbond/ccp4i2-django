from random import choice
from string import ascii_letters, digits


def puid(length: int = 10) -> str:
    """Probably Unique Identifier"""
    chars = ascii_letters + digits
    return "".join(choice(chars) for _ in range(length))
