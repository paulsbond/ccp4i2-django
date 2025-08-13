import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { Paper } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useJob, usePrevious } from "../../../utils";
import { RunCheckContext } from "../../../providers/run-check-provider";

/**
 * Task interface component for Phaser Experimental Phasing LLG (Log-Likelihood Gain) calculation.
 *
 * Provides functionality for:
 * - Calculating log-likelihood gains for experimental phasing solutions
 * - Partial model input as coordinates or map coefficients
 * - Scattering content specification for accurate phasing
 * - Basic crystallographic parameter control
 * - Automatic wavelength detection from reflection files
 */
const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const { job } = props;
  const { getTaskItem, useFileDigest, mutateContainer, validation } = useJob(
    job.id
  );

  // Get task items for file handling and parameter updates
  const { item: F_SIGFItem, value: F_SIGFValue } = getTaskItem("F_SIGF");
  const { item: XYZIN_PARTIALItem, value: XYZIN_PARTIALValue } =
    getTaskItem("XYZIN_PARTIAL");
  const { update: updateWAVELENGTH } = getTaskItem("WAVELENGTH");

  // File digest for wavelength extraction
  const { data: F_SIGFDigest } = useFileDigest(F_SIGFItem?._objectPath);
  const oldF_SIGFValue = usePrevious(F_SIGFValue);

  // Task values for visibility conditions
  const taskValues = useMemo(
    () => ({
      partialModelOrMap: getTaskItem("PARTIALMODELORMAP").value,
      compBy: getTaskItem("COMP_BY").value,
    }),
    [getTaskItem]
  );

  const {
    processedErrors,
    setProcessedErrors,
    setExtraDialogActions,
    extraDialogActions = [],
  } = useContext(RunCheckContext);

  // Visibility conditions
  const visibility = useMemo(
    () => ({
      isPartialModel: () => taskValues.partialModelOrMap === "MODEL",
      isPartialMap: () => taskValues.partialModelOrMap === "MAP",
      isAsuFile: () => taskValues.compBy === "ASU",
      isMolecularWeight: () => taskValues.compBy === "MW",
    }),
    [taskValues]
  );

  const processErrors = useCallback(() => {
    const newProcessedErrors = {
      ...validation,
    };
    if (XYZIN_PARTIALValue?.contentFlag === 2) {
      newProcessedErrors["phaser_EP_LLG.inputData.XYZIN_PARTIAL"] = {
        messages: ["Phaser apps can only work with PDB format"],
        maxSeverity: 2,
      };
      setProcessedErrors(newProcessedErrors);
    } else if (
      processedErrors &&
      Object.keys(processedErrors).includes(
        "phaser_EP_LLG.inputData.XYZIN_PARTIAL"
      )
    ) {
      setProcessedErrors(newProcessedErrors);
    }
  }, [XYZIN_PARTIALValue, validation, setProcessedErrors, processedErrors]);

  useEffect(() => {
    if (!XYZIN_PARTIALValue || !processErrors) return;
    if (
      (XYZIN_PARTIALValue.contentFlag === 2 &&
        (!processedErrors ||
          !Object.keys(processedErrors).includes(
            "phaser_EP_LLG.inputData.XYZIN_PARTIAL"
          ))) ||
      (XYZIN_PARTIALValue.contentFlag === 1 &&
        processedErrors &&
        Object.keys(processedErrors).includes(
          "phaser_EP_LLG.inputData.XYZIN_PARTIAL"
        ))
    ) {
      processErrors();
    }
  }, [XYZIN_PARTIALValue, processedErrors, processErrors]);

  // Element configurations
  const elementConfigs = useMemo(
    () => ({
      inputData: [
        { key: "F_SIGF", label: "Reflections" },
        {
          key: "PARTIALMODELORMAP",
          label: "Partial model as",
          toolTip:
            "Partial model can be provided as coordinates or a set of map coefficients",
        },
        {
          key: "XYZIN_PARTIAL",
          label: "Partial model coordinates",
          visible: visibility.isPartialModel,
        },
        {
          key: "MAPCOEFF_PARTIAL",
          label: "Partial model map coefficients",
          visible: visibility.isPartialMap,
        },
      ],
      scatteringContent: [
        { key: "COMP_BY", label: "How to specify scattering content" },
        {
          key: "ASUFILE",
          label: "CCP4i2 ASU file",
          visible: visibility.isAsuFile,
        },
        {
          key: "ASU_NUCLEICACID_MW",
          label: "Nucleic acid (Da)",
          visible: visibility.isMolecularWeight,
        },
        {
          key: "ASU_PROTEIN_MW",
          label: "Protein (Da)",
          visible: visibility.isMolecularWeight,
        },
      ],
      basicControls: [
        { key: "WAVELENGTH", label: "Wavelength" },
        { key: "RESOLUTION_LOW", label: "Low resolution limit" },
        { key: "RESOLUTION_HIGH", label: "High resolution limit" },
      ],
      modelSimilarity: [
        {
          key: "PART_VARI",
          label: "How to specify similarity (i.e. sequence or coords)",
        },
        {
          key: "PART_DEVI",
          label: "Sequence identity (0.0-1.0) or RMSD (Angstroms)",
        },
      ],
      keywords: [{ key: "keywords", label: "Additional keywords" }],
    }),
    [visibility]
  );

  // Handle wavelength extraction from F_SIGF file
  const handleF_SIGFDigestChanged = useCallback(
    async (digest: any) => {
      if (!updateWAVELENGTH || !digest || !job || job.status !== 1) return;

      // Check if F_SIGF value actually changed
      if (F_SIGFValue === oldF_SIGFValue) return;

      // Extract wavelength from digest (last wavelength in array)
      if (digest?.wavelengths?.length > 0) {
        const wavelength = digest.wavelengths[digest.wavelengths.length - 1];
        if (wavelength && wavelength < 9) {
          // Sanity check for reasonable wavelength
          try {
            await updateWAVELENGTH(wavelength);
            await mutateContainer();
          } catch (error) {
            console.error("Error updating wavelength:", error);
          }
        }
      }
    },
    [updateWAVELENGTH, job, F_SIGFValue, oldF_SIGFValue, mutateContainer]
  );

  // Effect to handle F_SIGF digest changes
  useEffect(() => {
    if (F_SIGFDigest) {
      handleF_SIGFDigestChanged(F_SIGFDigest);
    }
  }, [F_SIGFDigest, handleF_SIGFDigestChanged]);

  // Render helper function
  const renderElements = useCallback(
    (elements: any[]) =>
      elements.map(({ key, label, visible = () => true, ...extraProps }) => (
        <CCP4i2TaskElement
          {...props}
          key={key}
          itemName={key}
          qualifiers={{ guiLabel: label, ...extraProps }}
          visibility={visible}
        />
      )),
    [props]
  );

  return (
    <Paper>
      <CCP4i2Tabs>
        <CCP4i2Tab label="Main inputs" key="main">
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Input data",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
            key="Input data"
          >
            {renderElements(elementConfigs.inputData)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Scattering in the crystal",
              initiallyOpen: true,
            }}
            containerHint="FolderLevel"
            key="Scattering"
          >
            {renderElements(elementConfigs.scatteringContent)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Basic controls",
              initiallyOpen: true,
            }}
            containerHint="FolderLevel"
            key="Basic controls"
          >
            {renderElements(elementConfigs.basicControls)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Similarity of search model",
              initiallyOpen: true,
            }}
            containerHint="FolderLevel"
            key="Similarity"
            visibility={visibility.isPartialModel}
          >
            {renderElements(elementConfigs.modelSimilarity)}
          </CCP4i2ContainerElement>
        </CCP4i2Tab>

        <CCP4i2Tab label="Keywords" key="keywords">
          {renderElements(elementConfigs.keywords)}
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
