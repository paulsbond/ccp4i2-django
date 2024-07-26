from uuid import uuid4
from django.db.models import DateTimeField, Model, TextField, UUIDField
from django.utils import timezone


class Project(Model):
    uuid = UUIDField(default=uuid4, editable=False)
    name = TextField(default="Untitled Project")
    created = DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return self.name
