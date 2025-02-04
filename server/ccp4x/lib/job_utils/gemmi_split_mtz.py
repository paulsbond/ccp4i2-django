import pathlib
import logging
import gemmi
import numpy
import re
from core import CCP4XtalData
from .available_file_name_based_on import available_file_name_based_on

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(f"ccp4x:{__name__}")


def gemmi_split_mtz(
    input_file_path: pathlib.Path = None,
    input_column_path: str = None,
    preferred_dest: pathlib.Path = None,
):
    if input_file_path is None:
        raise Exception("smartSplitMTZ Exception:", "Must provide an input file")
    if not input_file_path.is_file():
        raise Exception(
            "smartSplitMTZ Exception:", "inputFile must exist" + str(input_file_path)
        )
    if input_column_path is None:
        raise Exception(
            "smartSplitMTZ Exception:",
            "Must provide an input columnPath e.g. '/*/*/[F,SIGFP]'",
        )
    if preferred_dest is None:
        raise Exception(
            "smartSplitMTZ Exception:",
            "Provide first guess for destination of split file",
        )

    mtzin = gemmi.read_mtz_file(str(input_file_path))
    providedColumnNames = mtzin.column_labels()
    if input_column_path.startswith("/"):
        input_column_path = input_column_path[1:]
    if len(input_column_path.split("/")) not in [1, 3]:
        raise Exception("smartSplitMTZ Exception:", "Invalid input columnPath")
    selectedColumns = re.sub("[\[\] ]", "", input_column_path.split("/")[-1]).split(",")
    outputColumns = [mtzin.column_with_label(label) for label in ["H", "K", "L"]]
    typeSignature = ""
    for columnLabel in selectedColumns:
        if providedColumnNames.count(columnLabel) == 1:
            column = mtzin.column_with_label(columnLabel)
            outputColumns.append(column)
            typeSignature += column.type
        else:
            if len(input_column_path.split("/")) != 3:
                raise Exception(
                    "smartSplitMTZ Exception:",
                    "Input file requires full input columnPath e.g. '/crystal/dataset/[F,SIGFP]'",
                )
            for dataset in mtzin.datasets:
                if (
                    dataset.crystal_name == input_column_path.split("/")[-3]
                    and dataset.dataset_name == input_column_path.split("/")[-2]
                ):
                    column = mtzin.column_with_label(
                        columnLabel, mtzin.dataset(dataset.id)
                    )
                    outputColumns.append(column)
                    typeSignature += column.type

    if len(outputColumns[3:]) != len(selectedColumns):
        raise Exception(
            "smartSplitMTZ Exception:",
            f"Unable to select columns from input file - options are {providedColumnNames}",
        )

    logger.error("Output columns are %s", outputColumns)
    final_dest = available_file_name_based_on(preferred_dest)

    mtzout = gemmi.Mtz()
    mtzout.spacegroup = mtzin.spacegroup
    mtzout.cell = mtzin.cell
    mtzout.add_dataset("HKL_base")
    if len(mtzin.datasets) > 1:
        dataset = outputColumns[-1].dataset
        ds = mtzout.add_dataset(dataset.project_name)
        ds.crystal_name = dataset.crystal_name
        ds.dataset_name = dataset.dataset_name
        ds.wavelength = dataset.wavelength
    outputColumnLabels = ["H", "K", "L"]
    labelsDict = {
        "FQ": {"cls": CCP4XtalData.CObsDataFile, "contentType": 4},
        "JQ": {"cls": CCP4XtalData.CObsDataFile, "contentType": 3},
        "GLGL": {"cls": CCP4XtalData.CObsDataFile, "contentType": 2},
        # surely not
        "FQFQ": {"cls": CCP4XtalData.CObsDataFile, "contentType": 2},
        "KMKM": {"cls": CCP4XtalData.CObsDataFile, "contentType": 1},
        # surely not
        "JQJQ": {"cls": CCP4XtalData.CObsDataFile, "contentType": 1},
        "AAAA": {"cls": CCP4XtalData.CPhsDataFile, "contentType": 1},
        "PW": {"cls": CCP4XtalData.CPhsDataFile, "contentType": 2},
        "I": {"cls": CCP4XtalData.CFreeRDataFile, "contentType": 1},
    }
    outputColumnLabels.extend(
        getattr(labelsDict[typeSignature]["cls"], "CONTENT_SIGNATURE_LIST")[
            labelsDict[typeSignature]["contentType"] - 1
        ]
    )
    for i, column in enumerate(outputColumns):
        (
            mtzout.add_column(outputColumnLabels[i], column.type, dataset_id=0)
            if i < 3 or len(mtzin.datasets) <= 1
            else mtzout.add_column(outputColumnLabels[i], column.type, dataset_id=1)
        )
    data = numpy.stack(outputColumns, axis=1)
    mtzout.set_data(data)
    mtzout.history = [f"MTZ file created from {input_file_path.name} using gemmi."]
    mtzout.write_to_file(str(final_dest))

    return final_dest
