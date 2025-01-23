import { Paper } from "@mui/material";
import { CCP4i2TaskInterfaceProps } from "../task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  return (
    <Paper>
      <CCP4i2TaskElement itemName="NCYCLES" {...props} />
    </Paper>
  );
};
export default TaskInterface;
