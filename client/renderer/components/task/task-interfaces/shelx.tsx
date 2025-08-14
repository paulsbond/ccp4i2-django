import React, { useCallback, useEffect, useRef } from "react";
import { Paper } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "./task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useJob } from "../../../utils";

/**
 * Task interface component for SHELX - Experimental Phasing Pipeline.
 *
 * SHELX is used for:
 * - Single wavelength anomalous dispersion (SAD) phasing
 * - Multi-wavelength anomalous dispersion (MAD) phasing
 * - Heavy atom substructure determination
 * - Phase calculation and density modification
 * - Automated model building with Buccaneer integration
 */
const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const { job } = props;
  const { getTaskItem, useFileDigest } = useJob(job.id);

  // Use refs to track processed states and prevent cycles
  const initializationDone = useRef(false);
  const currentJobId = useRef<number | null>(null);
  const lastProcessedDigest = useRef<any>(null);
  const wavelengthUpdateInProgress = useRef(false);

  // Get task items for file handling and parameter updates
  const { item: F_SIGFanomItem, value: F_SIGFanomValue } =
    getTaskItem("F_SIGFanom");
  const { update: updateWAVELENGTH } = getTaskItem("WAVELENGTH");
  const { update: updateSHELXCDE } = getTaskItem("SHELXCDE");
  const { update: updateUSE_COMB } = getTaskItem("USE_COMB");
  const { update: updateSHELX_SEPAR } = getTaskItem("SHELX_SEPAR");
  const { update: updateMB_PROGRAM } = getTaskItem("MB_PROGRAM");

  // Get current values for initial setup (only used in initialization)
  const { value: SHELXCDE_value } = getTaskItem("SHELXCDE");
  const { value: USE_COMB_value } = getTaskItem("USE_COMB");
  const { value: SHELX_SEPAR_value } = getTaskItem("SHELX_SEPAR");
  const { value: MB_PROGRAM_value } = getTaskItem("MB_PROGRAM");

  // File digest for wavelength extraction
  const { data: F_SIGFanomDigest } = useFileDigest(F_SIGFanomItem?._objectPath);

  // Handle wavelength extraction with cycle prevention
  const handleF_SIGFanomDigestChanged = useCallback(
    async (digest: any) => {
      // Prevent multiple simultaneous updates
      if (wavelengthUpdateInProgress.current) return;

      // Check if we've already processed this digest
      if (lastProcessedDigest.current === digest) return;

      if (!updateWAVELENGTH || !digest || !job || job.status !== 1) return;

      // Extract wavelength from digest (last wavelength in array)
      if (digest?.wavelengths?.length > 0) {
        const wavelength = digest.wavelengths[digest.wavelengths.length - 1];
        if (wavelength && wavelength < 9) {
          try {
            wavelengthUpdateInProgress.current = true;
            lastProcessedDigest.current = digest;

            await updateWAVELENGTH(wavelength);
          } catch (error) {
            console.error("Error updating wavelength:", error);
          } finally {
            wavelengthUpdateInProgress.current = false;
          }
        }
      }
    },
    [updateWAVELENGTH, job]
  );

  // Stable initialization function (runs once per job)
  const initializeDefaults = useCallback(async () => {
    if (initializationDone.current || !job || job.status !== 1) return;

    const updates: Promise<any>[] = [];

    // Set default values if not already set
    if (!SHELXCDE_value) {
      updates.push(updateSHELXCDE(true));
    }
    if (USE_COMB_value) {
      updates.push(updateUSE_COMB(false));
    }
    if (!SHELX_SEPAR_value) {
      updates.push(updateSHELX_SEPAR(true));
    }
    if (MB_PROGRAM_value !== "buccaneer") {
      updates.push(updateMB_PROGRAM("buccaneer"));
    }

    if (updates.length > 0) {
      try {
        await Promise.all(updates);
        initializationDone.current = true;
      } catch (error) {
        console.error("Error initializing SHELX defaults:", error);
      }
    } else {
      initializationDone.current = true;
    }
  }, [
    job,
    SHELXCDE_value,
    USE_COMB_value,
    SHELX_SEPAR_value,
    MB_PROGRAM_value,
    updateSHELXCDE,
    updateUSE_COMB,
    updateSHELX_SEPAR,
    updateMB_PROGRAM,
  ]);

  // Reset initialization when job changes
  useEffect(() => {
    if (currentJobId.current !== job?.id) {
      initializationDone.current = false;
      lastProcessedDigest.current = null;
      wavelengthUpdateInProgress.current = false;
      currentJobId.current = job?.id || null;
    }
  }, [job?.id]);

  // Run initialization once when component mounts or job changes
  useEffect(() => {
    if (!initializationDone.current && job?.id) {
      initializeDefaults();
    }
  }, [initializeDefaults, job?.id]);

  // Effect for F_SIGFanom digest changes (wavelength extraction)
  useEffect(() => {
    if (
      F_SIGFanomDigest &&
      F_SIGFanomValue &&
      lastProcessedDigest.current !== F_SIGFanomDigest
    ) {
      handleF_SIGFanomDigestChanged(F_SIGFanomDigest);
    }
  }, [F_SIGFanomDigest, F_SIGFanomValue, handleF_SIGFanomDigestChanged]);

  return (
    <Paper>
      <CCP4i2Tabs>
        <CCP4i2Tab label="Main inputs" key="main">
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Key files",
              initiallyOpen: true,
            }}
            containerHint="FolderLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="F_SIGFanom"
              qualifiers={{
                guiLabel: "Reflections",
                toolTip: "Anomalous reflection data for phasing",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="WAVELENGTH"
              qualifiers={{
                guiLabel: "Wavelength",
                toolTip: "X-ray wavelength used for data collection",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="SEQIN"
              qualifiers={{
                guiLabel: "Asymmetric unit content",
                toolTip: "Sequence file defining the protein content",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="FREERFLAG"
              qualifiers={{
                guiLabel: "Free R flags",
                toolTip: "Test set flags for cross-validation",
              }}
            />
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Parameters",
              initiallyOpen: true,
            }}
            containerHint="FolderLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="ATOM_TYPE"
              qualifiers={{
                guiLabel: "Anomalous atom type",
                toolTip: "Type of heavy atom providing anomalous signal",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="START_PIPELINE"
              qualifiers={{
                guiLabel: "First step for analysis",
                toolTip: "Starting point in the SHELX pipeline",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="END_PIPELINE"
              qualifiers={{
                guiLabel: "Last step for analysis",
                toolTip: "Ending point in the SHELX pipeline",
              }}
            />
          </CCP4i2ContainerElement>
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
