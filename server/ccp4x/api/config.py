import sys
from pathlib import Path
from django.apps import AppConfig
from ccp4i2.pimple import MGQTmatplotlib

sys.path.append(Path(MGQTmatplotlib.__file__).parent.parent.parent / "ccp4i2")


class ApiConfig(AppConfig):
    name = "ccp4x.api"
