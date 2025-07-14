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

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  //const { data: HKLINDigest } = api.digest<any>(
  //  `jobs/${job.id}/digest?object_path=servalcat_pipe.inputData.HKLIN`
  //);

  //This magic means that the following variables will be kept up to date with the values of the associated parameters
  const { getTaskItem } = useJob(job.id);

  const { value: HKLINValue } = getTaskItem("servalcat_pipe.inputData.HKLIN");
  const { value: MAP_SHARP } = getTaskItem("MAP_SHARP");
  const { value: MAP_SHARP_CUSTOM } = getTaskItem("MAP_SHARP_CUSTOM");
  const { mutateJobs } = useProject(job.project);

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
    // This function can be used to create a Free R task
    // It can be customized to perform specific actions when the button is clicked
    console.log("Creating Free R task...");
    // You can add logic here to create the task, e.g., navigating to a new page or opening a dialog
    const created_job_result: any = await api.post(
      `projects/${job.project}/create_task/`,
      {
        task_name: "freerflag",
      }
    );
    if (created_job_result?.status === "Success") {
      const created_job: Job = created_job_result.new_job;
      mutateJobs();
      router.push(`/project/${job.project}/job/${created_job.id}`);
      setRunTaskRequested(null);
    }
  }, [job, api, mutateJobs, router]);

  // Process the errors and set them in the context
  useEffect(() => {
    if (!validation) return;
    const filteredValidation = Object.keys(validation)
      .filter(
        (key) =>
          !key.startsWith("servalcat_pipe.metalCoordWrapper.inputData.XYZIN")
      )
      .reduce((acc, key) => {
        acc[key] = validation[key];
        return acc;
      }, {} as any);
    const newProcessedErrors = { ...filteredValidation };

    if (!(freeRFlag?.dbFileId?.length > 0)) {
      // If the Free R flag is not set, we add an overridable serious error report.
      if (processedErrors?.FREERFLAG) return;
      newProcessedErrors.FREERFLAG = {
        messages: [
          "Setting the Free R flag file is strongly recommended for refinement",
          "You are advised to select an existing set or create a new one ",
        ],
        maxSeverity: 3, //maxSeverity of 2 causes the confirm dialog to show, and prevents execution
        // maxSeverity of 3 causes confirm dialog to show, but allows execution
      };
    }

    // Only update if processedErrors have changed
    if (
      JSON.stringify(newProcessedErrors) !== JSON.stringify(processedErrors)
    ) {
      setProcessedErrors(newProcessedErrors);
    }

    //Tidy up on unmount
    return () => {
      console.log("Unmounting");
      if (processedErrors) setProcessedErrors(null);
    };
  }, [validation, freeRFlag, processedErrors, setProcessedErrors]);

  useEffect(() => {
    const newExtraDialogActions: CCP4i2RunActions = {};

    if (!(freeRFlag?.dbFileId?.length > 0)) {
      newExtraDialogActions.FREERFLAG = (
        <Button onClick={createFreeRTask}>Create FreeR task</Button>
      );
    }

    // To avoid unnecessary updates, we check if the extraDialogActions have changed
    // before setting them. This prevents unnecessary re-renders and updates.
    // We use JSON.stringify to compare the objects, which is a simple way to check for
    // deep equality in this case. Note extraDialogActions is a non-serializable object,
    // so we compare keys.
    if (
      JSON.stringify(Object.keys(newExtraDialogActions)) !==
      JSON.stringify(Object.keys(extraDialogActions))
    ) {
      setExtraDialogActions(newExtraDialogActions);
    }

    //Tidy up on unmount
    return () => {
      if (Object.keys(extraDialogActions).length > 0) setExtraDialogActions({});
    };
  }, [
    validation,
    freeRFlag,
    processedErrors,
    setProcessedErrors,
    setExtraDialogActions,
    createFreeRTask,
    extraDialogActions,
  ]);

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
