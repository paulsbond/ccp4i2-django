import { Button, Grid2, Paper } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious, useProject } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useCallback, useContext, useEffect, useMemo } from "react";
import type { CCP4i2RunActions } from "../../../providers/run-check-provider";
import {
  RunCheckContext,
  useRunCheck,
} from "../../../providers/run-check-provider";
import { useRouter } from "next/navigation";
import { Job } from "../../../types/models";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const {
    processedErrors,
    setProcessedErrors,
    setExtraDialogActions,
    extraDialogActions = [],
  } = useContext(RunCheckContext);

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  //const { data: F_SIGFDigest } = api.digest<any>(
  //  `jobs/${job.id}/digest?object_path=prosmart_refmac.inputData.F_SIGF`
  //);

  //This magic means that the following variables will be kept up to date with the values of the associated parameters
  const { getTaskItem, getFileDigest, validation } = useJob(job.id);

  const { data: F_SIGFDigest } = getFileDigest(
    "prosmart_refmac.inputData.F_SIGF"
  );
  const { value: refinementMode } = getTaskItem("REFINEMENT_MODE");
  const { value: freeRFlag } = getTaskItem("FREERFLAG");
  const { value: solventAdvanced } = getTaskItem("SOLVENT_ADVANCED");
  const { value: solventMaskType } = getTaskItem("SOLVENT_MASK_TYPE");
  const { value: tlsMode } = getTaskItem("TLSMODE");
  const { value: bfacSetUse } = getTaskItem("BFACSETUSE");
  const { update: updateWAVELENGTH, value: wavelength } =
    getTaskItem("WAVELENGTH");
  const { value: MAP_SHARP } = getTaskItem("MAP_SHARP");
  const { value: MAP_SHARP_CUSTOM } = getTaskItem("MAP_SHARP_CUSTOM");

  const oldFileDigest = usePrevious<any>(F_SIGFDigest);
  const router = useRouter();
  const { setRunTaskRequested } = useRunCheck();

  const { mutateJobs } = useProject(job.project);

  const projectId = useMemo(() => {
    return job.project;
  }, [job]);

  const handleF_SIGFDigestChanged = useCallback(
    (digest: any) => {
      if (!updateWAVELENGTH) return;
      if (!digest || JSON.stringify(digest) === JSON.stringify(oldFileDigest))
        return;
      if (!job || job.status != 1) return;
      const asyncFunc = async () => {
        console.log(digest);
        //Here if the file Digest has changed
        if (digest?.digest?.wavelengths?.at(-1) < 9) {
          await updateWAVELENGTH(digest.digest.wavelengths.at(-1));
        }
      };
      asyncFunc();
    },
    [updateWAVELENGTH, job]
  );

  useEffect(() => {
    handleF_SIGFDigestChanged(F_SIGFDigest);
  }, [F_SIGFDigest]);

  const createFreeRTask = useCallback(async () => {
    // This function can be used to create a Free R task
    // It can be customized to perform specific actions when the button is clicked
    console.log("Creating Free R task...");
    // You can add logic here to create the task, e.g., navigating to a new page or opening a dialog
    const created_job_result: any = await api.post(
      `projects/${projectId}/create_task/`,
      {
        task_name: "freerflag",
      }
    );
    if (created_job_result?.status === "Success") {
      const created_job: Job = created_job_result.new_job;
      mutateJobs();
      router.push(`/project/${projectId}/job/${created_job.id}`);
      setRunTaskRequested(null);
    }
  }, [projectId, api, mutateJobs, router]);

  // Process the errors, adding a non-blocking (maxSeverity 3) error if the Free R flag is not set
  // This is done to ensure that the user is aware of the missing Free R flag,
  // but it does not block the execution of the task.
  // The processedErrors state is updated only if the new errors are different from the previous ones
  // to prevent unnecessary re-renders.
  useEffect(() => {
    if (validation) {
      const newProcessedErrors = { ...validation };
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
  }, [
    validation,
    freeRFlag,
    refinementMode,
    processedErrors,
    setProcessedErrors,
  ]);

  useEffect(() => {
    if (!(freeRFlag?.dbFileId?.length > 0)) {
      // If the Free R flag is not set, we add an action to create a Free R task
      // This will be shown in the confirm dialog.  As ever when changing state,
      // we check if the action is already there to avoid unnecessary re-renders.
      if (!extraDialogActions || !extraDialogActions["FREERFLAG"]) {
        const newExtraDialogActions = {
          FREERFLAG: (
            <Button onClick={createFreeRTask}>Create FreeR task</Button>
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

  // Render the task interface
  return (
    <Paper>
      <CCP4i2Tabs>
        <CCP4i2Tab label="Input data">
          <CCP4i2TaskElement
            itemName="F_SIGF"
            {...props}
            qualifiers={{ guiLabel: "Reflection" }}
          />
          <CCP4i2TaskElement
            itemName="WAVELENGTH"
            {...props}
            qualifiers={{ guiLabel: "Wavelength" }}
          />
          <CCP4i2TaskElement itemName="FREERFLAG" {...props} />
          <CCP4i2TaskElement
            itemName="XYZIN"
            {...props}
            qualifiers={{ guiLabel: "Coordinates" }}
          />
          <CCP4i2TaskElement
            itemName="DICT_LIST"
            {...props}
            qualifiers={{ guiLabel: "Dictionaries" }}
          />
          <CCP4i2TaskElement
            itemName="NCYCRIGID"
            {...props}
            qualifiers={{ guiLabel: "Number of rigid body cycles" }}
            visibility={() => refinementMode === "RIGID"}
          />
          <CCP4i2TaskElement
            itemName="NCYCLES"
            {...props}
            qualifiers={{ guiLabel: "Number of cycles" }}
            visibility={() => refinementMode === "RESTR"}
          />
          <CCP4i2TaskElement
            itemName="REFINEMENT_MODE"
            {...props}
            qualifiers={{ guiLabel: "Refinement mode" }}
          />
        </CCP4i2Tab>

        {/*}
        The parameterisation tab
        */}

        <CCP4i2Tab label="Parameterisation" key="Parameterisation">
          <CCP4i2ContainerElement
            itemName=""
            key="B-factors"
            {...props}
            qualifiers={{ guiLabel: "B-factors" }}
            containerHint="BlockLevel"
          >
            <Grid2 container key="Row1">
              <Grid2 size={{ xs: 12 }} key="solscale">
                <CCP4i2TaskElement
                  {...props}
                  itemName="B_REFINEMENT_MODE"
                  qualifiers={{ guiLabel: "B-factors" }}
                />
              </Grid2>
            </Grid2>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            itemName=""
            key="Scaling"
            {...props}
            qualifiers={{ guiLabel: "Scaling" }}
            containerHint="BlockLevel"
          >
            <Grid2 container key="Row1">
              <Grid2 size={{ xs: 6 }} key="solscale">
                <CCP4i2TaskElement
                  {...props}
                  itemName="SCALE_TYPE"
                  qualifiers={{ guiLabel: "Use" }}
                />
              </Grid2>
              <Grid2 size={{ xs: 6 }} key="masktype">
                <CCP4i2TaskElement
                  {...props}
                  itemName="SOLVENT_MASK_TYPE"
                  qualifiers={{
                    guiLabel: (
                      <span style={{ marginLeft: "1rem", marginRight: "1rem" }}>
                        solvent scaling, with mask type
                      </span>
                    ),
                  }}
                />
              </Grid2>
            </Grid2>
            <CCP4i2TaskElement
              {...props}
              itemName="SOLVENT_ADVANCED"
              qualifiers={{
                guiLabel: "Use custom solvent mask parameters",
              }}
              key="SOLVENT_ADVANCED"
              visibility={() => {
                console.log("In visibility");
                return solventMaskType === "EXPLICIT";
              }}
            />
            <CCP4i2ContainerElement
              itemName=""
              {...props}
              qualifiers={{ guiLabel: "Custom parameters" }}
              containerHint="BlockLevel"
              key="Custom parameters"
              size={{ xs: 4 }}
              elementSx={{ my: 0, py: 0, minWidth: "5rem" }}
              visibility={() => {
                return solventMaskType === "EXPLICIT" && solventAdvanced;
              }}
            >
              <CCP4i2TaskElement
                {...props}
                itemName="SOLVENT_VDW_RADIUS"
                key="SOLVENT_VDW_RADIUS"
                qualifiers={{
                  guiLabel: "Increase VDW Radius of non-ion atoms by ",
                }}
              />
              <CCP4i2TaskElement
                {...props}
                itemName="SOLVENT_IONIC_RADIUS"
                key="SOLVENT_IONIC_RADIUS"
                qualifiers={{
                  guiLabel: "Increase VDW Radius of potential ion atoms by ",
                }}
              />
              <CCP4i2TaskElement
                {...props}
                itemName="SOLVENT_SHRINK"
                key="SOLVENT_SHRINK"
                qualifiers={{
                  guiLabel: "Shrink the mask area by a factor of",
                }}
              />
            </CCP4i2ContainerElement>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            itemName=""
            key="Translation libration screw (TLS)"
            {...props}
            qualifiers={{ guiLabel: "Translation libration screw (TLS)" }}
            containerHint="BlockLevel"
          >
            <Grid2 container key="row1">
              <Grid2 size={{ xs: 6 }} key="col1">
                <CCP4i2TaskElement
                  {...props}
                  itemName="TLSMODE"
                  qualifiers={{
                    guiLabel: "TLS parameters",
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 6 }} key="col12">
                <CCP4i2TaskElement
                  {...props}
                  itemName="NTLSCYCLES"
                  qualifiers={{
                    guiLabel: "Number of TLS cycles",
                  }}
                  visibility={() => tlsMode !== "NONE"}
                />
              </Grid2>
            </Grid2>
            <CCP4i2ContainerElement
              itemName=""
              key="Custom parameters"
              {...props}
              qualifiers={{ guiLabel: "Custom parameters" }}
              containerHint="BlockLevel"
              visibility={() => tlsMode !== "NONE"}
            >
              <CCP4i2TaskElement
                {...props}
                itemName="TLSIN"
                key=""
                qualifiers={{
                  guiLabel: "TLS coefficients",
                }}
                visibility={() => tlsMode === "FILE"}
              />
              <Grid2 container key="row1">
                <Grid2 size={{ xs: 6 }} key="col1">
                  <CCP4i2TaskElement
                    {...props}
                    itemName="BFACSETUSE"
                    qualifiers={{
                      guiLabel: "Reset all B-factors at start ",
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 6 }} key="col2">
                  <CCP4i2TaskElement
                    {...props}
                    itemName="BFACSET"
                    qualifiers={{
                      guiLabel: "...to a value of",
                    }}
                    visibility={() => bfacSetUse}
                  />
                </Grid2>
              </Grid2>
              <CCP4i2TaskElement
                {...props}
                itemName="TLSOUT_ADDU"
                qualifiers={{
                  guiLabel:
                    "Add TLS contribution to output B-factors (only for analysis and deposition)",
                }}
              />
            </CCP4i2ContainerElement>
          </CCP4i2ContainerElement>
        </CCP4i2Tab>
        <CCP4i2Tab label="Output" key="Output">
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

        <CCP4i2Tab label="Prosmart">
          <CCP4i2ContainerElement
            {...props}
            itemName="prosmartProtein"
            containerHint="FolderLevel"
            qualifiers={{
              guiLabel: "Prosmart - protein",
            }}
          />
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
