import os
from django.core.management import call_command
from django.db import models


def export_project_json(project_instance, output_file_path):
    """
    Exports a JSON file representing a dump of the database contents for a given project instance,
    all related objects through ForeignKey relationships, and recursively all objects related to those.

    Args:
        project_instance (models.Model): The project instance to export.
        output_file_path (str): The file path where the JSON dump will be saved.
    """
    if not isinstance(project_instance, models.Model):
        raise ValueError("project_instance must be a Django model instance.")

    def collect_related_objects(model_instance, collected):
        """
        Recursively collect related objects through ForeignKey relationships.
        """
        model = model_instance.__class__
        pk = model_instance.pk
        identifier = f"{model._meta.app_label}.{model._meta.model_name}:{pk}"

        if identifier in collected:
            return  # Avoid circular references

        collected.add(identifier)

        for field in model._meta.get_fields():
            if isinstance(field, models.ForeignKey):
                related_manager = getattr(model_instance, field.name, None)
                if related_manager:
                    collect_related_objects(related_manager, collected)
            elif field.one_to_many or field.one_to_one:
                related_manager = getattr(model_instance, field.name, None)
                if related_manager:
                    if hasattr(
                        related_manager, "all"
                    ):  # For reverse ForeignKey relationships
                        for related_instance in related_manager.all():
                            collect_related_objects(related_instance, collected)
                    else:  # For one-to-one relationships
                        collect_related_objects(related_manager, collected)

    # Collect all related objects recursively
    collected_objects = set()
    collect_related_objects(project_instance, collected_objects)

    # Use Django's dumpdata management command to export the data
    try:
        with open(output_file_path, "w") as output_file:
            call_command(
                "dumpdata",
                *collected_objects,
                format="json",
                indent=2,
                stdout=output_file,
            )
        print(f"Data successfully exported to {output_file_path}")
    except Exception as e:
        print(f"An error occurred while exporting data: {e}")
