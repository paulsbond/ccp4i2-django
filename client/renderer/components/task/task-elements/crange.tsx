import { CCP4i2TaskElementProps } from "./task-element";
import { CCP4i2ContainerElement } from "./ccontainer";

export const CRangeElement: React.FC<CCP4i2TaskElementProps> = (props) => (
  <CCP4i2ContainerElement
    {...props}
    qualifiers={props.qualifiers}
    containerHint="BlockLevel"
    size={{ xs: 6 }}
    elementSx={{ my: 0, py: 0, minWidth: "5rem" }}
  />
);
