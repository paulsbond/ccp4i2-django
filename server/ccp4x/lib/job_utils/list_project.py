import uuid
import os
from ...db import models


def get_directory_tree(path):
    tree = []
    try:
        with os.scandir(path) as entries:
            for entry in entries:
                try:
                    stats = os.lstat(entry.path)
                    node = {
                        "path": os.path.join(path, entry.name),
                        "name": entry.name,
                        "type": (
                            "directory"
                            if entry.is_dir(follow_symlinks=False)
                            else "file"
                        ),
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
                    if entry.is_dir(follow_symlinks=False):
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
