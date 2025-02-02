import { Job } from "../../../models";
import { CIntElement } from "./cint";
import { PropsWithChildren, useMemo } from "react";
import { SxProps, Theme, Typography } from "@mui/material";
import { CStringElement } from "./cstring";
import { itemsForName, useTaskItem } from "../task-utils";
import { CFloatElement } from "./cfloat";
import { CPdbDataFileElement } from "./cpdbdatafile";
import { useApi } from "../../../api";
import $ from "jquery";
import { CObsDataFileElement } from "./cobsdatafile";
import { CDataFileElement } from "./cdatafile";
import { CBooleanElement } from "./cboolean";
import { CListElement } from "./list";
import { CContainerElement } from "./ccontainer";
import { CImportUnmergedElement } from "./cimportunmerged";
import { CCellElement } from "./ccell";
import { CEnsembleElement } from "./censemble";
import { CAltSpaceGroupElement } from "./caltspacegroupelement";

export interface CCP4i2TaskElementProps extends PropsWithChildren {
  job: Job;
  itemName: string;
  sx?: SxProps<Theme>;
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
  const useItem = useTaskItem(container);

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  const item = useItem(props.itemName);

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
      case "CCellLength":
      case "CCellAngle":
      case "CWavelength":
        return <CFloatElement {...props} item={item} qualifiers={qualifiers} />;
      case "CString":
      case "COneWord":
        return (
          <CStringElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CBoolean":
        return (
          <CBooleanElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CPdbDataFile":
        return (
          <CPdbDataFileElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CImportUnmerged":
        return (
          <CImportUnmergedElement
            {...props}
            item={item}
            qualifiers={qualifiers}
          />
        );
      case "CFreeRDataFile":
      case "CDictDataFile":
      case "CTLSDataFile":
      case "CMapCoeffsDataFile":
      case "CPhsDataFile":
      case "CPhaserSolDataFile":
      case "CPhaserRFileDataFile":
      case "CAsuDataFile":
      case "CUnmergedDataFile":
      case "CMDLMolDataFile":
        return (
          <CDataFileElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CObsDataFile":
        return (
          <CObsDataFileElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CList":
      case "CImportUnmergedList":
      case "CAltSpaceGroupList":
      case "CEnsembleList":
        return <CListElement {...props} item={item} qualifiers={qualifiers} />;
      case "CEnsemble":
        return (
          <CEnsembleElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CContainer":
        return (
          <CContainerElement {...props} item={item} qualifiers={qualifiers} />
        );
      case "CCell":
        return <CCellElement {...props} item={item} qualifiers={qualifiers} />;
      case "CAltSpaceGroup":
        return (
          <CAltSpaceGroupElement
            {...props}
            item={item}
            qualifiers={qualifiers}
          />
        );

      default:
        return <Typography>{item ? item._class : "No item"}</Typography>;
    }
  }, [item]);

  return inferredVisibility && <>{interfaceElement}</>;
};

export const errorsInValidation = (
  objectPath: string,
  validation: { status: string; validation?: Document }
): {
  severity: string;
  description: string;
}[] => {
  if (validation && validation.validation) {
    const objectPathNodes = $(validation.validation)
      .find("objectpath")
      .toArray();
    const errorObjectNodes = objectPathNodes.filter((node: HTMLElement) => {
      return node.textContent?.includes(objectPath);
    });
    if (errorObjectNodes.length === 0) {
      return [];
    }
    const errors: {
      severity: string;
      description: string;
    }[] = [];
    errorObjectNodes.forEach((errorObjectNode: any) => {
      const errorNode = $(errorObjectNode).parent();
      if (errorNode) {
        const result: { severity: string; description: string } = {
          severity: "",
          description: "",
        };
        const severity = $(errorNode).find("severity").get(0)?.textContent;
        if (severity) result.severity = severity;
        const description = $(errorNode)
          .find("description")
          .get(0)?.textContent;
        if (description) result.description = description;
        errors.push(result);
      }
    });
    return errors;
  }
  return [];
};
