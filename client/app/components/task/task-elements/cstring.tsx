import { CCP4i2TaskElementProps } from "./task-element";
import { CSimpleElement } from "./csimple";

export const CStringElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  return <CSimpleElement {...props} type="text" />;
};
