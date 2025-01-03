import logging
import datetime
import zipfile

from pathlib import Path
from xml.etree import ElementTree as ET
from ..api.serializers import (
    ProjectSerializer,
    JobSerializer,
    FileSerializer,
    FileUseSerializer,
    FileImportSerializer,
    JobCharValueSerializer,
    JobFloatValueSerializer,
    ProjectTagSerializer,
)
from .models import Project, Job, FileType, File, JobValueKey, ProjectTag
from .ccp4i2_static_data import FILETYPELIST, KEYTYPELIST

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger("root")

tag_map = {}


def import_ccp4_project_zip(zip_path: Path, relocate_path: Path = None):
    zip_archive = zipfile.ZipFile(zip_path, "r")
    root_node = ET.parse(zip_archive.open("DATABASE.db.xml", "r"))
    import_i2xml(root_node, relocate_path=relocate_path)
    all_archive_files = zip_archive.namelist()
    this_project_node = root_node.findall("ccp4i2_header/projectId")
    print(this_project_node)
    this_project = Project.objects.get(uuid=this_project_node[0].text.strip())
    for subdir in [
        "CCP4_COOT",
        "CCP4_DOWNLOADED_FILES",
        "CCP4_PROJECT_FILES",
        "CCP4_IMPORTED_FILES",
        "CCP4_TMP",
        "CCP4_JOBS",
    ]:
        subdir_files = [
            filename
            for filename in all_archive_files
            if filename.startswith(f"{subdir}/")
        ]
        zip_archive.extractall(str(Path(this_project.directory)), subdir_files, None)


def banana(root_node: ET.Element):
    # Look out for case that jobs with matching job numbers are proposed for import
    all_import_job_nodes = root_node.findall("ccp4i2_body/jobTable/job")
    top_level_job_nodes = [
        node for node in all_import_job_nodes if "parentjobid" not in node.attrib
    ]
    for top_level_job_node in top_level_job_nodes:
        try:
            matching_project = Project.objects.get(
                uuid=top_level_job_node.attrib["projectid"]
            )
            _ = Job.objects.get(
                project=matching_project, number=top_level_job_node.attrib["jobnumber"]
            )
        except Project.DoesNotExist as err:
            logging.error(
                f"Project for this job does not exist {err}, {top_level_job_node}"
            )
            raise err
        except Job.DoesNotExist as err:
            logging.info(
                f"No job found matching project {top_level_job_node.attrib['projectid']}, job number {top_level_job_node.attrib['jobnumber']} {err}"
            )
            pass


def import_i2xml_from_file(xml_path: Path, relocate_path: Path = None):
    logger.debug("Hello")
    root_node = ET.parse(xml_path)
    import_i2xml(root_node, relocate_path=relocate_path)


def import_i2xml(root_node: ET.Element, relocate_path: Path):

    for node in root_node.findall("ccp4i2_body/projectTable/project"):
        import_project(node, relocate_path)
    for node in root_node.findall("ccp4i2_body/jobTable/job"):
        import_job(node)
    for node in root_node.findall("ccp4i2_body/fileTable/file"):
        import_file(node, relocate_path=relocate_path)
    for node in root_node.findall("ccp4i2_body/fileuseTable/fileuse"):
        import_file_use(node)
    for node in root_node.findall("ccp4i2_body/importfileTable/importfile"):
        import_file_import(node)
    for node in root_node.findall("ccp4i2_body/jobkeyvalueTable/jobkeyvalue"):
        import_job_key_value(node)
    for node in root_node.findall("ccp4i2_body/jobkeyvalueTable/jobkeycharvalue"):
        import_job_key_char_value(node)
    for node in root_node.findall("ccp4i2_body/tagTable/tag"):
        import_tag(node)
    for node in root_node.findall("ccp4i2_body/projecttagTable/projecttag"):
        import_project_tag(node)


def import_project(node: ET.Element, relocate_path: Path = None):
    create_dict = {}
    create_dict["uuid"] = node.attrib["projectid"]
    create_dict["name"] = node.attrib["projectname"]
    create_dict["last_job_number"] = node.attrib["lastjobnumber"]
    directory = node.attrib["projectdirectory"]

    if relocate_path is not None:
        directory = relocate_path / Path(directory).name
    node.attrib["projectdirectory"] = directory
    create_dict["directory"] = str(directory)
    create_dict["creation_time"] = datetime.datetime.fromtimestamp(
        float(node.attrib["projectcreated"])
    )
    create_dict["creation_time"] = datetime.datetime.fromtimestamp(
        float(node.attrib["projectcreated"])
    )
    item_form = ProjectSerializer(data=create_dict)
    if item_form.is_valid():
        new_item = item_form.save()
        new_project = new_item.save()
        logging.info(f"Created new project {new_project}")
        return new_project
    else:
        logging.error(f"Issues creating new project {item_form.errors}")
        return None


def import_job(node: ET.Element):
    create_dict = {}
    create_dict["uuid"] = node.attrib["jobid"]
    create_dict["status"] = node.attrib["status"]
    if "evaluation" in node.attrib:
        create_dict["evaluation"] = node.attrib["evalaluation"]
    create_dict["job_number"] = node.attrib["jobnumber"]
    create_dict["task_name"] = node.attrib["taskname"]
    create_dict["creation_time"] = datetime.datetime.fromtimestamp(
        float(node.attrib["creationtime"])
    )
    create_dict["finish_time"] = datetime.datetime.fromtimestamp(
        float(node.attrib["finishtime"])
    )
    create_dict["number"] = node.attrib["jobnumber"]
    if "title" in node.attrib:
        create_dict["title"] = node.attrib["title"]
    else:
        create_dict["title"] = node.attrib["taskname"]
    create_dict["project"] = Project.objects.get(uuid=node.attrib["projectid"]).pk
    if "parentjobid" in node.attrib:
        create_dict["parent"] = Job.objects.get(uuid=node.attrib["parentjobid"]).pk
    item_form = JobSerializer(data=create_dict)
    if item_form.is_valid():
        new_item = item_form.save()
        new_job = new_item.save()
        logging.info(f"Created new job {new_job}")
        return new_job
    else:
        logging.error(f"Issues creating new job {item_form.errors}")
        return None


def import_file(node: ET.Element, relocate_path: Path = None):
    create_dict = {}
    create_dict["uuid"] = node.attrib["fileid"]
    create_dict["name"] = node.attrib["filename"]
    create_dict["directory"] = node.attrib["pathflag"]
    create_dict["job"] = Job.objects.get(uuid=node.attrib["jobid"]).pk
    create_dict["job_param_name"] = node.attrib["jobparamname"]
    filetypeid = int(node.attrib["filetypeid"])
    file_types = [fileType for fileType in FILETYPELIST if filetypeid == fileType[0]]
    file_type = file_types[0]
    create_dict["type"] = FileType.objects.get(name=file_type[1])

    if "annotation" in node.attrib:
        create_dict["annotation"] = node.attrib["annotation"]
    if "filesubtype" in node.attrib:
        create_dict["sub_type"] = node.attrib["filesubtype"]
    if "filecontent" in node.attrib:
        create_dict["content"] = node.attrib["filecontent"]

    item_form = FileSerializer(data=create_dict)
    if item_form.is_valid():
        new_item = item_form.save()
        new_file = new_item.save()
        logging.info(f"Created new File {new_file}")
        return new_file
    else:
        logging.error(f"Issues creating new File {item_form.errors}")
        return None


def import_file_use(node: ET.Element):
    create_dict = {}
    create_dict["file"] = File.objects.get(uuid=node.attrib["fileid"]).pk
    create_dict["job"] = Job.objects.get(uuid=node.attrib["jobid"]).pk
    create_dict["role"] = node.attrib["roleid"]
    create_dict["job_param_name"] = node.attrib["jobparamname"]

    item_form = FileUseSerializer(data=create_dict)
    if item_form.is_valid():
        new_item = item_form.save()
        new_file_use = new_item.save()
        logging.info(f"Created new FileUse {new_file_use}")
        return new_file_use
    else:
        logging.error(f"Issues creating new FileUse {item_form.errors}")
        return None


def import_file_import(node: ET.Element):
    create_dict = {}
    create_dict["file"] = File.objects.get(uuid=node.attrib["fileid"]).pk
    create_dict["time"] = datetime.datetime.fromtimestamp(
        float(node.attrib["creationtime"])
    )
    create_dict["name"] = node.attrib["sourcefilename"]
    create_dict["checksum"] = node.attrib["checksum"]

    item_form = FileImportSerializer(data=create_dict)
    if item_form.is_valid():
        new_item = item_form.save()
        new_file_import = new_item.save()
        logging.info(f"Created new FileImport {new_file_import}")
        return new_file_import
    else:
        logging.error("Issues creating new FileImport {item_form.errors}")
        return None


def import_job_key_value(node: ET.Element):
    create_dict = {}
    create_dict["job"] = Job.objects.get(uuid=node.attrib["jobid"]).pk
    key_type_id = int(node.attrib["keytypeid"])
    key_types = [key_type for key_type in KEYTYPELIST if key_type_id == key_type[0]]
    key_type = key_types[0]
    create_dict["key"] = JobValueKey.objects.get(name=key_type[1]).pk
    create_dict["value"] = float(node.attrib["value"])

    item_form = JobFloatValueSerializer(data=create_dict)
    if item_form.is_valid():
        new_item = item_form.save()
        new_job_float_value = new_item.save()
        logging.info(f"Created new JobValue {new_job_float_value}")
        return new_job_float_value
    else:
        logging.error(f"Issues creating new JobValue {item_form.errors}")
        return None


def import_job_key_char_value(node: ET.Element):
    create_dict = {}
    create_dict["job"] = Job.objects.get(uuid=node.attrib["jobid"]).pk
    key_type_id = int(node.attrib["keytypeid"])
    key_types = [key_type for key_type in KEYTYPELIST if key_type_id == key_type[0]]
    key_type = key_types[0]
    create_dict["key"] = JobValueKey.objects.get(name=key_type[1]).pk
    create_dict["value"] = str(node.attrib["value"])

    item_form = JobCharValueSerializer(data=create_dict)
    if item_form.is_valid():
        new_item = item_form.save()
        new_job_char_value = new_item.save()
        logging.info(f"Created new JobCharValue {new_job_char_value}")
        return new_job_char_value
    else:
        logging.error(f"Issues creating new JobCharValue {item_form.errors}")
        return None


def import_tag(node: ET.Element):
    tag_map[node.attrib["tagid"]] = node.attrib["text"]


def import_project_tag(node: ET.Element):
    # Check if tg with this text already exists if so,  retrieve and add project to is projects otherwise create with project
    project_tag = None
    try:
        tag_text = tag_map[node.attrib["tagid"]]
        project_tag = ProjectTag.objects.get(text=tag_text)
        project_tag.projects.add(Project.objects.get(uuid=node.attrib["projectid"]))
        project_tag.save()
        return project_tag
    except KeyError as err:
        print(tag_map)
        logging.error(f"Cannot determine text of tag  {node} {err}")
    except ProjectTag.DoesNotExist as err:
        logging.info(f"Creating new ProjectTag with text {tag_text} {err}")
        create_dict = {}
        create_dict["text"] = tag_map[node.attrib["tagid"]]
        create_dict["parent"] = None
        create_dict["projects"] = [
            Project.objects.get(uuid=node.attrib["projectid"]).pk
        ]
        item_form = ProjectTagSerializer(data=create_dict)
        if item_form.is_valid():
            new_item = item_form.save()
            new_project_tag = new_item.save()
            logging.info(f"Created new JobCharValue {new_project_tag}")
            return new_project_tag
        else:
            logging.error(f"Issues creating new JobCharValue {item_form.errors}")
            return None
