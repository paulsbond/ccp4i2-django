import { Job } from "../../../models";
import { CIntElement } from "./cint";
import { useCallback, useMemo } from "react";
import { SxProps, Theme, Typography } from "@mui/material";
import { CStringElement } from "./cstring";
import {
  classOfDefItem,
  valueOfItemPath as valueOfItemPathFunction,
} from "../task-utils";
import { CFloatElement } from "./cfloat";

export interface CCP4i2TaskElementProps {
  job: Job;
  paramsXML: any;
  defXML: any;
  itemName: string;
  qualifiers?: any;
  objectPath?: string | null;
  sx?: SxProps<Theme>;
  mutate: () => void;
  pathOfItem?: (item: HTMLElement) => string;
}

export const CCP4i2TaskElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const itemDefElement = useMemo<HTMLElement | null>(() => {
    if (props.defXML && props.itemName) {
      const $itemNode = props.defXML.find(`[id=${props.itemName}]`);
      return $itemNode.get(0);
    }
    return null;
  }, [props.defXML && props.itemName]);

  const elementType = useMemo<string | null | undefined>(() => {
    if (itemDefElement) {
      return classOfDefItem(itemDefElement);
    }
    return null;
  }, [itemDefElement]);

  const qualifiers = useMemo<any>(() => {
    if (itemDefElement) {
      try {
        const qualifiersNode = $(itemDefElement).find("qualifiers").get(0);
        const qualifiers: any = {};
        qualifiersNode?.childNodes.forEach((childNode) => {
          qualifiers[childNode.nodeName.trim()] = $(childNode).text().trim();
        });
        const overriddenQualifiers = props.qualifiers
          ? { ...qualifiers, ...props.qualifiers }
          : qualifiers;
        return overriddenQualifiers;
      } catch (err) {
        console.log(`Error getting qualifiers on ${props.itemName}`);
      }
    }
    return {};
  }, [itemDefElement]);

  const itemParamsElement = useMemo<HTMLElement | null | undefined>(() => {
    if (props.paramsXML && props.itemName) {
      const $itemNode = $(props.paramsXML).find(props.itemName);
      return $itemNode.get(0);
    }
    return null;
  }, [props.defXML && props.itemName]);

  const taskName = useMemo(() => {
    const pluginNameElement = $(props.paramsXML).find("pluginName").get(0);
    if (pluginNameElement) {
      return $(pluginNameElement).text().trim();
    }
    return "unknown";
  }, []);

  const objectPath = useMemo<string | null>(() => {
    if (itemParamsElement && props.itemName) {
      const parentElements = $(itemParamsElement).parents().toArray();
      if (parentElements.at(-1)?.nodeName === `ccp4:ccp4i2`)
        parentElements.pop();
      if (parentElements.at(-1)?.nodeName === `ccp4i2_body`)
        parentElements.pop();
      const pathElements = parentElements.map(
        (element: HTMLElement) => element.nodeName
      );
      pathElements.push(taskName);
      const reversedElements = pathElements.reverse();
      if (props.itemName) reversedElements.push(props.itemName);

      return reversedElements.join(".");
    }
    return null;
  }, [itemParamsElement]);

  const valueOfItem = useCallback(
    (itemName: string) => {},
    [props.paramsXML, props.defXML]
  );

  const interfaceElement = useMemo(() => {
    switch (elementType) {
      case "CInt":
        return (
          <CIntElement
            {...props}
            qualifiers={qualifiers}
            objectPath={objectPath}
          />
        );
      case "CFloat":
        return (
          <CFloatElement
            {...props}
            qualifiers={qualifiers}
            objectPath={objectPath}
          />
        );
      case "CString":
        return (
          <CStringElement
            {...props}
            qualifiers={qualifiers}
            objectPath={objectPath}
          />
        );
      default:
        return <Typography>{elementType}</Typography>;
    }
  }, [elementType]);

  return <>{interfaceElement}</>;
};
