import { Grid2, LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { useMemo } from "react";
import { useApi } from "../../../api";
import { itemsForName, useTaskContainer, valueOfItemPath } from "../task-utils";
import { BaseSpacegroupCellElement } from "../task-elements/base-spacegroup-cell-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { CContainerElement } from "../task-elements/ccontainer";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { data: container, mutate: mutateContainer } = api.container<any>(
    `jobs/${props.job.id}/container`
  );

  //These here to show how the Next useSWR aproach can furnish up to date digests of nput files
  const { data: F_SIGFDigest } = api.digest<any>(
    `jobs/${props.job.id}/digest?object_path=prosmart_refmac.inputData.F_SIGF`
  );
  const { data: FREERFLAGDigest } = api.digest<any>(
    `jobs/${props.job.id}/digest?object_path=prosmart_refmac.inputData.FREERFLAG`
  );

  //This magic means that the following variables will be kept up to date with the values of the associated parameters
  const useTaskParam = useTaskContainer(container);
  const refinementMode = useTaskParam("REFINEMENT_MODE");
  const solventAdvanced = useTaskParam("SOLVENT_ADVANCED");
  const solventMaskType = useTaskParam("SOLVENT_MASK_TYPE");
  const tlsMode = useTaskParam("TLSMODE");
  const bfacSetUse = useTaskParam("BFACSETUSE");

  if (!container) return <LinearProgress />;

  return (
    <Paper>
      <Typography variant="h5">Refinement in mode {refinementMode}</Typography>
      <CCP4i2Tabs>
        <CCP4i2Tab tab="Input data">
          <CCP4i2TaskElement
            itemName="F_SIGF"
            {...props}
            qualifiers={{ guiLabel: "Reflection" }}
          />
          {false && F_SIGFDigest?.digest && (
            <BaseSpacegroupCellElement data={F_SIGFDigest?.digest} />
          )}
          <CCP4i2TaskElement
            itemName="FREERFLAG"
            {...props}
            qualifiers={{ guiLabel: "Free R flags" }}
          />
          {false && FREERFLAGDigest?.digest && (
            <BaseSpacegroupCellElement data={FREERFLAGDigest?.digest} />
          )}
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
              <Grid2 size={{ xs: 12 }} key="col1">
                <CCP4i2TaskElement
                  {...props}
                  itemName="TLSMODE"
                  qualifiers={{
                    guiLabel: "TLS parameters",
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12 }} key="col12">
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
                <Grid2 size={{ xs: 12 }} key="col1">
                  <CCP4i2TaskElement
                    {...props}
                    itemName="BFACSETUSE"
                    qualifiers={{
                      guiLabel: "Reset all B-factors at start ",
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12 }} key="col2">
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
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
