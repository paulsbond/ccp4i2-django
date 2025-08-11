import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useJob } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useContext, useEffect, useMemo } from "react";
import { RunCheckContext } from "../../../providers/run-check-provider";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const { job } = props;
  const { getTaskItem, validation } = useJob(job.id);
  const { processedErrors, setProcessedErrors } = useContext(RunCheckContext);

  // Extract task values
  const taskValues = {
    chooseMode: getTaskItem("CHOOSE_MODE").value,
    mode: getTaskItem("MODE").value,
    hklinRef: getTaskItem("HKLIN_REF").value,
    aimlessRef: getTaskItem("REFERENCE_FOR_AIMLESS").value,
    referenceDataset: getTaskItem("REFERENCE_DATASET").value,
  };

  // Process validation errors
  const processedValidationErrors = useMemo(() => {
    if (!validation) return null;

    const filtered = Object.keys(validation)
      .filter((key) => !key.startsWith("aimless_pipe.controlParameters.CELL."))
      .reduce((acc, key) => ({ ...acc, [key]: validation[key] }), {});

    // Add custom validation for HKLIN_REF
    if (
      taskValues.mode === "MATCH" &&
      taskValues.aimlessRef &&
      taskValues.referenceDataset === "HKL" &&
      !taskValues.hklinRef.dbFileId
    ) {
      filtered["aimless_pipe.inputData.HKLIN_REF"] = {
        messages: ["HKLIN_REF must be set when being used for match"],
        maxSeverity: 2,
      };
    }

    return filtered;
  }, [
    validation,
    taskValues.mode,
    taskValues.aimlessRef,
    taskValues.referenceDataset,
    taskValues.hklinRef,
  ]);

  // Update processed errors only when they change
  useEffect(() => {
    if (
      JSON.stringify(processedValidationErrors) !==
      JSON.stringify(processedErrors)
    ) {
      setProcessedErrors(processedValidationErrors);
    }
  }, [processedValidationErrors, processedErrors, setProcessedErrors]);

  // Cleanup on unmount
  useEffect(() => () => setProcessedErrors(null), [setProcessedErrors]);

  // Visibility conditions
  const isChooseMode = () => taskValues.mode === "CHOOSE";
  const isMatchMode = () => taskValues.mode === "MATCH";
  const isChooseSolution = () =>
    isChooseMode() && taskValues.chooseMode === "SOLUTION_NO";
  const isChooseSpacegroup = () =>
    isChooseMode() &&
    ["SPACEGROUP", "REINDEX_SPACE"].includes(taskValues.chooseMode);
  const isReindexSpace = () =>
    isChooseMode() && taskValues.chooseMode === "REINDEX_SPACE";
  const isChooseLauegroup = () =>
    isChooseMode() && taskValues.chooseMode === "LAUEGROUP";
  const hasAimlessRef = () => isMatchMode() && taskValues.aimlessRef;
  const isHklReference = () =>
    hasAimlessRef() && taskValues.referenceDataset === "HKL";
  const isXyzReference = () =>
    hasAimlessRef() && taskValues.referenceDataset === "XYZ";

  // Component configurations
  const fileInputs = [
    { key: "UNMERGEDFILES", label: "Unmerged files" },
    { key: "FREERFLAG", label: "Free R set to use/extend" },
    {
      key: "HKLIN_IS_SCALED",
      label: "Analyse data without determining scales",
    },
  ];

  const parameters = [
    { key: "AUTOCUTOFF", label: "Apply auto. data cutoff" },
    { key: "RESOLUTION_RANGE", label: "Resolution" },
    { key: "OVERRIDE_CELL_DIFFERENCE", label: "Override cell difference" },
  ];

  const choiceOptions = [
    {
      key: "CHOOSE_MODE",
      label: "Symmetry choice mode",
      visible: isChooseMode,
    },
    {
      key: "CHOOSE_SOLUTION_NO",
      label: "Solution no. to choose",
      visible: isChooseSolution,
    },
    {
      key: "CHOOSE_SPACEGROUP",
      label: "Spacegroup to choose",
      visible: isChooseSpacegroup,
    },
    {
      key: "REINDEX_OPERATOR",
      label: "Reindexing operator",
      visible: isReindexSpace,
    },
    {
      key: "CHOOSE_LAUEGROUP",
      label: "Lauegroup to choose",
      visible: isChooseLauegroup,
    },
  ];

  const referenceOptions = [
    { key: "REFERENCE_FOR_AIMLESS", label: "Reference", visible: isMatchMode },
    {
      key: "REFERENCE_DATASET",
      label: "Reference type",
      visible: hasAimlessRef,
    },
    {
      key: "HKLIN_REF",
      label: "Reference reflections",
      visible: isHklReference,
    },
    {
      key: "XYZIN_REF",
      label: "Reference coordinates",
      visible: isXyzReference,
    },
  ];

  const renderElements = (elements: typeof fileInputs) =>
    elements.map(({ key, label }) => (
      <CCP4i2TaskElement
        {...props}
        key={key}
        itemName={key}
        qualifiers={{ guiLabel: label }}
      />
    ));

  const renderConditionalElements = (elements: typeof choiceOptions) =>
    elements.map(({ key, label, visible }) => (
      <CCP4i2TaskElement
        {...props}
        key={key}
        itemName={key}
        qualifiers={{ guiLabel: label }}
        visibility={visible}
      />
    ));

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab label="Main inputs" key="1">
        <CCP4i2ContainerElement
          {...props}
          key="Files"
          itemName=""
          containerHint="BlockLevel"
          qualifiers={{ initiallyOpen: true, guiLabel: "File inputs" }}
        >
          {renderElements(fileInputs)}
        </CCP4i2ContainerElement>

        <CCP4i2ContainerElement
          {...props}
          key="Parameters"
          itemName=""
          containerHint="BlockLevel"
          qualifiers={{ guiLabel: "Parameters", initiallyOpen: true }}
        >
          {renderElements(parameters)}
        </CCP4i2ContainerElement>

        <CCP4i2ContainerElement
          {...props}
          key="ChoosingSpace"
          itemName=""
          containerHint="BlockLevel"
          qualifiers={{ guiLabel: "Choosing spacegroup", initiallyOpen: true }}
        >
          <CCP4i2TaskElement
            {...props}
            key="MODE"
            itemName="MODE"
            qualifiers={{ guiLabel: "Pipeline mode" }}
          />

          <CCP4i2ContainerElement
            {...props}
            key="ChoiceOptions"
            itemName=""
            containerHint="BlockLevel"
            qualifiers={{ guiLabel: "Choice options" }}
            visibility={isChooseMode}
          >
            {renderConditionalElements(choiceOptions)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            key="SpecifyReference"
            itemName=""
            containerHint="BlockLevel"
            qualifiers={{ guiLabel: "Specify reference" }}
            visibility={isMatchMode}
          >
            {renderConditionalElements(referenceOptions)}
          </CCP4i2ContainerElement>
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default TaskInterface;
