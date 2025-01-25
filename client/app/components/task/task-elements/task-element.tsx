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

export interface CCP4i2TaskElementProps {
  job: Job;
  paramsXML: any;
  defXML: any;
  itemName: string;
  sx?: SxProps<Theme>;
  mutate: () => void;
  pathOfItem?: (item: HTMLElement) => string;
  visibility?: boolean | (() => boolean);
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

  const interfaceElement = useMemo(() => {
    switch (item?._class) {
      case "CInt":
        return <CIntElement {...props} item={item} />;
      case "CFloat":
        return <CFloatElement {...props} item={item} />;
      case "CString":
        return <CStringElement {...props} item={item} />;
      case "CPdbDataFile":
        return <CPdbDataFileElement {...props} item={item} />;
      default:
        return <Typography>{item ? item._class : "No item"}</Typography>;
    }
  }, [item]);

  return inferredVisibility && <>{interfaceElement}</>;
};
