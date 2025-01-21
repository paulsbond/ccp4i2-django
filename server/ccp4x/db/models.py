from getpass import getuser
from pathlib import Path
from socket import gethostname
from uuid import uuid4

from django.core.validators import RegexValidator
from django.db.models import (
    CASCADE,
    CharField,
    DateTimeField,
    FloatField,
    ForeignKey,
    IntegerChoices,
    IntegerField,
    ManyToManyField,
    Model,
    OneToOneField,
    RESTRICT,
    SET_NULL,
    TextField,
    UniqueConstraint,
    UUIDField,
)
from django.db.models.functions import Lower
from django.utils import timezone


PathCharValidator = RegexValidator(
    regex=r"^[A-z0-9_\-]+$",
    message="Only alphanumeric characters, underscores, and hyphens are allowed.",
)


class Project(Model):
    uuid = UUIDField(default=uuid4, unique=True)
    name = CharField(max_length=100, validators=[PathCharValidator])
    description = TextField(blank=True)
    directory = TextField(unique=True)
    creation_time = DateTimeField(default=timezone.now)
    creation_user = TextField(default=getuser)
    creation_host = TextField(default=gethostname)
    last_access = DateTimeField(default=timezone.now)
    last_job_number = IntegerField(default=0)
    follow_from_job = ForeignKey(
        "Job", SET_NULL, blank=True, null=True, related_name="+"
    )
    i1_project_name = TextField(blank=True)
    i1_project_directory = TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        constaints = [UniqueConstraint(Lower("name"), name="name_unique")]


class ProjectTag(Model):
    parent = ForeignKey("self", CASCADE, blank=True, null=True, related_name="children")
    text = CharField(max_length=50)
    projects = ManyToManyField(Project, related_name="tags")

    class Meta:
        unique_together = ["parent", "text"]

    def __str__(self):
        return self.text


class ProjectExport(Model):
    project = ForeignKey(Project, CASCADE, related_name="exports")
    time = DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.project} at {self.time}"


class ProjectImport(Model):
    project = ForeignKey(Project, CASCADE, related_name="imports")
    time = DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.project} at {self.time}"


class Job(Model):
    class Status(IntegerChoices):
        UNKNOWN = 0, "Unknown"
        PENDING = 1, "Pending"
        QUEUED = 2, "Queued"
        RUNNING = 3, "Running"
        INTERRUPTED = 4, "Interrupted"
        FAILED = 5, "Failed"
        FINISHED = 6, "Finished"
        RUNNING_REMOTELY = 7, "Running remotely"
        FILE_HOLDER = 8, "File holder"
        TO_DELETE = 9, "To delete"
        UNSATISFACTORY = 10, "Unsatisfactory"

    class Evaluation(IntegerChoices):
        UNKNOWN = 0, "Unknown"
        BEST = 1, "Best"
        GOOD = 2, "Good"
        REJECTED = 3, "Rejected"

    uuid = UUIDField(default=uuid4, unique=True)
    project = ForeignKey(Project, CASCADE, related_name="jobs")
    parent = ForeignKey("self", CASCADE, blank=True, null=True, related_name="children")
    number = CharField(max_length=50)  # 1 or 1.1 etc
    title = CharField(max_length=255)
    status = IntegerField(choices=Status.choices, default=Status.UNKNOWN)
    evaluation = IntegerField(choices=Evaluation.choices, default=Evaluation.UNKNOWN)
    comments = TextField(blank=True)
    creation_time = DateTimeField(default=timezone.now)
    finish_time = DateTimeField(blank=True, null=True)
    task_name = CharField(max_length=100)
    process_id = IntegerField(blank=True, null=True)

    class Meta:
        unique_together = ["project", "number"]

    def __str__(self):
        return f"{self.number} {self.title}"

    @property
    def rel_path(self) -> str:
        path_elements = [f"job_{element}" for element in self.number.split(".")]
        return ".".join(path_elements)

    @property
    def directory(self):
        path_elements = [f"job_{element}" for element in self.number.split(".")]
        jobs_dir = Path(self.project.directory) / "CCP4_JOBS"
        return jobs_dir.joinpath(*path_elements)


class ServerJob(Model):
    job = OneToOneField(Job, CASCADE, primary_key=True)
    server_process_id = IntegerField(blank=True, null=True)
    machine = CharField(max_length=255, blank=True)
    username = CharField(max_length=100, blank=True)
    mechanism = CharField(max_length=32, blank=True)
    remote_path = CharField(max_length=255, blank=True)
    custom_code_file = CharField(max_length=255, blank=True)
    validate = CharField(max_length=32, blank=True)
    key_file_name = CharField(max_length=255, blank=True)
    server_group = CharField(max_length=32, blank=True)

    def __str__(self):
        return str(self.job)


class JobValueKey(Model):
    name = CharField(max_length=50, primary_key=True)
    description = TextField()

    def __str__(self):
        return self.name


class JobFloatValue(Model):
    job = ForeignKey(Job, CASCADE, related_name="float_values")
    key = ForeignKey(JobValueKey, CASCADE, related_name="+")
    value = FloatField()

    class Meta:
        unique_together = ["job", "key"]

    def __str__(self):
        return f"{self.job} {self.key} = {self.value}"


class JobCharValue(Model):
    job = ForeignKey(Job, RESTRICT, related_name="char_values")
    key = ForeignKey(JobValueKey, RESTRICT, related_name="+")
    value = CharField(max_length=255)

    class Meta:
        unique_together = ["job", "key"]

    def __str__(self):
        return f"{self.job} {self.key} = {self.value}"


class FileType(Model):
    name = CharField(max_length=50, primary_key=True)
    description = TextField()

    def __str__(self):
        return self.name


class File(Model):
    class Directory(IntegerChoices):
        JOB_DIR = 1, "Job"
        IMPORT_DIR = 2, "Import"

    uuid = UUIDField(default=uuid4, unique=True)
    name = TextField()
    directory = IntegerField(choices=Directory.choices)
    type = ForeignKey(FileType, RESTRICT, related_name="files")
    sub_type = IntegerField(blank=True, null=True)
    content = IntegerField(blank=True, null=True)
    annotation = TextField(blank=True)
    job = ForeignKey(Job, CASCADE, blank=True, null=True, related_name="files")
    job_param_name = CharField(max_length=32, blank=True)

    def __str__(self):
        return self.name

    @property
    def path(self) -> Path:
        if self.directory == File.Directory.JOB_DIR:
            return self.job.directory / self.name
        elif self.directory == File.Directory.IMPORT_DIR:
            return Path(self.job.project.directory) / "CCP4_IMPORTED_FILES"

    @property
    def rel_path(self) -> str:
        if self.directory == File.Directory.JOB_DIR:
            return self.job.rel_path
        if self.directory == File.Directory.IMPORT_DIR:
            return "CCP4_IMPORTED_FILES"
        return ""


class FileExport(Model):
    file = ForeignKey(File, CASCADE, related_name="exports")
    time = DateTimeField(default=timezone.now)
    name = TextField()

    def __str__(self):
        return f"{self.name} at {self.time}"


class FileImport(Model):
    # MN: Note this has dropped fields annotation lastmodifiedtime importnumber
    file = OneToOneField(File, on_delete=CASCADE, primary_key=True)
    time = DateTimeField(default=timezone.now)
    name = TextField()
    checksum = CharField(max_length=32)
    last_modified = DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} at {self.time}"


class FileUse(Model):
    class Role(IntegerChoices):
        OUT = 0, "OUT"
        IN = 1, "IN"

    file = ForeignKey(File, CASCADE, related_name="file_uses")
    job = ForeignKey(Job, CASCADE, related_name="file_uses")
    role = IntegerField(choices=Role.choices)
    job_param_name = CharField(max_length=32, blank=True)

    class Meta:
        unique_together = ["file", "job", "role"]

    def __str__(self):
        return self.job_param_name


class XData(Model):
    data_class = TextField(db_column="class")
    xml = TextField()
    job = ForeignKey(Job, RESTRICT, blank=True, null=True, related_name="xdatas")

    def __str__(self):
        return self.id
