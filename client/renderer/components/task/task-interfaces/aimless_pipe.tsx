import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useContext, useEffect } from "react";
import { RunCheckContext } from "../../../providers/run-check-provider";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;

  //This magic means that the following variables will be kept up to date with the values of the associated parameters
  const { getTaskItem } = useJob(job.id);

  const { value: chooseModeValue } = getTaskItem("CHOOSE_MODE");
  const { value: modeValue } = getTaskItem("MODE");
  const { value: aimlessRefValue } = getTaskItem("REFERENCE_FOR_AIMLESS");
  const { value: reference_datasetValue } = getTaskItem("REFERENCE_DATASET");

  // 1. Retrieve the function for installing the processing callback from the relevant context
  // layer

  const { setProcessErrorsCallback, processErrorsCallback } =
    useContext(RunCheckContext);

  // 2. Define an error processing callback.  In this case filters out issues with
  // aimless_pipe.controlParameters.CELL.
  const myProcessErrorsCallback = (validation: any) => {
    //Null action for validation null or undefined
    if (!validation) return validation;
    // Filter out keys that start with "aimless_pipe.controlParameters.cells"
    const filteredValidation = Object.keys(validation)
      .filter((key) => !key.startsWith("aimless_pipe.controlParameters.CELL."))
      .reduce((acc, key) => {
        acc[key] = validation[key];
        return acc;
      }, {} as any);

    return filteredValidation;
  };

  // 3. Use a useEffect to install the filtering callback, and clean up when the task interface
  // unmounts

  useEffect(() => {
    //Proceed only if the callback is not already set
    //This is to avoid setting the callback multiple times, which could lead to unexpected behavior
    //and to ensure that the callback is set only once when the component mounts
    if (!processErrorsCallback) {
      //Notice the esential (but unusual) syntax of the following line
      //This is a function that will be called to process errors, and it will filter out
      //any errors that are related to the cell parameters of the aimless_pipe task
      setProcessErrorsCallback(() => myProcessErrorsCallback);
    }
    return () => {
      if (processErrorsCallback) setProcessErrorsCallback(null);
    };
  }, []);

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab label="Main inputs" key="1">
        <CCP4i2ContainerElement
          key="Files"
          itemName=""
          containerHint="BlockLevel"
          {...props}
          qualifiers={{
            initiallyOpen: true,
            guiLabel: "File inputs",
          }}
        >
          <CCP4i2TaskElement
            {...props}
            key="UNMERGEDFILES"
            itemName="UNMERGEDFILES"
            qualifiers={{ guiLabel: "Unmerged files" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="FREERFLAG"
            itemName="FREERFLAG"
            qualifiers={{ guiLabel: "Free R set to use/extend" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="HKLIN_IS_SCALED"
            itemName="HKLIN_IS_SCALED"
            qualifiers={{ guiLabel: "Analyse data without determining scales" }}
          />
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          key="Parameters"
          containerHint="FolderLevel"
          qualifiers={{
            guiLabel: "Parameters",
            initiallyOpen: true,
          }}
        >
          <CCP4i2TaskElement
            {...props}
            key="AUTOCUTOFF"
            itemName="AUTOCUTOFF"
            qualifiers={{ guiLabel: "Apply auto. data cutoff" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="RESOLUTION_RANGE"
            itemName="RESOLUTION_RANGE"
            qualifiers={{ guiLabel: "Resolution" }}
          />
          <CCP4i2TaskElement
            {...props}
            key="OVERRIDE_CELL_DIFFERENCE"
            qualifiers={{ guiLabel: "Override cell difference" }}
            itemName="OVERRIDE_CELL_DIFFERENCE"
          />
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          {...props}
          key="ChoosingSpace"
          itemName=""
          containerHint="FolderLevel"
          qualifiers={{
            guiLabel: "Choosing spacegroup",
            initiallyOpen: true,
          }}
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
            qualifiers={{
              guiLabel: "Choice options",
            }}
            visibility={() => {
              return modeValue === "CHOOSE";
            }}
          >
            <CCP4i2TaskElement
              {...props}
              key="CHOOSE_MODE"
              itemName="CHOOSE_MODE"
              qualifiers={{ guiLabel: "Symmetry choice mode" }}
              visibility={() => {
                return modeValue === "CHOOSE";
              }}
            />
            <CCP4i2TaskElement
              {...props}
              key="CHOOSE_SOLUTION_NO"
              itemName="CHOOSE_SOLUTION_NO"
              qualifiers={{ guiLabel: "Solution no. to choose" }}
              visibility={() => {
                return (
                  modeValue === "CHOOSE" && chooseModeValue === "SOLUTION_NO"
                );
              }}
            />
            <CCP4i2TaskElement
              {...props}
              key="CHOOSE_SPACEGROUP"
              itemName="CHOOSE_SPACEGROUP"
              qualifiers={{
                guiLabel: "Spacegroup to choose",
              }}
              visibility={() => {
                //console.log({ modeValue, chooseModeValue });
                return (
                  modeValue === "CHOOSE" &&
                  (chooseModeValue === "SPACEGROUP" ||
                    chooseModeValue === "REINDEX_SPACE")
                );
              }}
            />
            <CCP4i2TaskElement
              {...props}
              key="REINDEX_OPERATOR"
              itemName="REINDEX_OPERATOR"
              qualifiers={{ guiLabel: "Reindexing operator" }}
              visibility={() => {
                return (
                  modeValue === "CHOOSE" && chooseModeValue === "REINDEX_SPACE"
                );
              }}
            />
            <CCP4i2TaskElement
              {...props}
              key="CHOOSE_LAUEGROUP"
              itemName="CHOOSE_LAUEGROUP"
              qualifiers={{ guiLabel: "Lauegroup to choose" }}
              visibility={() => {
                return (
                  modeValue === "CHOOSE" && chooseModeValue === "LAUEGROUP"
                );
              }}
            />
          </CCP4i2ContainerElement>
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            key="Specify refrence"
            containerHint="BlockLevel"
            qualifiers={{
              guiLabel: "Specify reference",
            }}
            visibility={() => {
              return modeValue === "MATCH";
            }}
          >
            <CCP4i2TaskElement
              {...props}
              key="REFERENCE_FOR_AIMLESS"
              itemName="REFERENCE_FOR_AIMLESS"
              qualifiers={{ guiLabel: "Reference" }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="REFERENCE_DATASET"
              qualifiers={{ guiLabel: "Reference type" }}
              visibility={() => {
                return modeValue === "MATCH" && aimlessRefValue;
              }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="HKLIN_REF"
              qualifiers={{ guiLabel: "Reference reflections" }}
              visibility={() => {
                return (
                  modeValue === "MATCH" &&
                  aimlessRefValue &&
                  reference_datasetValue === "HKL"
                );
              }}
            />
            <CCP4i2TaskElement
              {...props}
              itemName="XYZIN_REF"
              qualifiers={{ guiLabel: "Reference coordinates" }}
              visibility={() => {
                return (
                  modeValue === "MATCH" &&
                  aimlessRefValue &&
                  reference_datasetValue === "XYZ"
                );
              }}
            />
          </CCP4i2ContainerElement>
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default TaskInterface;
