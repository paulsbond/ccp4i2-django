import sys
import pathlib
import os
import importlib.util
import inspect
import logging
from typing import Dict, Any, Type

from ccp4i2.googlecode import diff_match_patch_py3

sys.path.append(str(pathlib.Path(diff_match_patch_py3.__file__).parent.parent))
from core import CCP4PluginScript
from ccp4i2.core.CCP4PluginScript import CPluginScript

TASKATTRIBUTES = [
    "COMTEMPLATE",
    "COMTEMPLATEFILE",
    "TASKMODULE",
    "TASKTITLE",
    "TASKNAME",
    "TASKVERSION",
    "WHATNEXT",
    "ASYNCHRONOUS",
    "TIMEOUT_PERIOD",
    "MAXNJOBS",
    "PERFORMANCECLASS",
    "SUBTASKS",
    "RUNEXTERNALPROCESS",
    "PURGESEARCHLIST",
    "ERROR_CODES",
]


def setup_logger() -> logging.Logger:
    logger = logging.getLogger("build_lookup")
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter("%(levelname)s %(asctime)s %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    logger.setLevel(logging.WARNING)
    return logger


logger = setup_logger()


def is_plugin_script_subclass(obj: Type) -> bool:
    """Return True if obj is a subclass of CPluginScript (by name, robust to import path)."""
    return any(base.__name__.endswith("CPluginScript") for base in obj.__mro__)


def discover_python_files(root_dir: str):
    """Yield (dirpath, filename, fullpath, module_name) for each plugin candidate .py file."""
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d != "__pycache__"]
        for fname in filenames:
            if (
                not fname.endswith(".py")
                or fname.startswith("__")
                or fname == "setup.py"
            ):
                continue
            fpath = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(fpath, root_dir)
            module_name = "ccp4i2." + rel_path[:-3].replace(os.sep, ".")
            yield dirpath, fname, fpath, module_name


def import_module_from_file(module_name: str, fpath: str):
    """Import a module from a file path, returning the module object or None."""
    try:
        spec = importlib.util.spec_from_file_location(module_name, fpath)
        if spec and spec.loader:
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod
        else:
            logger.warning(f"Could not create import spec for {fpath}")
    except Exception as e:
        logger.warning(f"Failed to import {fpath}: {e}")
    return None


def extract_plugin_classes(mod, module_name: str) -> Dict[str, Any]:
    """Return a dict of {task_name: plugin_metadata} for all plugin classes in a module."""
    plugins = {}
    for name, obj in inspect.getmembers(mod, inspect.isclass):
        if obj.__name__ == "CPluginScript":
            continue
        if is_plugin_script_subclass(obj):
            entry = {"module": module_name, "class": name}
            for attr in TASKATTRIBUTES:
                if hasattr(obj, attr):
                    entry[attr] = getattr(obj, attr)
            task_name = getattr(obj, "TASKNAME", None)
            if task_name:
                plugins[task_name] = entry
                logger.debug(f"Registered plugin: {task_name} ({module_name}.{name})")
            else:
                logger.warning(
                    f"Class {name} in {module_name} is a CPluginScript subclass but has no TASKNAME"
                )
    return plugins


def build_lookup_from_dir(root_dir: str) -> Dict[str, Any]:
    """
    Crawl a directory tree, import .py files, and build a lookup mapping
    taskName to plugin class metadata.
    Returns a dict: {taskName: {module, class, attributes...}}
    """
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    lookup = {}
    for _, fname, fpath, module_name in discover_python_files(root_dir):
        logger.debug(f"Scanning file: {fpath}")
        mod = import_module_from_file(module_name, fpath)
        if mod:
            plugins = extract_plugin_classes(mod, module_name)
            lookup.update(plugins)
    return lookup


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python build_lookup.py /path/to/plugins")
        sys.exit(1)
    root_directory = sys.argv[1]
    logger.info(f"Building plugin lookup from: {root_directory}")
    import pprint

    result = build_lookup_from_dir(root_directory)
    pprint.pprint(result)
