import { CCP4i2TaskElementProps } from "./task-element";
import { CContainerElement } from "./ccontainer";

export const CCellElement: React.FC<CCP4i2TaskElementProps> = (props) => (
  <CContainerElement
    {...props}
    qualifiers={props.qualifiers}
    size={{ xs: 4 }}
    containerHint="RowLevel"
    elementSx={{ my: 0, py: 0, minWidth: "5rem" }}
  />
);
