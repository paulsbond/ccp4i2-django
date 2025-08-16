import React, { useCallback, useEffect, useRef } from "react";
import { Paper, Grid2 } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "./task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
import { useJob, usePrevious } from "../../../utils";

/**
 * Task interface component for Prosmart-Refmac - Prosmart-guided Refinement.
 *
 * Prosmart-Refmac is used for:
 * - Macromolecular structure refinement with external restraints
 * - Integration with Prosmart for protein restraint generation
 * - Advanced B-factor and TLS parameter refinement
 * - Comprehensive validation and geometry analysis
 * - Anomalous signal and twinning handling
 */
const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const { job } = props;
  const { useTaskItem, useFileDigest } = useJob(job.id);

  // Use refs to track processed states and prevent cycles
  const initializationDone = useRef(false);
  const currentJobId = useRef<number | null>(null);
  const lastProcessedF_SIGFDigest = useRef<any>(null);

  // Get task items with update functions and/or values
  const { item: F_SIGFItem, value: F_SIGFValue } = useTaskItem("F_SIGF");
  const { update: updateWAVELENGTH } = useTaskItem("WAVELENGTH");
  const { update: updateUSEANOMALOUS } = useTaskItem("USEANOMALOUS");
  const { update: updateUSE_TWIN } = useTaskItem("USE_TWIN");
  const { update: updateVALIDATE_BAVERAGE } = useTaskItem("VALIDATE_BAVERAGE");
  const { update: updateVALIDATE_RAMACHANDRAN } = useTaskItem(
    "VALIDATE_RAMACHANDRAN"
  );
  const { update: updateVALIDATE_MOLPROBITY } = useTaskItem(
    "VALIDATE_MOLPROBITY"
  );

  // File digest for wavelength extraction
  const { data: F_SIGFDigest } = useFileDigest(F_SIGFItem?._objectPath);
  const oldF_SIGFValue = usePrevious(F_SIGFValue);

  // Get current values for visibility conditions
  const { value: HYDR_USEValue } = useTaskItem("HYDR_USE");
  const { value: SOLVENT_MASK_TYPEValue } = useTaskItem("SOLVENT_MASK_TYPE");
  const { value: SOLVENT_ADVANCEDValue } = useTaskItem("SOLVENT_ADVANCED");
  const { value: TLSMODE_value } = useTaskItem("TLSMODE");
  const { value: BFACSETUSE_value } = useTaskItem("BFACSETUSE");
  const { value: WEIGHT_OPT_value } = useTaskItem("WEIGHT_OPT");
  const { value: USE_NCS_value } = useTaskItem("USE_NCS");
  const { value: USE_JELLY_value } = useTaskItem("USE_JELLY");
  const { value: MAP_SHARP_value } = useTaskItem("MAP_SHARP");
  const { value: MAP_SHARP_CUSTOM_value } = useTaskItem("MAP_SHARP_CUSTOM");
  const { value: SCATTERING_FACTORS_value } = useTaskItem("SCATTERING_FACTORS");
  const { value: RES_CUSTOM_value } = useTaskItem("RES_CUSTOM");
  const { value: USEANOMALOUS_value } = useTaskItem("USEANOMALOUS");

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
          //await mutateContainer();
        }
      }
    },
    [updateWAVELENGTH, job, F_SIGFValue, oldF_SIGFValue]
  );

  // Effect to handle F_SIGF digest changes
  useEffect(() => {
    if (F_SIGFDigest) {
      handleF_SIGFDigestChanged(F_SIGFDigest);
    }
  }, [F_SIGFDigest, handleF_SIGFDigestChanged]);

  // Handle F_SIGF file changes with cycle prevention
  const handleF_SIGFChange = useCallback(async () => {
    if (!F_SIGFItem || !job || job.status !== 1) return;
    try {
      // Handle anomalous signal based on content flag
      const contentFlag = F_SIGFValue.contentFlag;
      if (![1, 2].includes(contentFlag) && updateUSEANOMALOUS) {
        await updateUSEANOMALOUS(false);
      }

      // Handle twinning based on content flag
      if (![3].includes(contentFlag) && updateUSE_TWIN) {
        await updateUSE_TWIN(false);
      }
    } catch (error) {
      console.error("Error processing F_SIGF change:", error);
    }
  }, [F_SIGFItem, job, updateWAVELENGTH, updateUSEANOMALOUS, updateUSE_TWIN]);

  // Stable initialization function (runs once per job)
  const handleInitialization = useCallback(async () => {
    if (initializationDone.current || !job || job.status !== 1) return;

    const updates: Promise<any>[] = [];

    // Set validation defaults to false
    if (updateVALIDATE_BAVERAGE) {
      updates.push(updateVALIDATE_BAVERAGE(false));
    }
    if (updateVALIDATE_RAMACHANDRAN) {
      updates.push(updateVALIDATE_RAMACHANDRAN(false));
    }
    if (updateVALIDATE_MOLPROBITY) {
      updates.push(updateVALIDATE_MOLPROBITY(false));
    }

    if (updates.length > 0) {
      try {
        await Promise.all(updates);
        initializationDone.current = true;
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    } else {
      initializationDone.current = true;
    }
  }, [
    job,
    updateVALIDATE_BAVERAGE,
    updateVALIDATE_RAMACHANDRAN,
    updateVALIDATE_MOLPROBITY,
  ]);

  // Reset initialization when job changes
  useEffect(() => {
    if (currentJobId.current !== job?.id) {
      initializationDone.current = false;
      lastProcessedF_SIGFDigest.current = null;
      currentJobId.current = job?.id || null;
    }
  }, [job?.id]);

  // Run initialization once when component mounts or job changes
  useEffect(() => {
    if (!initializationDone.current && job?.id) {
      handleInitialization();
    }
  }, [handleInitialization, job?.id]);

  // Visibility conditions (stable references)
  const visibility = {
    showAnomalousSignal: () =>
      F_SIGFItem?.contentFlag && [1, 2].includes(F_SIGFItem.contentFlag),
    showUseAnomalousFor: () =>
      F_SIGFItem?.contentFlag &&
      [1, 2].includes(F_SIGFItem.contentFlag) &&
      USEANOMALOUS_value,
    showTwinRefinement: () =>
      F_SIGFItem?.contentFlag && [3].includes(F_SIGFItem.contentFlag),
    showHydrogenOptions: () => HYDR_USEValue,
    showSolventAdvanced: () => SOLVENT_MASK_TYPEValue === "EXPLICIT",
    showCustomSolventParams: () =>
      SOLVENT_MASK_TYPEValue === "EXPLICIT" && SOLVENT_ADVANCEDValue,
    showTLSOptions: () => TLSMODE_value !== "NONE",
    showTLSFile: () => TLSMODE_value === "FILE",
    showBFactorReset: () => BFACSETUSE_value,
    showManualWeight: () => WEIGHT_OPT_value === "MANUAL",
    showNCSOptions: () => USE_NCS_value,
    showJellyOptions: () => USE_JELLY_value,
    showMapSharpening: () => MAP_SHARP_value,
    showCustomBFactor: () => MAP_SHARP_value && MAP_SHARP_CUSTOM_value,
    showElectronFormFactor: () => SCATTERING_FACTORS_value === "ELECTRON",
    showCustomResolution: () => RES_CUSTOM_value,
  };

  return (
    <Paper>
      <CCP4i2Tabs>
        <CCP4i2Tab label="Input data" key="input">
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Main inputs",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="XYZIN"
              qualifiers={{
                guiLabel: "Coordinates",
                toolTip: "Input macromolecular coordinates for refinement",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="F_SIGF"
              qualifiers={{
                guiLabel: "Reflections",
                toolTip: "Observed reflection data for refinement",
              }}
              onChange={handleF_SIGFChange}
            />

            <CCP4i2ContainerElement
              {...props}
              itemName=""
              qualifiers={{
                guiLabel: "Anomalous signal",
                initiallyOpen: true,
              }}
              containerHint="BlockLevel"
              visibility={visibility.showAnomalousSignal}
            >
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 6 }}>
                  <CCP4i2TaskElement
                    {...props}
                    itemName="USEANOMALOUS"
                    qualifiers={{
                      guiLabel: "Use anomalous",
                      toolTip: "Use anomalous differences in refinement",
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 6 }}>
                  <CCP4i2TaskElement
                    {...props}
                    itemName="USEANOMALOUSFOR"
                    qualifiers={{
                      guiLabel: "Use for",
                      toolTip: "How to use anomalous differences",
                    }}
                    visibility={visibility.showUseAnomalousFor}
                  />
                </Grid2>
                <Grid2 size={{ xs: 6 }}>
                  <CCP4i2TaskElement
                    {...props}
                    itemName="WAVELENGTH"
                    qualifiers={{
                      guiLabel: "Wavelength",
                      toolTip:
                        "X-ray wavelength for anomalous scattering calculations",
                    }}
                  />
                </Grid2>
              </Grid2>
            </CCP4i2ContainerElement>

            <CCP4i2TaskElement
              {...props}
              itemName="USE_TWIN"
              qualifiers={{
                guiLabel: "Twin refinement",
                toolTip: "Handle crystal twinning during refinement",
              }}
              visibility={visibility.showTwinRefinement}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="FREERFLAG"
              qualifiers={{
                guiLabel: "Free R flags",
                toolTip: "Test set flags for cross-validation",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="DICT_LIST"
              qualifiers={{
                guiLabel: "Additional dictionaries",
                toolTip:
                  "Additional geometry dictionaries for non-standard residues",
              }}
            />
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Options",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="NCYCLES"
              qualifiers={{
                guiLabel: "Cycles",
                toolTip: "Number of refinement cycles",
              }}
            />

            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 6 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="HYDR_USE"
                  qualifiers={{
                    guiLabel: "Use hydrogens during refinement",
                    toolTip:
                      "Include hydrogen atoms in refinement calculations",
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="HYDR_ALL"
                  qualifiers={{
                    guiLabel: " ",
                    toolTip: "Use all hydrogen atoms",
                  }}
                  visibility={visibility.showHydrogenOptions}
                />
              </Grid2>
            </Grid2>

            <CCP4i2TaskElement
              {...props}
              itemName="ADD_WATERS"
              qualifiers={{
                guiLabel: "Add waters",
                toolTip: "Automatically add water molecules during refinement",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="USE_TWIN"
              qualifiers={{
                guiLabel: "Crystal is twinned",
                toolTip: "Handle crystal twinning",
              }}
            />
          </CCP4i2ContainerElement>
        </CCP4i2Tab>

        <CCP4i2Tab label="Parameterisation" key="parameterisation">
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "B-factors",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="B_REFINEMENT_MODE"
              qualifiers={{
                guiLabel: "B-factors",
                toolTip: "B-factor refinement mode",
              }}
            />
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Scaling",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 6 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="SCALE_TYPE"
                  qualifiers={{
                    guiLabel: "Use ",
                    toolTip: "Scaling type for structure factors",
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="SOLVENT_MASK_TYPE"
                  qualifiers={{
                    guiLabel: "solvent scaling, with mask type",
                    toolTip: "Type of solvent mask for bulk solvent correction",
                  }}
                />
              </Grid2>
            </Grid2>

            <CCP4i2TaskElement
              {...props}
              itemName="SOLVENT_ADVANCED"
              qualifiers={{
                guiLabel: "Use custom solvent mask parameters",
                toolTip: "Enable custom parameters for solvent masking",
              }}
              visibility={visibility.showSolventAdvanced}
            />

            <CCP4i2ContainerElement
              {...props}
              itemName=""
              qualifiers={{
                guiLabel: "Custom parameters",
                initiallyOpen: true,
              }}
              containerHint="BlockLevel"
              visibility={visibility.showCustomSolventParams}
            >
              <CCP4i2TaskElement
                {...props}
                itemName="SOLVENT_VDW_RADIUS"
                qualifiers={{
                  guiLabel: "Increase VDW Radius of non-ion atoms by ",
                  toolTip:
                    "Additional radius for non-ionic atoms in solvent mask",
                }}
              />

              <CCP4i2TaskElement
                {...props}
                itemName="SOLVENT_IONIC_RADIUS"
                qualifiers={{
                  guiLabel: "Increase VDW Radius of potential ion atoms by ",
                  toolTip: "Additional radius for ionic atoms in solvent mask",
                }}
              />

              <CCP4i2TaskElement
                {...props}
                itemName="SOLVENT_SHRINK"
                qualifiers={{
                  guiLabel: "Shrink the mask area by a factor of",
                  toolTip: "Shrinkage factor for solvent mask",
                }}
              />
            </CCP4i2ContainerElement>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Translation libration screw (TLS)",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="TLSMODE"
              qualifiers={{
                guiLabel: "TLS parameters",
                toolTip: "TLS parameter refinement mode",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="NTLSCYCLES"
              qualifiers={{
                guiLabel: "Number of TLS cycles",
                toolTip: "Number of TLS refinement cycles",
              }}
              visibility={visibility.showTLSOptions}
            />

            <CCP4i2ContainerElement
              {...props}
              itemName=""
              qualifiers={{
                guiLabel: "Custom parameters",
                initiallyOpen: true,
              }}
              containerHint="BlockLevel"
              visibility={visibility.showTLSOptions}
            >
              <CCP4i2TaskElement
                {...props}
                itemName="TLSIN"
                qualifiers={{
                  guiLabel: "TLS coefficients",
                  toolTip: "Input file containing TLS parameters",
                }}
                visibility={visibility.showTLSFile}
              />

              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 8 }}>
                  <CCP4i2TaskElement
                    {...props}
                    itemName="BFACSETUSE"
                    qualifiers={{
                      guiLabel: "Reset all B-factors at start ",
                      toolTip:
                        "Reset all B-factors to a fixed value before TLS refinement",
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 4 }}>
                  <CCP4i2TaskElement
                    {...props}
                    itemName="BFACSET"
                    qualifiers={{
                      guiLabel: "...to a value of",
                      toolTip: "B-factor value for reset",
                    }}
                    visibility={visibility.showBFactorReset}
                  />
                </Grid2>
              </Grid2>

              <CCP4i2TaskElement
                {...props}
                itemName="TLSOUT_ADDU"
                qualifiers={{
                  guiLabel:
                    "Add TLS contribution to output B-factors (only for analysis and deposition)",
                  toolTip: "Include TLS contribution in final B-factors",
                }}
              />
            </CCP4i2ContainerElement>
          </CCP4i2ContainerElement>
        </CCP4i2Tab>

        <CCP4i2Tab label="Restraints" key="restraints">
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Weights",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 8 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="WEIGHT_OPT"
                  qualifiers={{
                    guiLabel:
                      "Weight restraints versus experimental data using",
                    toolTip:
                      "Method for weighting geometric restraints against experimental data",
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="controlParameters.WEIGHT"
                  qualifiers={{
                    guiLabel: "Weight",
                    toolTip: "Manual weight value",
                  }}
                  visibility={visibility.showManualWeight}
                />
              </Grid2>
            </Grid2>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Non-crystallographic symmetry (NCS)",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="USE_NCS"
              qualifiers={{
                guiLabel: "Use NCS",
                toolTip: "Apply non-crystallographic symmetry restraints",
              }}
            />

            <CCP4i2ContainerElement
              {...props}
              itemName=""
              qualifiers={{
                guiLabel: "NCS",
                initiallyOpen: true,
              }}
              containerHint="BlockLevel"
              visibility={visibility.showNCSOptions}
            >
              <CCP4i2TaskElement
                {...props}
                itemName="NCS_TYPE"
                qualifiers={{
                  guiLabel: "Type",
                  toolTip: "Type of NCS restraints",
                }}
              />

              <CCP4i2TaskElement
                {...props}
                itemName="NCS_AUTO"
                qualifiers={{
                  guiLabel: "Auto",
                  toolTip: "Automatically detect NCS relationships",
                }}
              />
            </CCP4i2ContainerElement>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Jelly-body",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="USE_JELLY"
              qualifiers={{
                guiLabel: "Use jelly body",
                toolTip: "Apply jelly-body restraints for flexible refinement",
              }}
            />

            <CCP4i2ContainerElement
              {...props}
              itemName=""
              qualifiers={{
                guiLabel: "Jelly body",
                initiallyOpen: true,
              }}
              containerHint="BlockLevel"
              visibility={visibility.showJellyOptions}
            >
              <CCP4i2TaskElement
                {...props}
                itemName="JELLY_SIGMA"
                qualifiers={{
                  guiLabel: "Sigma",
                  toolTip: "Sigma value for jelly-body restraints",
                }}
              />

              <CCP4i2TaskElement
                {...props}
                itemName="JELLY_DIST"
                qualifiers={{
                  guiLabel: "Dist",
                  toolTip: "Distance cutoff for jelly-body restraints",
                }}
              />
            </CCP4i2ContainerElement>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName="prosmartProtein"
            qualifiers={{
              guiLabel: "Prosmart - protein",
              toolTip: "Prosmart restraints for protein chains",
            }}
            containerHint="FolderLevel"
          />
        </CCP4i2Tab>

        <CCP4i2Tab label="Output" key="output">
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Output options",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="OUTPUT_HYDROGENS"
              qualifiers={{
                guiLabel: "Output calculated riding hydrogens to file",
                toolTip:
                  "Include calculated hydrogen atoms in output coordinates",
              }}
            />
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Map calculation",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="MAP_SHARP"
              qualifiers={{
                guiLabel: "Perform map sharpening when calculating maps",
                toolTip: "Apply B-factor sharpening to improve map quality",
              }}
            />

            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 8 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="MAP_SHARP_CUSTOM"
                  qualifiers={{
                    guiLabel: "Use custom sharpening parameter (B-factor)",
                    toolTip: "Specify custom B-factor for map sharpening",
                  }}
                  visibility={visibility.showMapSharpening}
                />
              </Grid2>
              <Grid2 size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="BSHARP"
                  qualifiers={{
                    guiLabel: " ",
                    toolTip: "B-factor value for custom map sharpening",
                  }}
                  visibility={visibility.showCustomBFactor}
                />
              </Grid2>
            </Grid2>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Validation and analysis",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="VALIDATE_BAVERAGE"
              qualifiers={{
                guiLabel: "Analyse B-factor distributions",
                toolTip: "Generate B-factor distribution analysis",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="VALIDATE_RAMACHANDRAN"
              qualifiers={{
                guiLabel: "Calculate Ramachandran plots",
                toolTip: "Generate Ramachandran plot validation",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="VALIDATE_MOLPROBITY"
              qualifiers={{
                guiLabel: "Run MolProbity to analyse geometry",
                toolTip:
                  "Perform comprehensive geometry validation with MolProbity",
              }}
            />
          </CCP4i2ContainerElement>
        </CCP4i2Tab>

        <CCP4i2Tab label="Advanced" key="advanced">
          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Experiment",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="SCATTERING_FACTORS"
              qualifiers={{
                guiLabel: "Diffraction experiment type",
                toolTip: "Type of diffraction experiment (X-ray or electron)",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="SCATTERING_ELECTRON"
              qualifiers={{
                guiLabel: "Form factor calculation",
                toolTip:
                  "Method for electron scattering form factor calculation",
              }}
              visibility={visibility.showElectronFormFactor}
            />
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Resolution",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="RES_CUSTOM"
              qualifiers={{
                guiLabel: "Use custom resolution",
                toolTip: "Override automatic resolution limits",
              }}
            />

            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 6 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="RES_MIN"
                  qualifiers={{
                    guiLabel: "min",
                    toolTip: "Minimum resolution limit",
                  }}
                  visibility={visibility.showCustomResolution}
                />
              </Grid2>
              <Grid2 size={{ xs: 6 }}>
                <CCP4i2TaskElement
                  {...props}
                  itemName="RES_MAX"
                  qualifiers={{
                    guiLabel: "max",
                    toolTip: "Maximum resolution limit",
                  }}
                  visibility={visibility.showCustomResolution}
                />
              </Grid2>
            </Grid2>
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Reset B-factors",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="BFACSETUSE"
              qualifiers={{
                guiLabel: "Reset all B-factors at start ",
                toolTip:
                  "Reset all B-factors to a fixed value before refinement",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="BFACSET"
              qualifiers={{
                guiLabel: "...to a value of",
                toolTip: "B-factor value for reset",
              }}
              visibility={visibility.showBFactorReset}
            />
          </CCP4i2ContainerElement>

          <CCP4i2ContainerElement
            {...props}
            itemName=""
            qualifiers={{
              guiLabel: "Extra keywords",
              initiallyOpen: true,
            }}
            containerHint="BlockLevel"
          >
            <CCP4i2TaskElement
              {...props}
              itemName="EXTRAREFMACKEYWORDS"
              qualifiers={{
                guiLabel: " ",
                guiMode: "multiLine",
                toolTip: "Additional Refmac keywords for advanced control",
              }}
            />

            <CCP4i2TaskElement
              {...props}
              itemName="REFMAC_KEYWORD_FILE"
              qualifiers={{
                guiLabel: "",
                toolTip: "File containing additional Refmac keywords",
              }}
            />
          </CCP4i2ContainerElement>
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
