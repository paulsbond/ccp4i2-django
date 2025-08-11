import { Button, Grid2, Paper } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious, useProject } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import {
  RunCheckContext,
  useRunCheck,
} from "../../../providers/run-check-provider";
import { useRouter } from "next/navigation";
import { Job } from "../../../types/models";

// Helper function for safe object comparison
const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a !== typeof b) return false;

  // Handle React elements and functions
  if (typeof a === "function" || typeof a === "object") {
    // For React elements, compare their key properties
    if (a.$$typeof && b.$$typeof) {
      return a.type === b.type && a.key === b.key;
    }

    // For objects, do a shallow comparison of serializable properties
    try {
      const aKeys = Object.keys(a).filter(
        (key) => typeof a[key] !== "function" && !key.startsWith("_")
      );
      const bKeys = Object.keys(b).filter(
        (key) => typeof b[key] !== "function" && !key.startsWith("_")
      );

      if (aKeys.length !== bKeys.length) return false;

      return aKeys.every((key) => {
        if (typeof a[key] === "object") {
          return isEqual(a[key], b[key]);
        }
        return a[key] === b[key];
      });
    } catch {
      return false;
    }
  }

  return false;
};

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;
  const router = useRouter();
  const { setRunTaskRequested } = useRunCheck();

  const {
    processedErrors,
    setProcessedErrors,
    setExtraDialogActions,
    extraDialogActions = [],
  } = useContext(RunCheckContext);

  const { getTaskItem, useFileDigest, validation, createPeerTask } = useJob(
    job.id
  );
  const { mutateJobs } = useProject(job.project);

  // Use refs to track previous values without causing circular references
  const prevProcessedErrors = useRef(processedErrors);
  const prevExtraDialogActions = useRef(extraDialogActions);

  // Consolidated task values
  const taskValues = useMemo(
    () => ({
      refinementMode: getTaskItem("REFINEMENT_MODE").value,
      freeRFlag: getTaskItem("FREERFLAG").value,
      solventAdvanced: getTaskItem("SOLVENT_ADVANCED").value,
      solventMaskType: getTaskItem("SOLVENT_MASK_TYPE").value,
      tlsMode: getTaskItem("TLSMODE").value,
      bfacSetUse: getTaskItem("BFACSETUSE").value,
      wavelength: getTaskItem("WAVELENGTH").value,
      mapSharp: getTaskItem("MAP_SHARP").value,
      mapSharpCustom: getTaskItem("MAP_SHARP_CUSTOM").value,
    }),
    [getTaskItem]
  );

  // File digest handling
  const { data: F_SIGFDigest } = useFileDigest(
    "prosmart_refmac.inputData.F_SIGF"
  );
  const { update: updateWAVELENGTH } = getTaskItem("WAVELENGTH");
  const oldFileDigest = usePrevious<any>(F_SIGFDigest);

  // Visibility conditions
  const visibility = useMemo(
    () => ({
      isRigidMode: () => taskValues.refinementMode === "RIGID",
      isRestrMode: () => taskValues.refinementMode === "RESTR",
      isExplicitSolvent: () => taskValues.solventMaskType === "EXPLICIT",
      hasAdvancedSolvent: () =>
        taskValues.solventMaskType === "EXPLICIT" && taskValues.solventAdvanced,
      hasTLS: () => taskValues.tlsMode !== "NONE",
      isTLSFromFile: () => taskValues.tlsMode === "FILE",
      hasBfacSet: () => taskValues.bfacSetUse,
      hasMapSharp: () => taskValues.mapSharp,
      hasCustomSharp: () => taskValues.mapSharp && taskValues.mapSharpCustom,
    }),
    [taskValues]
  );

  // Element configurations
  const elementConfigs = useMemo(
    () => ({
      inputData: [
        { key: "F_SIGF", label: "Reflection" },
        { key: "WAVELENGTH", label: "Wavelength" },
        { key: "FREERFLAG" },
        { key: "XYZIN", label: "Coordinates" },
        { key: "DICT_LIST", label: "Dictionaries" },
        {
          key: "NCYCRIGID",
          label: "Number of rigid body cycles",
          visible: visibility.isRigidMode,
        },
        {
          key: "NCYCLES",
          label: "Number of cycles",
          visible: visibility.isRestrMode,
        },
        { key: "REFINEMENT_MODE", label: "Refinement mode" },
      ],
      bFactors: [{ key: "B_REFINEMENT_MODE", label: "B-factors" }],
      scaling: [
        { key: "SCALE_TYPE", label: "Use", gridSize: { xs: 6 } },
        {
          key: "SOLVENT_MASK_TYPE",
          label: (
            <span style={{ marginLeft: "1rem", marginRight: "1rem" }}>
              solvent scaling, with mask type
            </span>
          ),
          gridSize: { xs: 6 },
        },
        {
          key: "SOLVENT_ADVANCED",
          label: "Use custom solvent mask parameters",
          visible: visibility.isExplicitSolvent,
        },
      ],
      customSolventParams: [
        {
          key: "SOLVENT_VDW_RADIUS",
          label: "Increase VDW Radius of non-ion atoms by ",
        },
        {
          key: "SOLVENT_IONIC_RADIUS",
          label: "Increase VDW Radius of potential ion atoms by ",
        },
        { key: "SOLVENT_SHRINK", label: "Shrink the mask area by a factor of" },
      ],
      tlsParams: [
        { key: "TLSMODE", label: "TLS parameters", gridSize: { xs: 6 } },
        {
          key: "NTLSCYCLES",
          label: "Number of TLS cycles",
          gridSize: { xs: 6 },
          visible: visibility.hasTLS,
        },
      ],
      customTLSParams: [
        {
          key: "TLSIN",
          label: "TLS coefficients",
          visible: visibility.isTLSFromFile,
        },
        {
          key: "BFACSETUSE",
          label: "Reset all B-factors at start ",
          gridSize: { xs: 6 },
        },
        {
          key: "BFACSET",
          label: "...to a value of",
          gridSize: { xs: 6 },
          visible: visibility.hasBfacSet,
        },
        {
          key: "TLSOUT_ADDU",
          label:
            "Add TLS contribution to output B-factors (only for analysis and deposition)",
        },
      ],
      outputOptions: [
        {
          key: "OUTPUT_HYDROGENS",
          label: "Output calculated riding hydrogens to file",
        },
      ],
      mapCalculation: [
        {
          key: "MAP_SHARP",
          label: "Perform map sharpening when calculating maps",
        },
        {
          key: "MAP_SHARP_CUSTOM",
          label: "Use custom sharpening parameter (B-factor)",
          gridSize: { xs: 6 },
          visible: visibility.hasMapSharp,
        },
        {
          key: "BSHARP",
          label: "B factor to use",
          gridSize: { xs: 6 },
          visible: visibility.hasCustomSharp,
        },
      ],
      validation: [
        { key: "VALIDATE_BAVERAGE", label: "Analyse B-factor distributions" },
        { key: "VALIDATE_RAMACHANDRAN", label: "Calculate Ramachandran plots" },
        {
          key: "VALIDATE_MOLPROBITY",
          label: "Run MolProbity to analyse geometry",
        },
      ],
      prosmartProtein: [
        {
          key: "prosmartProtein.REFERENCE_MODELS",
          label: "Protein reference models",
        },
      ],
    }),
    [visibility]
  );

  // Handle file digest changes
  const handleF_SIGFDigestChanged = useCallback(
    async (digest: any) => {
      if (!updateWAVELENGTH || !digest || !job || job.status !== 1) return;

      // Use a safer comparison that avoids circular references
      const digestString = digest ? String(digest.wavelengths?.at(-1)) : "";
      const oldDigestString = oldFileDigest
        ? String(oldFileDigest.wavelengths?.at(-1))
        : "";

      if (digestString === oldDigestString) return;

      console.log(digest);
      if (digest?.wavelengths?.at(-1) < 9) {
        await updateWAVELENGTH(digest.wavelengths.at(-1));
      }
    },
    [updateWAVELENGTH, job, oldFileDigest]
  );

  // Create FreeR task
  const createFreeRTask = useCallback(async () => {
    const created_job: Job | undefined = await createPeerTask("freerflag");
    if (created_job) {
      router.push(`/project/${job.project}/job/${created_job.id}`);
      setRunTaskRequested(null);
    }
  }, [job, createPeerTask, router, setRunTaskRequested]);

  // Process validation errors
  const processedValidationErrors = useMemo(() => {
    if (!validation) return null;

    const newProcessedErrors = { ...validation };
    if (!taskValues.freeRFlag?.dbFileId?.length) {
      newProcessedErrors.FREERFLAG = {
        messages: [
          "Setting the Free R flag file is strongly recommended for refinement",
          "You are advised to select an existing set or create a new one ",
        ],
        maxSeverity: 3,
      };
    }

    return newProcessedErrors;
  }, [validation, taskValues.freeRFlag]);

  // Extra dialog actions
  const freeRAction = useMemo(() => {
    if (taskValues.freeRFlag?.dbFileId?.length > 0) return null;

    return {
      FREERFLAG: (
        <Button variant="contained" onClick={createFreeRTask}>
          Create FreeR task
        </Button>
      ),
    };
  }, [taskValues.freeRFlag, createFreeRTask]);

  // Effects with safe comparisons
  useEffect(() => {
    handleF_SIGFDigestChanged(F_SIGFDigest);
  }, [F_SIGFDigest, handleF_SIGFDigestChanged]);

  useEffect(() => {
    // Use shallow comparison instead of JSON.stringify
    if (!isEqual(processedValidationErrors, prevProcessedErrors.current)) {
      setProcessedErrors(processedValidationErrors);
      prevProcessedErrors.current = processedValidationErrors;
    }
  }, [processedValidationErrors, setProcessedErrors]);

  useEffect(() => {
    // Use shallow comparison instead of JSON.stringify
    if (!isEqual(freeRAction, prevExtraDialogActions.current)) {
      setExtraDialogActions(freeRAction);
      prevExtraDialogActions.current = freeRAction;
    }
  }, [freeRAction, setExtraDialogActions]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      setExtraDialogActions(null);
      setProcessedErrors(null);
    },
    [setExtraDialogActions, setProcessedErrors]
  );

  // Render helpers
  const renderElements = useCallback(
    (elements: any[]) =>
      elements.map(
        ({ key, label, visible = () => true, gridSize, ...extraProps }) => {
          const element = (
            <CCP4i2TaskElement
              {...props}
              key={key}
              itemName={key}
              qualifiers={{ guiLabel: label, ...extraProps }}
              visibility={visible}
            />
          );

          return gridSize ? (
            <Grid2 key={key} size={gridSize}>
              {element}
            </Grid2>
          ) : (
            element
          );
        }
      ),
    [props]
  );

  const renderGridElements = useCallback(
    (elements: any[]) => {
      const gridElements = elements.filter((el) => el.gridSize);
      const regularElements = elements.filter((el) => !el.gridSize);

      return (
        <>
          {regularElements.length > 0 && renderElements(regularElements)}
          {gridElements.length > 0 && (
            <Grid2 container spacing={2}>
              {renderElements(gridElements)}
            </Grid2>
          )}
        </>
      );
    },
    [renderElements]
  );

  return (
    <Paper>
      <CCP4i2Tabs>
        <CCP4i2Tab label="Input data">
          {renderElements(elementConfigs.inputData)}
        </CCP4i2Tab>

        <CCP4i2Tab label="Parameterisation" key="Parameterisation">
          <CCP4i2ContainerElement
            itemName=""
            key="B-factors"
            {...props}
            qualifiers={{ guiLabel: "B-factors" }}
            containerHint="BlockLevel"
          >
            {renderElements(elementConfigs.bFactors)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            itemName=""
            key="Scaling"
            {...props}
            qualifiers={{ guiLabel: "Scaling" }}
            containerHint="BlockLevel"
          >
            {renderGridElements(elementConfigs.scaling)}

            <CCP4i2ContainerElement
              itemName=""
              {...props}
              qualifiers={{ guiLabel: "Custom parameters" }}
              containerHint="BlockLevel"
              key="Custom parameters"
              size={{ xs: 4 }}
              elementSx={{ my: 0, py: 0, minWidth: "5rem" }}
              visibility={visibility.hasAdvancedSolvent}
            >
              {renderElements(elementConfigs.customSolventParams)}
            </CCP4i2ContainerElement>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            itemName=""
            key="Translation libration screw (TLS)"
            {...props}
            qualifiers={{ guiLabel: "Translation libration screw (TLS)" }}
            containerHint="BlockLevel"
          >
            {renderGridElements(elementConfigs.tlsParams)}

            <CCP4i2ContainerElement
              itemName=""
              key="Custom TLS parameters"
              {...props}
              qualifiers={{ guiLabel: "Custom parameters" }}
              containerHint="BlockLevel"
              visibility={visibility.hasTLS}
            >
              {renderGridElements(elementConfigs.customTLSParams)}
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
            {renderElements(elementConfigs.outputOptions)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            itemName=""
            key="Map calculation"
            {...props}
            qualifiers={{ guiLabel: "Map calculation" }}
            containerHint="BlockLevel"
          >
            {renderElements(elementConfigs.mapCalculation.slice(0, 1))}
            {renderGridElements(elementConfigs.mapCalculation.slice(1))}
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
            {renderElements(elementConfigs.validation)}
          </CCP4i2ContainerElement>
        </CCP4i2Tab>

        <CCP4i2Tab label="Prosmart - protein" key="Prosmart protein">
          {renderElements(elementConfigs.prosmartProtein)}
          <CCP4i2ContainerElement
            {...props}
            itemName="prosmartProtein"
            containerHint="FolderLevel"
            excludeItems={["REFERENCE_MODELS"]}
            qualifiers={{ guiLabel: "Prosmart - protein" }}
          />
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
