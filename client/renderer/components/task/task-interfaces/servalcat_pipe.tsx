import {
  Button,
  Grid2,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious, useProject } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useCallback, useContext, useEffect, useMemo } from "react";
import {
  CCP4i2ErrorReport,
  CCP4i2RunActions,
  RunCheckContext,
} from "../../../providers/run-check-provider";
import { Job } from "../../../types/models";
import { useRouter } from "next/navigation";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;

  const { getTaskItem, createPeerTask } = useJob(job.id);

  const { value: HKLINValue } = getTaskItem("servalcat_pipe.inputData.HKLIN");
  const { value: MAP_SHARP } = getTaskItem("MAP_SHARP");
  const { value: MAP_SHARP_CUSTOM } = getTaskItem("MAP_SHARP_CUSTOM");

  const intensitiesAvailable = useMemo(() => {
    return [1, 3].includes(HKLINValue?.contentFlag);
  }, [HKLINValue]);

  const router = useRouter();

  // 1. Retrieve the jobs validation: this will be kept up to date automatically as parameters
  //change.  Also retrieve getTaskItem function
  const { validation } = useJob(job.id);

  // 2. get the prevailing value of FREERFLAG: this will be updated on each re-render

  const { value: freeRFlag } = getTaskItem("FREERFLAG");

  // 3. Retrieve the function for setting a processed Error Report

  const {
    processedErrors,
    setProcessedErrors,
    extraDialogActions,
    setExtraDialogActions,
    setRunTaskRequested,
  } = useContext(RunCheckContext);

  const createFreeRTask = useCallback(async () => {
    await createPeerTask("freerflag").then((created_job: Job) => {
      if (created_job) {
        // If the task was created successfully, we can navigate to it
        router.push(`/project/${job.project}/job/${created_job.id}`);
        //Shut down the run check dialog
        setRunTaskRequested(null);
      }
    });
  }, [job, createPeerTask]);

  // Process the errors, adding a non-blocking (maxSeverity 3) error if the Free R flag is not set
  // This is done to ensure that the user is aware of the missing Free R flag,
  // but it does not block the execution of the task.
  // The processedErrors state is updated only if the new errors are different from the previous ones
  // to prevent unnecessary re-renders.
  useEffect(() => {
    if (validation) {
      const newProcessedErrors = Object.fromEntries(
        Object.entries(validation as CCP4i2ErrorReport).filter(
          ([key, _]) =>
            key !== "servalcat_pipe.metalCoordWrapper.inputData.XYZIN"
        )
      );
      if (!(freeRFlag?.dbFileId?.length > 0)) {
        // If the Free R flag is not set, we add an overridable serious error report.
        newProcessedErrors.FREERFLAG = {
          messages: [
            "Setting the Free R flag file is strongly recommended for refinement",
            "You are advised to select an existing set or create a new one ",
          ],
          maxSeverity: 3, //maxSeverity of 2 causes the confirm dialog to show, and prevents execution
          // maxSeverity of 3 causes confirm dialog to show, but allows execution
        };
      }

      // Only update if processedErrors have changed. This prevents unnecessary re-renders. Use JSON.stringify to compare objects
      // Note: This is a simple way to compare objects.
      if (
        JSON.stringify(newProcessedErrors) !== JSON.stringify(processedErrors)
      ) {
        setProcessedErrors(newProcessedErrors);
      }
    }
  }, [validation, freeRFlag, processedErrors, setProcessedErrors]);

  useEffect(() => {
    if (!(freeRFlag?.dbFileId?.length > 0)) {
      // If the Free R flag is not set, we add an action to create a Free R task
      // This will be shown in the confirm dialog.  As ever when changing state,
      // we check if the action is already there to avoid unnecessary re-renders.
      if (!extraDialogActions || !extraDialogActions["FREERFLAG"]) {
        const newExtraDialogActions = {
          FREERFLAG: (
            <Button variant="contained" onClick={createFreeRTask}>
              Create FreeR task
            </Button>
          ),
        };
        setExtraDialogActions(newExtraDialogActions);
      }
    }
  }, [freeRFlag, setExtraDialogActions, createFreeRTask, extraDialogActions]);

  //This is a really important cleanup function to avoid memory leaks
  //It ensures that processedErrors and extraDialogActions are cleared when the component unmounts
  useEffect(() => {
    // Cleanup function to reset context values when the component unmounts
    return () => {
      setExtraDialogActions(null);
      setProcessedErrors(null);
    };
  }, [setExtraDialogActions, setProcessedErrors]);

  return (
    <CCP4i2Tabs>
      <CCP4i2Tab label="Input data">
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          containerHint="BlockLevel"
          qualifiers={{ guiLabel: "Main inputs" }}
        >
          <div
            style={{
              borderRadius: "0.5rem",
              padding: "1rem",
              border: "3px solid grey",
            }}
          >
            <CCP4i2TaskElement
              {...props}
              itemName="servalcat_pipe.inputData.XYZIN"
            />
          </div>
          <div
            style={{
              borderRadius: "0.5rem",
              padding: "1rem",
              border: "3px solid grey",
            }}
          >
            <CCP4i2TaskElement {...props} itemName="HKLIN" />
            {intensitiesAvailable ? (
              <CCP4i2TaskElement
                {...props}
                itemName="F_SIGF_OR_I_SIGI"
                qualifiers={{ guiLabel: "Refinement against" }}
              />
            ) : (
              <Typography variant="body1">
                Using <b>amplitudes</b>
              </Typography>
            )}
            <CCP4i2TaskElement {...props} itemName="FREERFLAG" />
          </div>
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          containerHint="BlockLevel"
          size={{ xs: 12 }}
          qualifiers={{ guiLabel: "Additional geomtery dictionaries" }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="DICT_LIST"
            qualifiers={{ guiLabel: "Dictionaries" }}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
      <CCP4i2Tab label="Output" key="Output">
        <CCP4i2TaskElement
          {...props}
          itemName="USE_NCS"
          qualifiers={{
            guiLabel: "Use NCS if present",
          }}
          visibility={() => true}
          key="USE_NCS"
        />
        <CCP4i2TaskElement
          {...props}
          itemName="USE_TWIN"
          visibility={() => true}
          key="USE_TWIN"
        />
        <CCP4i2ContainerElement
          key="Output options"
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Output options" }}
          containerHint="BlockLevel"
        >
          <CCP4i2TaskElement
            {...props}
            itemName="OUTPUT_HYDROGENS"
            qualifiers={{
              guiLabel: "Output calculated riding hydrogens to file",
            }}
          />
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          itemName=""
          key="Map calculation"
          {...props}
          qualifiers={{ guiLabel: "Map calculation" }}
          containerHint="BlockLevel"
        >
          <CCP4i2TaskElement
            {...props}
            itemName="MAP_SHARP"
            qualifiers={{
              guiLabel: "Perform map sharpening when calculating maps",
            }}
            key="MAP_SHARP"
          />

          <Grid2 container key="Sharpen row">
            <Grid2 size={{ xs: 6 }} key="Col1">
              <CCP4i2TaskElement
                {...props}
                itemName="MAP_SHARP_CUSTOM"
                qualifiers={{
                  guiLabel: "Use custom sharpening parameter (B-factor)",
                }}
                visibility={() => MAP_SHARP}
                key="MAP_SHARP_CUSTOM"
              />
            </Grid2>
            <Grid2 size={{ xs: 6 }} key="Col2">
              <CCP4i2TaskElement
                {...props}
                itemName="BSHARP"
                qualifiers={{ guiLabel: "B factor to use" }}
                visibility={() => MAP_SHARP && MAP_SHARP_CUSTOM}
                key="BSHARP"
              />
            </Grid2>
          </Grid2>
        </CCP4i2ContainerElement>
        <CCP4i2ContainerElement
          itemName=""
          {...props}
          qualifiers={{ guiLabel: "Validation and analysis" }}
          containerHint="BlockLevel"
          size={{ xs: 4 }}
          elementSx={{ minWidth: "8rem" }}
          key="Validation"
        >
          <CCP4i2TaskElement
            key={1}
            {...props}
            itemName="VALIDATE_BAVERAGE"
            qualifiers={{ guiLabel: "Analyse B-factor distributions" }}
          />
          <CCP4i2TaskElement
            key={2}
            {...props}
            itemName="VALIDATE_RAMACHANDRAN"
            qualifiers={{ guiLabel: "Calculate Ramachandran plots" }}
          />
          <CCP4i2TaskElement
            key={3}
            {...props}
            itemName="VALIDATE_MOLPROBITY"
            qualifiers={{ guiLabel: "Run MolProbity to analyse geometry" }}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};
export default TaskInterface;
