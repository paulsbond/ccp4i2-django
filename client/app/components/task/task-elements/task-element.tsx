import { Job } from "../../../models";
import { xml2js } from "xml-js";
import { CCP4i2NumberTaskElement } from "./number";
import { useMemo } from "react";

export interface CCP4i2TaskElementProps {
  job: Job;
  paramsXML: any;
  defXML: any;
  mutate: () => void;
  itemName?: string;
}
export const CCP4i2TaskElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const elementType = useMemo(() => {
    if (props.defXML && props.itemName) {
      const entry = props.defXML.find(`[id=${props.itemName}]`);
      console.log({ ...props, entry });
    }
  }, [props]);
  return <CCP4i2NumberTaskElement {...props} />;
};
