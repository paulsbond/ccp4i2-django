import { LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { useMemo } from "react";
import { useApi } from "../../../api";
import { itemsForName, valueOfItemPath } from "../task-utils";
import { BaseSpacegroupCellElement } from "../task-elements/base-spacegroup-cell-element";
import { CCP4i2Tab, CCP4i2TabPanel, CCP4i2Tabs } from "../task-elements/tabs";

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

  const refinementMode = useMemo(() => {
    if (!container) return "UNKNOWN";
    return itemsForName("REFINEMENT_MODE", container)[0]._value;
  }, [container]);

  if (!container) return <LinearProgress />;

  return (
    <Paper>
      <Typography variant="h5">Refinement in mode {refinementMode}</Typography>
      <CCP4i2Tabs>
        <CCP4i2Tab tab="Input data">
          <CCP4i2TaskElement
            itemName="F_SIGF"
            {...props}
            sx={{ m: 2, width: "80rem", maxWidth: "80rem" }}
            qualifiers={{ guiLabel: "Reflection" }}
          />
          {false && F_SIGFDigest?.digest && (
            <BaseSpacegroupCellElement data={F_SIGFDigest?.digest} />
          )}
          <CCP4i2TaskElement
            itemName="FREERFLAG"
            {...props}
            sx={{ m: 2, width: "80rem", maxWidth: "80rem" }}
            qualifiers={{ guiLabel: "Free R flags" }}
          />
          {false && FREERFLAGDigest?.digest && (
            <BaseSpacegroupCellElement data={FREERFLAGDigest?.digest} />
          )}
          <CCP4i2TaskElement
            itemName="XYZIN"
            {...props}
            sx={{ m: 2, width: "80rem", maxWidth: "80rem" }}
            qualifiers={{ guiLabel: "Coordinates" }}
          />
          <CCP4i2TaskElement
            itemName="NCYCRIGID"
            {...props}
            sx={{ m: 2, width: "20rem", maxWidth: "20rem" }}
            qualifiers={{ guiLabel: "Number of rigid body cycles" }}
            visibility={() => refinementMode === "RIGID"}
          />
          <CCP4i2TaskElement
            itemName="NCYCLES"
            {...props}
            sx={{ m: 2, width: "20rem", maxWidth: "20rem" }}
            qualifiers={{ guiLabel: "Number of cycles" }}
            visibility={() => refinementMode === "RESTR"}
          />
          <CCP4i2TaskElement
            itemName="REFINEMENT_MODE"
            {...props}
            sx={{ m: 2, width: "20rem", maxWidth: "20rem" }}
            qualifiers={{ guiLabel: "Refinement mode" }}
          />
        </CCP4i2Tab>
      </CCP4i2Tabs>
    </Paper>
  );
};

export default TaskInterface;
