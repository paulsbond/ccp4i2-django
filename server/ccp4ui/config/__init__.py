from pathlib import Path
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parent.parent
USER_DIR = Path.home().resolve() / ".ccp4ui"
STATIC_DIR = BASE_DIR / "static"


def get_secret_key() -> str:
    path = USER_DIR / "secret-key.txt"
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"{uuid4()}-{uuid4()}")
    with open(path, encoding="utf-8") as f:
        return f.read().strip()
