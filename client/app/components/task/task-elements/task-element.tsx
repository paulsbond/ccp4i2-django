import { Job } from "../../../models";
import { xml2js } from "xml-js";
import { CCP4i2NumberTaskElement } from "./number";
import { useMemo } from "react";
import { Typography } from "@mui/material";

export interface CCP4i2TaskElementProps {
  job: Job;
  paramsXML: any;
  defXML: any;
  mutate: () => void;
  itemName?: string;
}
export const CCP4i2TaskElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const elementType = useMemo<string | null | undefined>(() => {
    if (props.defXML && props.itemName) {
      const $itemNode = props.defXML.find(`[id=${props.itemName}]`);
      if ($itemNode.toArray().length == 1) {
        const $classNode = $($itemNode).find("className");
        return $classNode.get(0)?.textContent;
      } else return null;
    }
    return null;
  }, [props]);

  const interfaceElement = useMemo(() => {
    switch (elementType) {
      case "CInt":
        return <CCP4i2NumberTaskElement {...props} />;
      default:
        return <span>Unknown elementType</span>;
    }
  }, [elementType]);

  return (
    <>
      <Typography>{elementType}</Typography>
      {interfaceElement}
    </>
  );
};
