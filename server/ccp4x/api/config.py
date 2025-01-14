import sys
import pathlib
from django.apps import AppConfig
from ccp4i2.pimple import MGQTmatplotlib

sys.path.append(str(pathlib.Path(MGQTmatplotlib.__file__).parent.parent))


class ApiConfig(AppConfig):
    name = "ccp4x.api"
