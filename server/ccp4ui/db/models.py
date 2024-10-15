from uuid import uuid4
from django.conf import settings
from django.db.models import (
    BigIntegerField,
    CASCADE,
    DateTimeField,
    FileField,
    ForeignKey,
    Model,
    TextField,
    UUIDField,
)
from django.utils import timezone
from ..lib.utils import puid


class Project(Model):
    uuid = UUIDField(default=uuid4, unique=True)
    name = TextField(default="Untitled Project")
    created = DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.id} {self.name}"


def import_path(instance, filename):
    path = f"{instance.project.id}/imports/{puid()}/{filename}"
    while (settings.MEDIA_ROOT / path).exists():
        path = f"{instance.project.id}/imports/{puid()}/{filename}"
    return path


class File(Model):
    project = ForeignKey(Project, on_delete=CASCADE, related_name="files")
    uuid = UUIDField(default=uuid4, unique=True)
    file = FileField(upload_to=import_path)
    name = TextField()
    size = BigIntegerField()

    def save(self, *args, **kwargs):
        self.name = self.file.name
        self.size = self.file.size
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} {self.file.name}"
