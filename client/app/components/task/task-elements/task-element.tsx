import { Job } from "../../../models";
import { CIntElement } from "./cint";
import { useCallback, useMemo } from "react";
import { SxProps, Theme, Typography } from "@mui/material";
import { CStringElement } from "./cstring";
import {
  classOfDefItem,
  itemsForName,
  pathOfParamsItem,
  valueOfItemPath as valueOfItemPathFunction,
} from "../task-utils";
import { CFloatElement } from "./cfloat";
import { CPdbDataFileElement } from "./cpdbdatafile";
import { useApi } from "../../../api";
import $ from "jquery";

export interface CCP4i2TaskElementProps {
  job: Job;
  paramsXML: any;
  itemName: string;
  sx?: SxProps<Theme>;
  mutate: () => void;
  pathOfItem?: (item: HTMLElement) => string;
  visibility?: boolean | (() => boolean);
  qualifiers?: any;
  item?: any;
}

export const CCP4i2TaskElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const api = useApi();

  const { data: container } = api.container<any>(
    `jobs/${props.job.id}/container`
  );

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  const item = useMemo<any | null>(() => {
    if (container && props.itemName) {
      const matches = itemsForName(props.itemName, container);
      console.log(props.itemName, matches[0]);
      return matches[0];
    }
    return null;
  }, [props.itemName, container]);

  const qualifiers = useMemo<any>(() => {
    if (item?._qualifiers) {
      try {
        const overriddenQualifiers = props.qualifiers
          ? { ...item._qualifiers, ...props.qualifiers }
          : item._qualifiers;
        return overriddenQualifiers;
      } catch (err) {
        console.log(`Error getting qualifiers on ${props.itemName}`);
      }
    }
    return props.qualifiers;
  }, [item]);

  const interfaceElement = useMemo(() => {
    switch (item?._class) {
      case "CInt":
        return <CIntElement {...props} item={item} qualifiers={qualifiers} />;
      case "CFloat":
        return <CFloatElement {...props} item={item} qualifiers={qualifiers} />;
      case "CString":
        return (
          <CStringElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CPdbDataFile":
        return (
          <CPdbDataFileElement {...props} item={item} qualifiers={qualifiers} />
        );
      default:
        return <Typography>{item ? item._class : "No item"}</Typography>;
    }
  }, [item]);

  return inferredVisibility && <>{interfaceElement}</>;
};

export const errorInValidation = (
  objectPath: string,
  validation: { status: string; validation?: Document }
):
  | {
      severity: string;
      description: string;
    }
  | null
  | undefined => {
  if (validation && validation.validation) {
    const objectPathNodes = $(validation.validation)
      .find("objectpath")
      .toArray();
    const errorObjectNode = objectPathNodes.find((node: HTMLElement) => {
      return node.textContent === objectPath;
    });
    if (!errorObjectNode) {
      return null;
    }
    const errorNode = $(errorObjectNode).parent();
    if (!errorObjectNode) {
      return null;
    }
    if (errorNode) {
      const result: { severity: string; description: string } = {
        severity: "",
        description: "",
      };
      const severity = $(errorNode).find("severity").get(0)?.textContent;
      if (severity) result.severity = severity;
      const description = $(errorNode).find("description").get(0)?.textContent;
      if (description) result.description = description;
      return result;
    }
  }
};
