import uuid
import os
from ...db import models


def get_directory_tree(path):
    tree = []
    try:
        for entry in os.scandir(path):
            try:
                stats = entry.stat(follow_symlinks=False)
                node = {
                    "path": entry.path,
                    "name": entry.name,
                    "type": "directory" if entry.is_dir() else "file",
                    "size": stats.st_size,
                    "mode": stats.st_mode,
                    "inode": stats.st_ino,
                    "device": stats.st_dev,
                    "nlink": stats.st_nlink,
                    "uid": stats.st_uid,
                    "gid": stats.st_gid,
                    "atime": stats.st_atime,
                    "mtime": stats.st_mtime,
                    "ctime": stats.st_ctime,
                }
                if entry.is_dir():
                    node["contents"] = get_directory_tree(entry.path)
                tree.append(node)
            except Exception as e:
                tree.append({"name": entry.name, "error": str(e)})
    except Exception as e:
        return [{"error": str(e)}]

    return tree


def list_project(the_project_uuid: str):
    the_project = models.Project.objects.get(uuid=uuid.UUID(the_project_uuid))
    return get_directory_tree(str(the_project.directory))
