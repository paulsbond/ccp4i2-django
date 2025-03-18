import gemmi
import unittest
import argparse
import re
from ccp4i2.core.CCP4Container import CContainer
from ccp4i2.core.CCP4PluginScript import CPluginScript
from core import CCP4Container
from core import CCP4Modules
from core import CCP4Data
from core import CCP4XtalData
import traceback
import os
import sys
import logging
import shlex
import numpy
from ..lib.job_utils.set_parameter import set_parameter_container
from ..lib.job_utils.find_objects import find_object_by_path

# Get an instance of a logger
logger = logging.getLogger("root")


class CCP4i2RunnerBase(object):
    def __init__(self, the_args=None, command_line=None, parser=None, parent=None):
        self.parent = parent

        assert (
            the_args is not None or command_line is not None
        ), "Need to provide one of args or command_line"
        if the_args is None and command_line is not None:
            the_args = [os.path.expandvars(a) for a in shlex.split(command_line)]
        self.args = the_args

        if parser is None:
            self.parser = argparse.ArgumentParser(usage="i2run")
        else:
            self.parser = parser

        self.task_name = self.args[0]
        self.parser.add_argument("task_name")
        self.parser.add_argument("--project_name", default=None)
        self.parser.add_argument("--delay", action="store_true")
        self.parser.add_argument("--batch", action="store_true")
        self.parsed_args = None
        self.job_id = None
        self.project_id = None
        self.list_map = {}

    def keywordsOfTask(self):
        return self.keywordsOfTaskName(self.task_name)

    def parseArgs(self):
        CCP4i2RunnerBase.addTaskArguments(
            self.parser, self.task_name, parent=self.parent
        )
        if self.parsed_args is None:
            self.parsed_args = self.parser.parse_args(self.args)
        return self.parsed_args

    def getPlugin(self, jobId=None):
        parsed_args = self.parseArgs()
        logger.debug(f"parsed_args is {parsed_args}")
        sys.stdout.flush()
        if parsed_args.project_name is not None:
            self.projectId = self.projectWithName(parsed_args.project_name)
            self.jobId = self.projectJobWithTask(
                projectId=self.projectId, task_name=self.task_name
            )
            jobId = self.jobId
        return self.pluginWithArgs(parsed_args=parsed_args, jobId=jobId)

    def projectWithName(self, project_name):
        raise Exception(
            f"CCP4i2RunnerBase class does not provide projectWithName - implemented in subclasses"
        )

    def projectJobWithTask(self, projectId, task_name=None):
        raise Exception(
            f"CCP4i2RunnerBase class does not provide projectJobWithTask - implemented in subclasses"
        )

    def execute(self):
        raise Exception(
            f"CCP4i2RunnerBase class does not provide execute - implemented in subclasses"
        )

    @staticmethod
    def keywordsOfContainer(container: CContainer, growingList=None):
        if growingList is None:
            growingList = []
        for child in container.children():
            if (
                isinstance(child, (CContainer, CCP4Container.CContainer))
                and "temporary" not in child.objectName()
            ):
                growingList = CCP4i2RunnerBase.keywordsOfContainer(child, growingList)
            else:
                try:
                    growingList.append(
                        {
                            "path": child.objectPath(),
                            "minimumPath": child.objectPath(),
                            "qualifiers": child.qualifiers(),
                            "className": type(child).__name__,
                            "object": child,
                        }
                    )
                except AttributeError as err:
                    print("Issue ", err, " for child ", child)
        return growingList

    @staticmethod
    def getCandidatePath(currentPath):
        pathElements = currentPath.split(".")
        return ".".join(pathElements[1:])

    @staticmethod
    def minimisePaths(allKeywords):
        nShrunk = len(allKeywords)
        while nShrunk > 0:
            nShrunk = 0
            for iKeyword, keyword in enumerate(allKeywords):
                if keyword["path"].endswith("."):
                    del keyword
                    continue
                if len(keyword["minimumPath"].split(".")) > 1:
                    candidatePath = CCP4i2RunnerBase.getCandidatePath(
                        keyword["minimumPath"]
                    )
                    okayToShrink = True
                    for iOtherKeyword, otherKeyword in enumerate(allKeywords):
                        if iKeyword != iOtherKeyword:
                            if len(otherKeyword["minimumPath"].split(".")) > 1:
                                otherCandidatePath = CCP4i2RunnerBase.getCandidatePath(
                                    otherKeyword["minimumPath"]
                                )
                            else:
                                otherCandidatePath = otherKeyword["minimumPath"]
                            if candidatePath == otherCandidatePath:
                                okayToShrink = False
                                break
                    if okayToShrink:
                        nShrunk += 1
                        keyword["minimumPath"] = candidatePath
        return allKeywords

    @staticmethod
    def keywordsOfTaskName(task_name, parent=None):
        theContainer: CContainer = CCP4Container.CContainer(parent=parent)
        xmlLocation = CCP4Modules.TASKMANAGER().lookupDefFile(
            name=task_name, version=None
        )
        theContainer.loadContentsFromXml(xmlLocation)
        allKeywords = CCP4i2RunnerBase.keywordsOfContainer(theContainer, [])
        # print(CCP4i2RunnerBase.minimisePaths(allKeywords))
        return CCP4i2RunnerBase.minimisePaths(allKeywords)

    @staticmethod
    def addTaskArguments(theParser, task_name, parent=None):
        keywords = CCP4i2RunnerBase.keywordsOfTaskName(task_name, parent=parent)
        logger.debug(str(keywords))

        for keyword in keywords:
            logger.debug(keyword["path"])
            # sys.stdout.flush()
            args = ["--{}".format(keyword["minimumPath"])]
            kwargs = {"required": False}
            for key, value in keyword["qualifiers"].items():
                if key == "toolTip" and value != NotImplemented:
                    kwargs["help"] = value
                elif key == "default" and value and value != NotImplemented:
                    # True  Here a hack to make no properties "required" from command line
                    kwargs["default"] = value
                kwargs["nargs"] = "+"
                kwargs["metavar"] = keyword["object"].__class__.__name__
            if isinstance(keyword["object"], CCP4Data.CList):
                # print("Found append action", keyword["object"].objectPath())
                kwargs["action"] = "append"
            try:
                # print(args, kwargs)
                theParser.add_argument(*args, **kwargs)
            except TypeError as err:
                print("TypeError Exception ", err, " for ", args, kwargs)
            except argparse.ArgumentError as err:
                print("argparse.ArgumentError Exception ", err, " for ", args, kwargs)
        return theParser

    @staticmethod
    def availableNameBasedOn(filePath):
        if not os.path.exists(filePath):
            return filePath
        if "." in filePath:
            # Clumsy thing to deal with double dotted extensions like .scene.xml
            basePath = filePath.split(".")[0]
            extension = "." + ".".join(filePath.split(".")[1:])
        else:
            basePath = filePath
            extension = ""
        counter = 1
        while os.path.exists(basePath + "_" + str(counter) + extension):
            counter += 1
        return basePath + "_" + str(counter) + extension

    @staticmethod
    def gemmiSplitMTZ(
        inputFilePath=None, inputColumnPath=None, objectPath=None, intoDirectory=None
    ):
        if inputFilePath is None:
            raise Exception("smartSplitMTZ Exception:", "Must provide an input file")
        if not os.path.isfile(inputFilePath):
            raise Exception(
                "smartSplitMTZ Exception:", "inputFile must exist" + str(inputFilePath)
            )
        if inputColumnPath is None:
            raise Exception(
                "smartSplitMTZ Exception:",
                "Must provide an input columnPath e.g. '/*/*/[F,SIGFP]'",
            )
        if objectPath is not None and intoDirectory is not None:
            raise Exception(
                "smartSplitMTZ Exception:",
                "Provide either full output path for file, or name of directory where file should be placed",
            )
        if objectPath is None and intoDirectory is None:
            raise Exception(
                "smartSplitMTZ Exception:",
                "Provide either full output path for file, or name of directory where file should be placed",
            )

        mtzin = gemmi.read_mtz_file(inputFilePath)
        providedColumnNames = mtzin.column_labels()
        if inputColumnPath.startswith("/"):
            inputColumnPath = inputColumnPath[1:]
        if len(inputColumnPath.split("/")) not in [1, 3]:
            raise Exception("smartSplitMTZ Exception:", "Invalid input columnPath")
        selectedColumns = re.sub("[\[\] ]", "", inputColumnPath.split("/")[-1]).split(
            ","
        )
        outputColumns = [mtzin.column_with_label(label) for label in ["H", "K", "L"]]
        typeSignature = ""
        for columnLabel in selectedColumns:
            if providedColumnNames.count(columnLabel) == 1:
                column = mtzin.column_with_label(columnLabel)
                outputColumns.append(column)
                typeSignature += column.type
            else:
                if len(inputColumnPath.split("/")) != 3:
                    raise Exception(
                        "smartSplitMTZ Exception:",
                        "Input file requires full input columnPath e.g. '/crystal/dataset/[F,SIGFP]'",
                    )
                for dataset in mtzin.datasets:
                    if (
                        dataset.crystal_name == inputColumnPath.split("/")[-3]
                        and dataset.dataset_name == inputColumnPath.split("/")[-2]
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

        if intoDirectory is not None:
            firstGuess = os.path.join(
                intoDirectory,
                typeSignature + "_ColumnsFrom_" + os.path.split(inputFilePath)[1],
            )
            objectPath = CCP4i2RunnerBase.availableNameBasedOn(firstGuess)
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
        mtzout.history = [
            "MTZ file created from {} using gemmi.".format(
                os.path.basename(inputFilePath)
            )
        ]
        mtzout.write_to_file(objectPath)

        return objectPath

    def handleItem(self, thePlugin: CPluginScript, objectPath, value):
        if isinstance(value, str) and "=" in value:
            subPath, subValue = value.split("=")
            # Intercept some things to do with (e.g.) columnLabels
            if subPath == "columnLabels":
                theObject = find_object_by_path(
                    thePlugin.container, objectPath
                )  # PluginUtils.locateElement(thePlugin.container, objectPath)
                splitFilePath = CCP4i2RunnerBase.gemmiSplitMTZ(
                    inputFilePath=theObject.fullPath.__str__(),
                    inputColumnPath=subValue,
                    intoDirectory=thePlugin.workDirectory,
                )
                print(f"Post split file path is {splitFilePath}")
                set_parameter_container(thePlugin.container, objectPath, splitFilePath)
            elif subPath == "fileUse":
                # print(f'In handleItem fileUse {objectPath}')
                sys.stdout.flush()
                fileUseDict = CCP4i2RunnerBase.parseFileUse(subValue)
                fileUseDict["projectId"] = thePlugin.projectId()
                fileDict = self.fileForFileUse(**fileUseDict)
                set_parameter_container(thePlugin.container, objectPath, fileDict)
            elif subPath == "fullPath":
                logger.info("Setting parameter to %s %s", objectPath, subValue)
                set_parameter_container(thePlugin.container, objectPath, subValue)
            else:
                compositePath = ".".join(objectPath.split(".") + subPath.split("/"))
                logger.info("Setting parameter to %s %s", compositePath, subValue)
                set_parameter_container(thePlugin.container, compositePath, subValue)
        elif value is not None:
            set_parameter_container(thePlugin.container, objectPath, value)

    def fileForFileUse(
        self,
        projectName=None,
        projectId=None,
        task_name=None,
        jobIndex=None,
        jobParamName=None,
        paramIndex=-1,
    ):
        # Base class stub method, to be overloaded by derived classes
        return {}

    def handleItemOrList(self, thePlugin, objectPath, value):
        # print(f'In handleItemOrList {objectPath} {value}')
        if isinstance(value, list):
            for item in value:
                self.handleItem(thePlugin, objectPath, item)
        else:
            self.handleItem(thePlugin, objectPath, value)

    def pluginWithArgs(self, parsed_args, workDirectory=None, jobId=None):
        if jobId is not None:
            workDirectory = CCP4Modules.PROJECTSMANAGER().jobDirectory(jobId=jobId)
        thePlugin = CCP4Modules.TASKMANAGER().getPluginScriptClass(
            parsed_args.task_name
        )(jobId=jobId, workDirectory=workDirectory, parent=self.parent)
        if jobId is not None:
            jobInfo = (
                CCP4Modules.PROJECTSMANAGER()
                .db()
                .getJobInfo(
                    mode=["projectname", "projectid", "jobnumber"],
                    jobId=jobId,
                    returnType=dict,
                )
            )
            # print('jobInfo', jobInfo)
            thePlugin.setDbData(
                jobId=jobId,
                projectName=jobInfo["projectname"],
                projectId=jobInfo["projectid"],
                jobNumber=jobInfo["jobnumber"],
            )
        # PluginUtils.removeDefaults(thePlugin.container)
        allKeywords = CCP4i2RunnerBase.keywordsOfContainer(thePlugin.container, [])

        def predicate(item):
            return (
                f"{parsed_args.task_name}.inputData.temporary" not in item["path"]
                and f"{parsed_args.task_name}.outputData" not in item["path"]
            )

        allKeywords = list(filter(predicate, allKeywords))
        mappedKeywords = {
            taskKeyword["minimumPath"]: taskKeyword
            for taskKeyword in CCP4i2RunnerBase.minimisePaths(allKeywords)
        }
        for keyword, value in vars(parsed_args).items():
            if value is not NotImplemented and keyword in mappedKeywords:
                theObject = mappedKeywords[keyword]["object"]
                try:
                    if isinstance(theObject, CCP4Data.CList):
                        # Here handling lists that might or might not start out with a "dummy" entry
                        if theObject.objectPath() not in self.list_map:
                            self.list_map[theObject.objectPath()] = 1
                            if len(theObject) == 0:
                                theObject.append(theObject.makeItem())
                        else:
                            theObject.append(theObject.makeItem())
                        theItem = theObject[-1]
                        if value is not None:
                            for item in value:
                                self.handleItemOrList(
                                    thePlugin, theItem.objectPath(), item
                                )
                        # Delete known unset exemplars
                        theObject.removeUnsetListItems()
                    elif value is not None:
                        self.handleItemOrList(thePlugin, theObject.objectPath(), value)
                except Exception as err:
                    print(
                        f"Failed to set {theObject.objectPath()} to {value} with err {err}"
                    )
                    traceback.print_exc()
        return thePlugin

    @staticmethod
    def parseFileUse(fileUse):
        fileUseParser_tN_jI_jP_pI = re.compile(
            r"^(?P<task_name>.+)\[(?P<jobIndex>.+)\]\.(?P<jobParamName>.+)\[(?P<paramIndex>.+)\].*$"
        )
        fileUseParser_jI_jP_pI = re.compile(
            r"^(?P<jobIndex>.+)\.(?P<jobParamName>.*)\[(?P<paramIndex>.+)\].*$"
        )
        fileUseParser_tN_jI_jP = re.compile(
            r"^(?P<task_name>.+)\[(?P<jobIndex>.+)\]\.(?P<jobParamName>.+).*$"
        )
        fileUseParser_jI_jP = re.compile(r"^(?P<jobIndex>.+)\.(?P<jobParamName>.+).*$")
        # task_name[jobIndex].jobParamName[paramIndex] returns dict containing task_name, jobIndex, jobParamName, paramIndex
        result = {
            "task_name": None,
            "jobIndex": None,
            "jobParamName": None,
            "paramIndex": -1,
        }
        print(f"Trying to match [{fileUse}]")
        try:
            matches = fileUseParser_tN_jI_jP_pI.match(fileUse)
            result.update(matches.groupdict())
            # print(f'Fileuse {fileUse} matched tN_jI_jP_pI')
            result["jobIndex"] = int(result["jobIndex"])
            result["paramIndex"] = int(result["paramIndex"])
            return result
        except AttributeError as err:
            try:
                matches = fileUseParser_jI_jP_pI.match(fileUse)
                result.update(matches.groupdict())
                # print(f'Fileuse {fileUse} matched jI_jP_pI')
                result["jobIndex"] = int(result["jobIndex"])
                result["paramIndex"] = int(result["paramIndex"])
                return result
            except AttributeError as err:
                try:
                    matches = fileUseParser_tN_jI_jP.match(fileUse)
                    result.update(matches.groupdict())
                    # print(f'Fileuse {fileUse} matched tN_jI_jP')
                    result["jobIndex"] = int(result["jobIndex"])
                    result["paramIndex"] = int(result["paramIndex"])
                    return result
                except AttributeError as err:
                    matches = fileUseParser_jI_jP.match(fileUse)
                    result.update(matches.groupdict())
                    # print(f'Fileuse {fileUse} matched jI_jP')
                    result["jobIndex"] = int(result["jobIndex"])
                    result["paramIndex"] = int(result["paramIndex"])
                    return result


class TestParse(unittest.TestCase):
    modelPdb = os.path.join(
        os.path.expandvars("$CCP4I2_TOP/demo_data/gamma/gamma_model.pdb")
    )
    gammaMtz = os.path.join(
        os.path.expandvars("$CCP4I2_TOP/demo_data/gamma/merged_intensities_Xe.mtz")
    )
    betaPdb = os.path.join(
        os.path.expandvars("$CCP4I2_TOP/demo_data/beta_blip/beta.pdb")
    )
    blipPdb = os.path.join(
        os.path.expandvars("$CCP4I2_TOP/demo_data/beta_blip/blip.pdb")
    )

    def setUp(self):
        self.application = CCP4Modules.QTAPPLICATION(graphical=False)

    def test1(self):
        args = ["prosmart_refmac"]
        runner = CCP4i2RunnerBase(args, parent=self.application)
        taskKeywords = runner.keywordsOfTask()
        print(len(taskKeywords))
        assert len(taskKeywords) == 150

    def test2(self):
        args = ["prosmart_refmac", "--XYZIN", "test.pdb"]
        runner = CCP4i2RunnerBase(args, parent=self.application)
        parsed_args = runner.parseArgs()
        # print(parsed_args.XYZIN)
        assert len(parsed_args.XYZIN) == 1
        assert parsed_args.XYZIN[0] == "test.pdb"

    def test3(self):
        args = [
            "phaser_pipeline",
            "--ENSEMBLES",
            "use=True",
            "pdbItemList[0]/identity_to_target=0.8",
            "pdbItemList[0]/structure={}".format(TestParse.betaPdb),
            "--ENSEMBLES",
            "use=True",
            "pdbItemList[0]/identity_to_target=0.9",
            "pdbItemList[0]/structure={}".format(TestParse.blipPdb),
        ]
        runner = CCP4i2RunnerBase(args, parent=self.application)
        # theParser.print_help()
        thePlugin = runner.getPlugin()
        theEtree = thePlugin.container.getEtree(excludeUnset=True)
        assert len(theEtree.findall("//identity_to_target")) == 2
        assert theEtree.findall("//identity_to_target")[0].text == "0.8"
        assert theEtree.findall("//identity_to_target")[1].text == "0.9"
        # ET.indent(theEtree)
        # print(ET.tostring(theEtree))

    def test4(self):
        args = [
            "prosmart_refmac",
            "--XYZIN",
            TestParse.modelPdb,
            'selection/text="A/"',
            "--F_SIGF",
            TestParse.gammaMtz,
            "columnLabels=/*/*/[Iplus,SIGIplus,Iminus,SIGIminus]",
        ]
        runner = CCP4i2RunnerBase(args, parent=self.application)
        thePlugin = runner.getPlugin()
        theEtree = thePlugin.container.getEtree(excludeUnset=True)
        assert len(theEtree.findall(".//selection/text")) == 1

    def test5(self):
        # self.assertDictEqual(CCP4i2RunnerBase.parseFileUse("prosmart_refmac[-1].XYZOUT[2]"),
        #                     {"task_name": "prosmart_refmac", "jobIndex": "-1", "jobParamName": "XYZOUT", "paramIndex": "2"})
        self.assertDictEqual(
            CCP4i2RunnerBase.parseFileUse("refmac[-1].XYZOUT[2]"),
            {
                "task_name": "refmac",
                "jobIndex": -1,
                "jobParamName": "XYZOUT",
                "paramIndex": 2,
            },
        )
        self.assertDictEqual(
            CCP4i2RunnerBase.parseFileUse("[-1].XYZOUT[2]"),
            {
                "task_name": None,
                "jobIndex": -1,
                "jobParamName": "XYZOUT",
                "paramIndex": 2,
            },
        )
        self.assertDictEqual(
            CCP4i2RunnerBase.parseFileUse("[-1].XYZOUT"),
            {
                "task_name": None,
                "jobIndex": -1,
                "jobParamName": "XYZOUT",
                "paramIndex": -1,
            },
        )
        self.assertDictEqual(
            CCP4i2RunnerBase.parseFileUse("refmac[-1].XYZOUT"),
            {
                "task_name": "refmac",
                "jobIndex": -1,
                "jobParamName": "XYZOUT",
                "paramIndex": -1,
            },
        )

    def test6(self):
        args = [
            "prosmart_refmac",
            "--XYZIN",
            TestParse.modelPdb,
            'selection/text="A/"',
            "--F_SIGF",
            'fileUse="aimless_pipeline[-1].HKLOUT[0]"',
        ]
        theRunner = CCP4i2RunnerBase(args, parent=self.application)
        thePlugin = theRunner.getPlugin()
        theEtree = thePlugin.container.getEtree(excludeUnset=True)
