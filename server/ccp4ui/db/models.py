from uuid import uuid4
from django.db.models import (
    CASCADE,
    DateTimeField,
    FileField,
    ForeignKey,
    Model,
    TextField,
    UUIDField,
)
from django.utils import timezone


class Project(Model):
    uuid = UUIDField(default=uuid4, unique=True)
    name = TextField(default="Untitled Project")
    created = DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.id} {self.name}"


class File(Model):
    project = ForeignKey(Project, on_delete=CASCADE, related_name="files")
    file = FileField()

    def __str__(self):
        return f"{self.id} {self.file.name}"
