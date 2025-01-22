import { useMemo } from "react";
import { CCP4i2TaskElementProps } from "./task-element";

export const CCP4i2NumberTaskElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { paramsXML, itemName } = props;
  const value = useMemo(() => {
    if (paramsXML && itemName) {
      const valueNode = $(paramsXML).find(itemName);
      return valueNode.text();
    }
    return "Unknown";
  }, [props]);
  return <span>{`Number ${itemName} ${value}`}</span>;
};
