import logging
import zipfile
import shutil
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.dom import minidom
from datetime import datetime
from typing import Optional, Dict, Any

from .models import (
    Project,
    Job,
    File,
    FileUse,
    FileImport,
    JobFloatValue,
    JobCharValue,
    ProjectTag,
    JobValueKey,
    FileType,
)
from .ccp4i2_static_data import FILETYPELIST, KEYTYPELIST

logger = logging.getLogger(f"ccp4x:{__name__}")


def generate_project_xml_tree(project: Project) -> ET.Element:
    """
    Generate an XML ElementTree for a CCP4 project.

    Args:
        project (Project): The Django Project model instance to export

    Returns:
        ET.Element: The root XML element containing all project data
    """
    root = ET.Element("database")

    # Add header information
    header = ET.SubElement(root, "ccp4i2_header")
    project_id_elem = ET.SubElement(header, "projectId")
    project_id_elem.text = str(project.uuid)

    export_time = ET.SubElement(header, "exportTime")
    export_time.text = str(int(datetime.now().timestamp()))

    # Add body containing all data
    body = ET.SubElement(root, "ccp4i2_body")

    # Export project table
    _export_project_table(body, project)

    # Export job table
    _export_job_table(body, project)

    # Export file table
    _export_file_table(body, project)

    # Export file use table
    _export_file_use_table(body, project)

    # Export file import table
    _export_file_import_table(body, project)

    # Export job key value tables
    _export_job_key_value_tables(body, project)

    # Export tag tables
    _export_tag_tables(body, project)

    return root


def write_xml_tree_to_file(root: ET.Element, output_path: Path) -> Path:
    """
    Write an XML ElementTree to a formatted file.

    Args:
        root (ET.Element): The root XML element to write
        output_path (Path): Path where the XML file will be saved

    Returns:
        Path: The path to the created XML file
    """
    # Write formatted XML to file
    xml_string = ET.tostring(root, encoding="unicode")
    pretty_xml = minidom.parseString(xml_string).toprettyxml(indent="  ")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(pretty_xml)

    logger.info(f"XML tree written to {output_path}")
    return output_path


def export_project_to_xml(project: Project, output_path: Path) -> Path:
    """
    Export a CCP4 project to XML format.

    Args:
        project (Project): The Django Project model instance to export
        output_path (Path): Path where the XML file will be saved

    Returns:
        Path: The path to the created XML file
    """
    # Generate the XML tree
    root = generate_project_xml_tree(project)

    # Write to file
    write_xml_tree_to_file(root, output_path)

    logger.info(f"Exported project {project.name} to {output_path}")
    return output_path


def export_project_to_zip(project: Project, output_path: Path) -> Path:
    """
    Export a CCP4 project to a ZIP archive containing XML and project files.

    Args:
        project (Project): The Django Project model instance to export
        output_path (Path): Path where the ZIP file will be saved

    Returns:
        Path: The path to the created ZIP file
    """
    # Create temporary directory for XML
    temp_dir = Path(output_path).parent / f"temp_{project.uuid}"
    temp_dir.mkdir(exist_ok=True)

    try:
        # Generate XML tree and write to temporary file
        xml_path = temp_dir / "DATABASE.db.xml"
        root = generate_project_xml_tree(project)
        write_xml_tree_to_file(root, xml_path)

        # Create ZIP archive
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zip_archive:
            # Add XML file
            zip_archive.write(xml_path, "DATABASE.db.xml")

            # Add project directories if they exist
            project_dir = Path(project.directory)
            if project_dir.exists():
                for subdir in [
                    "CCP4_JOBS",
                    "CCP4_COOT",
                    "CCP4_DOWNLOADED_FILES",
                    "CCP4_PROJECT_FILES",
                    "CCP4_IMPORTED_FILES",
                    "CCP4_TMP",
                ]:
                    subdir_path = project_dir / subdir
                    if subdir_path.exists():
                        _add_directory_to_zip(zip_archive, subdir_path, subdir)

        logger.info(f"Exported project {project.name} to ZIP: {output_path}")
        return output_path

    finally:
        # Clean up temporary directory
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def _format_uuid_for_xml(uuid_value) -> str:
    """Remove hyphens from UUID for XML serialization."""
    return str(uuid_value).replace("-", "")


def _export_project_table(body: ET.Element, project: Project) -> None:
    """Export project table data."""
    project_table = ET.SubElement(body, "projectTable")
    project_elem = ET.SubElement(project_table, "project")

    project_elem.set("projectid", _format_uuid_for_xml(project.uuid))
    project_elem.set("projectname", project.name)
    project_elem.set("lastjobnumber", str(project.last_job_number))
    project_elem.set("projectdirectory", str(project.directory))
    project_elem.set("projectcreated", str(int(project.creation_time.timestamp())))


def _export_job_table(body: ET.Element, project: Project) -> None:
    """Export job table data."""
    job_table = ET.SubElement(body, "jobTable")

    jobs = Job.objects.filter(project=project).order_by("number")
    for job in jobs:
        job_elem = ET.SubElement(job_table, "job")

        job_elem.set("jobid", _format_uuid_for_xml(job.uuid))
        job_elem.set("projectid", _format_uuid_for_xml(project.uuid))
        job_elem.set("status", str(job.status))
        job_elem.set("jobnumber", str(job.number))
        job_elem.set("taskname", job.task_name or "")
        job_elem.set("creationtime", str(int(job.creation_time.timestamp())))
        job_elem.set("title", job.title or job.task_name or "")

        if job.evaluation is not None:
            job_elem.set("evaluation", str(job.evaluation))

        if job.finish_time:
            job_elem.set("finishtime", str(int(job.finish_time.timestamp())))

        if job.parent:
            job_elem.set("parentjobid", _format_uuid_for_xml(job.parent.uuid))


def _export_file_table(body: ET.Element, project: Project) -> None:
    """Export file table data."""
    file_table = ET.SubElement(body, "fileTable")

    files = File.objects.filter(job__project=project)
    for file_obj in files:
        file_elem = ET.SubElement(file_table, "file")

        file_elem.set("fileid", _format_uuid_for_xml(file_obj.uuid))
        file_elem.set("jobid", _format_uuid_for_xml(file_obj.job.uuid))
        file_elem.set("filename", file_obj.name or "")
        file_elem.set("pathflag", str(file_obj.directory or ""))
        file_elem.set("jobparamname", file_obj.job_param_name or "")

        # Find file type ID from static data
        file_type_id = _get_file_type_id(file_obj.type.name if file_obj.type else "")
        file_elem.set("filetypeid", str(file_type_id))

        if file_obj.annotation:
            file_elem.set("annotation", file_obj.annotation)
        if file_obj.sub_type:
            file_elem.set("filesubtype", str(file_obj.sub_type))
        if file_obj.content:
            file_elem.set("filecontent", str(file_obj.content))


def _export_file_use_table(body: ET.Element, project: Project) -> None:
    """Export file use table data."""
    fileuse_table = ET.SubElement(body, "fileuseTable")

    file_uses = FileUse.objects.filter(job__project=project)
    for file_use in file_uses:
        fileuse_elem = ET.SubElement(fileuse_table, "fileuse")

        fileuse_elem.set("fileid", _format_uuid_for_xml(file_use.file.uuid))
        fileuse_elem.set("jobid", _format_uuid_for_xml(file_use.job.uuid))
        fileuse_elem.set("roleid", str(file_use.role))
        fileuse_elem.set("jobparamname", file_use.job_param_name or "")


def _export_file_import_table(body: ET.Element, project: Project) -> None:
    """Export file import table data."""
    import_table = ET.SubElement(body, "importfileTable")

    file_imports = FileImport.objects.filter(file__job__project=project)
    for file_import in file_imports:
        import_elem = ET.SubElement(import_table, "importfile")

        import_elem.set("fileid", _format_uuid_for_xml(file_import.file.uuid))
        import_elem.set("creationtime", str(int(file_import.time.timestamp())))
        import_elem.set("sourcefilename", file_import.name or "")
        import_elem.set("checksum", str(file_import.checksum) or "")


def _export_job_key_value_tables(body: ET.Element, project: Project) -> None:
    """Export job key value tables (both float and char values)."""
    keyvalue_table = ET.SubElement(body, "jobkeyvalueTable")

    # Export float values
    float_values = JobFloatValue.objects.filter(job__project=project)
    for float_value in float_values:
        keyvalue_elem = ET.SubElement(keyvalue_table, "jobkeyvalue")

        keyvalue_elem.set("jobid", _format_uuid_for_xml(float_value.job.uuid))
        key_type_id = str(
            _get_key_type_id(float_value.key.name if float_value.key else "")
        )
        keyvalue_elem.set("keytypeid", str(key_type_id))
        keyvalue_elem.set("value", str(float_value.value))

    # Export char values
    char_values = JobCharValue.objects.filter(job__project=project)
    for char_value in char_values:
        keyvalue_elem = ET.SubElement(keyvalue_table, "jobkeycharvalue")

        keyvalue_elem.set("jobid", _format_uuid_for_xml(char_value.job.uuid))
        key_type_id = str(
            _get_key_type_id(char_value.key.name if char_value.key else "")
        )
        keyvalue_elem.set("keytypeid", str(key_type_id))
        keyvalue_elem.set("value", str(char_value.value))


def _export_tag_tables(body: ET.Element, project: Project) -> None:
    """Export tag and project tag tables."""
    # Get all tags associated with this project
    project_tags = ProjectTag.objects.filter(projects=project)

    if project_tags.exists():
        # Export tag table
        tag_table = ET.SubElement(body, "tagTable")
        tag_id_map = {}

        for i, project_tag in enumerate(project_tags):
            tag_elem = ET.SubElement(tag_table, "tag")
            tag_id = i + 1  # Simple sequential ID
            tag_id_map[project_tag.id] = tag_id

            tag_elem.set("tagid", str(tag_id))
            tag_elem.set("text", project_tag.text or "")

        # Export project tag table
        projecttag_table = ET.SubElement(body, "projecttagTable")

        for project_tag in project_tags:
            projecttag_elem = ET.SubElement(projecttag_table, "projecttag")

            projecttag_elem.set("projectid", _format_uuid_for_xml(project.uuid))
            projecttag_elem.set("tagid", str(tag_id_map[project_tag.id]))


def _get_file_type_id(file_type_name: str) -> int:
    """Get file type ID from static data."""
    if not file_type_name:
        return 0
    for file_type_id, name, description in FILETYPELIST:
        if name == file_type_name:
            return file_type_id
    return 0  # Default if not found


def _get_key_type_id(key_name: str) -> int:
    """Get key type ID from static data."""
    if not key_name:
        return 0
    for key_type_id, name, description in KEYTYPELIST:
        if name == key_name:
            return key_type_id
    return 0  # Default if not found


def _add_directory_to_zip(
    zip_archive: zipfile.ZipFile, source_dir: Path, archive_dir: str
) -> None:
    """Recursively add directory contents to ZIP archive."""
    for item in source_dir.rglob("*"):
        if item.is_file():
            # Calculate relative path within the archive
            relative_path = item.relative_to(source_dir.parent)
            zip_archive.write(item, str(relative_path))
        elif item.is_dir():
            # Add empty directories
            relative_path = item.relative_to(source_dir.parent)
            zip_info = zipfile.ZipInfo(str(relative_path) + "/")
            zip_archive.writestr(zip_info, "")


# Convenience functions for different export formats
def export_project_xml(project_id: str, output_path: Path) -> Path:
    """Export project by ID to XML format."""
    project = Project.objects.get(uuid=project_id)
    return export_project_to_xml(project, output_path)


def export_project_zip(project_id: str, output_path: Path) -> Path:
    """Export project by ID to ZIP format."""
    project = Project.objects.get(uuid=project_id)
    return export_project_to_zip(project, output_path)


# Example usage
if __name__ == "__main__":
    # Example: Export project to XML
    try:
        project = Project.objects.get(name="my_project")
        xml_output = Path("exported_project.xml")
        zip_output = Path("exported_project.zip")

        export_project_to_xml(project, xml_output)
        export_project_to_zip(project, zip_output)

        print(f"Project exported to {xml_output} and {zip_output}")

    except Project.DoesNotExist:
        print("Project not found")
    except Exception as e:
        print(f"Export failed: {e}")
