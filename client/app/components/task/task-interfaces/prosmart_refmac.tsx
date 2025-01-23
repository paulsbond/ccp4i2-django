import { LinearProgress, Paper, Typography } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { useMemo } from "react";
import { useApi } from "../../../api";
import { valueOfItemPath } from "../task-utils";

const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const api = useApi();
  const { data: params_xml } = api.get<{
    status: string;
    params_xml: string;
  }>(`jobs/${props.job.id}/params_xml`);
  if (!params_xml) return <LinearProgress />;
  const paramsXML = $($.parseXML(params_xml.params_xml));

  const refinementMode = useMemo(() => {
    if (paramsXML) {
      return valueOfItemPath("REFINEMENT_MODE", paramsXML);
    }
  }, [paramsXML]);

  return (
    <Paper>
      <Typography variant="h5">Refinement in mode {refinementMode}</Typography>
      <CCP4i2TaskElement
        itemName="NCYCLES"
        {...props}
        sx={{ m: 2, width: "20rem", maxWidth: "20rem" }}
        qualifiers={{ guiLabel: "Number of cycles" }}
      />
      <CCP4i2TaskElement
        itemName="REFINEMENT_MODE"
        {...props}
        sx={{ m: 2, width: "20rem", maxWidth: "20rem" }}
        qualifiers={{ guiLabel: "Refinement mode" }}
      />
    </Paper>
  );
};

export default TaskInterface;
