from pathlib import Path
from django.utils.text import slugify
from django.conf import settings
from rest_framework.serializers import ModelSerializer, ValidationError
from ..db import models


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = models.Project
        fields = "__all__"

    def create(self, validated_data):
        if "directory" not in validated_data:
            validated_data["directory"] = str(
                Path(settings.CCP4I2_PROJECTS_DIR) / slugify(validated_data["name"])
            )

        Path(validated_data["directory"]).mkdir(parents=True)

        for sub_dir in [
            "CCP4_JOBS",
            "CCP4_IMPORTED_FILES",
            "CCP4_COOT",
            "CCP4_TMP",
            "CCP4_PROJECT_FILES",
        ]:
            (Path(validated_data["directory"]) / sub_dir).mkdir()

        return models.Project.objects.create(**validated_data)

    def validate_name(self, data: str):
        if any((not c.isalnum() and c not in ["_", "-"]) for c in data):
            raise ValidationError(
                f"Your project name contains whitespace or special characters [{data}]"
            )
        project_names = [
            project.name.upper() for project in models.Project.objects.all()
        ]
        if "uuid" not in self.initial_data and data.upper() in project_names:
            raise ValidationError("A project with this name already exists!")
        if "directory" not in self.initial_data:
            assert Path(settings.CCP4I2_PROJECTS_DIR).is_dir()
            try:
                testWritePath = Path(settings.CCP4I2_PROJECTS_DIR) / "testWrite.txt"
                with open(testWritePath, "w") as testWrite:
                    testWrite.write("test")
                testWritePath.unlink()
            except Exception as err:
                raise ValidationError(
                    f"Failure trying to write to  [{testWritePath}], {err}"
                ) from err
        return data


class FileSerializer(ModelSerializer):
    class Meta:
        model = models.File
        fields = "__all__"


class JobSerializer(ModelSerializer):
    class Meta:
        model = models.Job
        fields = "__all__"


class FileUseSerializer(ModelSerializer):
    class Meta:
        model = models.FileUse
        fields = "__all__"


class FileImportSerializer(ModelSerializer):
    class Meta:
        model = models.FileImport
        fields = "__all__"


class FileExportSerializer(ModelSerializer):
    class Meta:
        model = models.FileExport
        fields = "__all__"


class XDataSerializer(ModelSerializer):
    class Meta:
        model = models.XData
        fields = "__all__"


class JobFloatValueSerializer(ModelSerializer):
    class Meta:
        model = models.JobFloatValue
        fields = "__all__"


class JobCharValueSerializer(ModelSerializer):
    class Meta:
        model = models.JobCharValue
        fields = "__all__"


class ProjectTagSerializer(ModelSerializer):
    class Meta:
        model = models.ProjectTag
        exclude = []
