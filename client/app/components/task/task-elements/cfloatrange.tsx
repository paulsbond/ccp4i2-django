import { CCP4i2TaskElementProps } from "./task-element";
import { CContainerElement } from "./ccontainer";

export const CFloatRangeElement: React.FC<CCP4i2TaskElementProps> = (props) => (
  <CContainerElement
    {...props}
    qualifiers={props.qualifiers}
    size={{ xs: 6 }}
    elementSx={{ my: 0, py: 0, minWidth: "5rem" }}
  />
);
