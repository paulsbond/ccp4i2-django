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
    uuid = UUIDField(default=uuid4)
    name = TextField(default="Untitled Project")
    created = DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return self.name


class ImportedFile(Model):
    project = ForeignKey(Project, on_delete=CASCADE, related_name="imported_files")
    file = FileField()

    def __str__(self):
        return self.file.name
