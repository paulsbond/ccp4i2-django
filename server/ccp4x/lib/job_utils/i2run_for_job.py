from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4Data import CList
from ccp4i2.core.CCP4Data import CData
from ccp4i2.core.CCP4File import CDataFile
from core import CCP4File
from core import CCP4Data
from core import CCP4Container

from ...db import models
from .get_job_container import get_job_container
from .find_objects import find_objects


def i2run_for_job(job: models.Job):
    container = get_job_container(job)
    if not container:
        return None
    command: str = f"i2run {job.task_name} --project_name {job.project.name}"
    for child in container.children():
        if isinstance(child, (CCP4Container.CContainer, CContainer)):
            if child.objectName() not in [
                "outputData",
                "guiAdmin",
                "guiControls",
                "patchSelection",
                "guiParameters",
                "temporary",
            ]:
                command = extend_i2run(command, child, container)
    return command


def minimal_path(full_path, container: CCP4Container) -> str:
    """
    Get the minimal unique path of a container relative to another container.
    Starts with the last element and adds path elements until the path is unique.
    """
    full_parts = full_path.split(".")

    # First, try to get relative path from container
    container_parts = container.objectPath().split(".")
    if full_parts[: len(container_parts)] == container_parts:
        relative_parts = full_parts[len(container_parts) :]
    else:
        relative_parts = full_parts

    if not relative_parts:
        return ""

    # Start with the last element and gradually add more elements
    for i in range(1, len(relative_parts) + 1):
        # Take the last i elements
        candidate_path_parts = relative_parts[-i:]
        candidate_path = ".".join(candidate_path_parts)

        # Test if this path is unique within the container
        if _is_path_unique(candidate_path, container, full_path):
            return candidate_path

    # If no unique shorter path found, return the full relative path
    return ".".join(relative_parts)


def _is_list(object: CData) -> bool:
    return isinstance(object, (CList, CCP4Data.CList, list))


def _is_leaf(object: CData) -> bool:
    """
    Return True if the object is a leaf node.

    A leaf node is one that either:
    1. Has no children() method, or
    2. Has a children() method that returns items where all children themselves
       have no children() method or have empty children()
    """
    # Check if object has children method
    if not hasattr(object, "children"):
        return True

    try:
        children = object.children()

        # If no children, it's a leaf
        if not children:
            return True

        # Check if all children are themselves leaves
        for child in children:
            # If child has no children method, it's a leaf child
            if not hasattr(child, "children"):
                continue

            try:
                grandchildren = child.children()
                # If child has non-empty children, then object is not a leaf
                if grandchildren:
                    return False
            except (AttributeError, TypeError):
                # If children() method fails, treat as leaf child
                continue

        # All children are leaves, so this object is a leaf
        return True

    except (AttributeError, TypeError):
        # If children() method fails, treat as leaf
        return True


def _handle_file(element: CData, command: str, container: CCP4Container) -> str:
    command += f" --{minimal_path(element.objectPath(), container)} "
    filteredChildren = [
        child
        for child in element.children()
        if child.objectName() not in ["annotation", "contentFlag", "subType"]
    ]
    for child in filteredChildren:
        if hasattr(child, "isSet") and not child.isSet(allowDefault=False):
            continue
        else:
            command += f'"{child.objectName()}={str(child)}" '

    return command


def extend_i2run(command: str, element: CData, container: CCP4Container) -> str:
    print(f"Handling {element.objectPath()} {_is_leaf(element)} {_is_list(element) }")
    for child in element.children():
        if child.objectName() == "temporary":
            continue
        elif hasattr(child, "isSet") and not child.isSet(allowDefault=False):
            continue
        elif isinstance(
            child,
            (
                CCP4Container.CContainer,
                CContainer,
            ),
        ):
            command = extend_i2run(command, child, container)
        elif isinstance(
            child,
            (
                CCP4File.CDataFile,
                CDataFile,
            ),
        ):
            command = _handle_file(child, command, container)

        elif isinstance(child, (CCP4Data.CList, CList, list)):
            for grandchild in child:
                print(
                    f"Handling list child {grandchild.objectPath()} {_is_leaf(grandchild)} {_is_list(grandchild) }"
                )
                command += extend_i2run(command, grandchild, container)

        else:
            command += f" --{minimal_path(child.objectPath(), container)} {str(child)} {len(child.children())}"

    return command


def _is_path_unique(candidate_path, container, full_path):
    return (
        candidate_path == full_path
        or len(
            find_objects(
                container,
                lambda x: x.objectPath().endswith(f".{candidate_path}"),
                multiple=True,
            )
        )
        == 1
    )
