"""
ASGI config for ccp4x project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/asgi/
"""

import os

# MINIMAL FIX: Add CCP4 DLL directory for Windows
if os.name == "nt" and hasattr(os, "add_dll_directory"):
    ccp4_dir = os.environ.get("CCP4")
    if ccp4_dir:
        try:
            os.add_dll_directory(os.path.join(ccp4_dir, "bin"))
        except (OSError, AttributeError):
            pass

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ccp4x.config.settings")

application = get_asgi_application()
