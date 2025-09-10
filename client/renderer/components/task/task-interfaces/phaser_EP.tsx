import React, { useCallback, useEffect, useMemo } from "react";
import { Paper } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "./task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useJob, usePrevious } from "../../../utils";

/**
 * Task interface component for Phaser Experimental Phasing (EP).
 *
 * Provides functionality for:
 * - Heavy atom location using various methods (search, manual input, partial model)
 * - Phase calculation and density modification
 * - Integration with Parrot and Buccaneer for automated building
 * - Automatic wavelength detection from reflection files
 */
const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const { job } = props;
  const { useTaskItem, useFileDigest, setParameter, mutateContainer } = useJob(
    job.id
  );

  // Get task items for file handling and parameter updates
  const { item: F_SIGFItem, value: F_SIGFValue } = useTaskItem("F_SIGF");
  const { update: updateWAVELENGTH } = useTaskItem("WAVELENGTH");

  // File digest for wavelength extraction
  const { data: F_SIGFDigest } = useFileDigest(F_SIGFItem?._objectPath);
  const oldF_SIGFValue = usePrevious(F_SIGFValue);

  // Task values for visibility conditions
  const taskValues = useMemo(
    () => ({
      partialModeOrMap: useTaskItem("PARTIALMODELORMAP").value,
      compBy: useTaskItem("COMP_BY").value,
      runBuccaneer: useTaskItem("RUNBUCCANEER").value,
    }),
    [useTaskItem]
  );

  // Visibility conditions
  const visibility = useMemo(
    () => ({
      isPartialModel: () => taskValues.partialModeOrMap === "MODEL",
      isNoPartial: () => taskValues.partialModeOrMap === "NONE",
      isSearch: () => taskValues.partialModeOrMap === "SEARCH",
      isAsuFile: () => taskValues.compBy === "ASU",
      isMolecularWeight: () => taskValues.compBy === "MW",
      hasBuccaneer: () => taskValues.runBuccaneer,
    }),
    [taskValues]
  );

  // Element configurations
  const elementConfigs = useMemo(
    () => ({
      inputData: [
        { key: "F_SIGF", label: "Reflections" },
        { key: "FREERFLAG", label: "Free R flags" },
        { key: "PARTIALMODELORMAP", label: "Partial model or map" },
        {
          key: "XYZIN_PARTIAL",
          label: "Partial model coordinates",
          visible: visibility.isPartialModel,
        },
      ],
      heavyAtomCoords: [
        {
          key: "XYZIN_HA",
          label: "Heavy atom coords",
          visible: visibility.isNoPartial,
        },
      ],
      heavyAtomSearch: [
        { key: "SFAC", label: "Atom type to find" },
        { key: "FIND", label: "Number to find" },
        { key: "NTRY", label: "ShelX trials" },
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
      extraSteps: [
        { key: "RUNPARROT", label: "Run Parrot" },
        { key: "RUNBUCCANEER", label: "Run Buccaneer" },
        {
          key: "BUCCANEER_ITERATIONS",
          label: "Buccaneer cycles",
          visible: visibility.hasBuccaneer,
        },
      ],
      basicControls: [
        { key: "WAVELENGTH", label: "Wavelength" },
        { key: "RESOLUTION_LOW", label: "Low resolution limit" },
        { key: "RESOLUTION_HIGH", label: "High resolution limit" },
        { key: "ELEMENTS", label: "Elements for HA completion" },
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

      // Extract wavelength from digest
      if (digest?.wavelengths?.length > 0) {
        const wavelength = digest.wavelengths[digest.wavelengths.length - 1];
        if (wavelength && wavelength < 9) {
          // Sanity check for wavelength
          await updateWAVELENGTH(wavelength);
          await mutateContainer();
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
            qualifiers={{ guiLabel: "Input data" }}
            containerHint="BlockLevel"
            key="Input data"
          >
            {renderElements(elementConfigs.inputData)}
          </CCP4i2ContainerElement>

          {renderElements(elementConfigs.heavyAtomCoords)}

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Heavy atoms" }}
            containerHint="BlockLevel"
            key="Heavy atoms"
            visibility={visibility.isSearch}
          >
            {renderElements(elementConfigs.heavyAtomSearch)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Scattering in the crystal" }}
            containerHint="FolderLevel"
            key="Scattering"
          >
            {renderElements(elementConfigs.scatteringContent)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Extra steps" }}
            containerHint="FolderLevel"
            key="Extra steps"
          >
            {renderElements(elementConfigs.extraSteps)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Basic controls" }}
            containerHint="FolderLevel"
            key="Basic controls"
          >
            {renderElements(elementConfigs.basicControls)}
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{ guiLabel: "Similarity of search model" }}
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
