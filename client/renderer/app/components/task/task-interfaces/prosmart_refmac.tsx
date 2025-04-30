import { Grid2, LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useApi } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
import { CContainerElement } from "../task-elements/ccontainer";
import { useCallback, useEffect } from "react";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { job } = props;

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  //const { data: F_SIGFDigest } = api.digest<any>(
  //  `jobs/${job.id}/digest?object_path=prosmart_refmac.inputData.F_SIGF`
  //);

  //This magic means that the following variables will be kept up to date with the values of the associated parameters
  const { setParameter, useAsyncEffect, getTaskItem, getFileDigest } = useJob(
    job.id
  );

  const { data: F_SIGFDigest } = getFileDigest(
    "prosmart_refmac.inputData.F_SIGF"
  );
  const { value: refinementMode } = getTaskItem("REFINEMENT_MODE");
  const { value: solventAdvanced } = getTaskItem("SOLVENT_ADVANCED");
  const { value: solventMaskType } = getTaskItem("SOLVENT_MASK_TYPE");
  const { value: tlsMode } = getTaskItem("TLSMODE");
  const { value: bfacSetUse } = getTaskItem("BFACSETUSE");
  const { update: updateWAVELENGTH, value: wavelength } =
    getTaskItem("WAVELENGTH");
  const { value: MAP_SHARP } = getTaskItem("MAP_SHARP");
  const { value: MAP_SHARP_CUSTOM } = getTaskItem("MAP_SHARP_CUSTOM");

  const oldFileDigest = usePrevious<any>(F_SIGFDigest);
  const oldWavelength = usePrevious<any>(wavelength);

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

  return (
    <Paper>
      <CCP4i2Tabs>
        <CCP4i2Tab tab="Input data">
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

        <CCP4i2Tab tab="Parameterisation" key="Parameterisation">
          <CContainerElement
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
          </CContainerElement>

          <CContainerElement
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
            <CContainerElement
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
            </CContainerElement>
          </CContainerElement>

          <CContainerElement
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
            <CContainerElement
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
            </CContainerElement>
          </CContainerElement>
        </CCP4i2Tab>
        <CCP4i2Tab tab="Output" key="Output">
          <CContainerElement
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
          </CContainerElement>
          <CContainerElement
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
          </CContainerElement>
          <CContainerElement
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
          </CContainerElement>
        </CCP4i2Tab>

        <CCP4i2Tab tab="Prosmart">
          <CCP4i2TaskElement
            {...props}
            itemName="prosmartProtein"
            qualifiers={{
              containerHint: "FolderLevel",
              guiLabel: "Prosmart - protein",
            }}
          />
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
