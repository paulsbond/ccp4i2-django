import { Job } from "../../../models";
import { CIntElement } from "./cint";
import { PropsWithChildren, useMemo } from "react";
import { SxProps, Theme, Typography } from "@mui/material";
import { CStringElement } from "./cstring";
import { useJob } from "../../../utils";
import { CFloatElement } from "./cfloat";
import { CPdbDataFileElement } from "./cpdbdatafile";
import $ from "jquery";
import { CMiniMtzDataFileElement } from "./cminimtzdatafile";
import { CBooleanElement } from "./cboolean";
import { CListElement } from "./list";
import { CContainerElement } from "./ccontainer";
import { CImportUnmergedElement } from "./cimportunmerged";
import { CCellElement } from "./ccell";
import { CEnsembleElement } from "./censemble";
import { CAltSpaceGroupElement } from "./caltspacegroupelement";
import { CSimpleDataFileElement } from "./csimpledatafile";

export interface CCP4i2TaskElementProps extends PropsWithChildren {
  job: Job;
  itemName: string;
  sx?: SxProps<Theme>;
  pathOfItem?: (item: HTMLElement) => string;
  visibility?: boolean | (() => boolean);
  qualifiers?: any;
}

/**
 * CCP4i2TaskElement is a React functional component that renders different types of task elements
 * based on the provided item properties. It uses various hooks and memoization to optimize performance.
 *
 * @param {CCP4i2TaskElementProps} props - The properties passed to the component.
 * @param {Object} props.job - The job object associated with the task element.
 * @param {string} props.itemName - The name of the item to be rendered.
 * @param {boolean | (() => boolean)} [props.visibility] - The visibility of the task element, which can be a boolean or a function returning a boolean.
 * @param {Object} [props.qualifiers] - Additional qualifiers to override the default qualifiers of the item.
 *
 * @returns {JSX.Element} The rendered task element based on the item class.
 */
export const CCP4i2TaskElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { job } = props;
  const { getTaskItem } = useJob(job.id);

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  const item = getTaskItem(props.itemName);

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
        return <CIntElement {...props} qualifiers={qualifiers} />;
      case "CFloat":
      case "CCellLength":
      case "CCellAngle":
      case "CWavelength":
      case "CRangeSelection":
        return <CFloatElement {...props} qualifiers={qualifiers} />;
      case "CString":
      case "COneWord":
        return <CStringElement {...props} qualifiers={qualifiers} />;
      case "CBoolean":
        return <CBooleanElement {...props} qualifiers={qualifiers} />;
      case "CPdbDataFile":
        return <CPdbDataFileElement {...props} qualifiers={qualifiers} />;
      case "CImportUnmerged":
        return <CImportUnmergedElement {...props} qualifiers={qualifiers} />;
      case "CDictDataFile":
      case "CTLSDataFile":
      case "CPhaserSolDataFile":
      case "CPhaserRFileDataFile":
      case "CRefmacRestraintsDataFile":
      case "CAsuDataFile":
      case "CUnmergedDataFile":
      case "CMDLMolDataFile":
        return <CSimpleDataFileElement {...props} qualifiers={qualifiers} />;
      case "CFreeRDataFile":
      case "CObsDataFile":
      case "CMapCoeffsDataFile":
      case "CPhsDataFile":
        return <CMiniMtzDataFileElement {...props} qualifiers={qualifiers} />;
      case "CList":
      case "CImportUnmergedList":
      case "CAltSpaceGroupList":
      case "CEnsembleList":
        return <CListElement {...props} qualifiers={qualifiers} />;
      case "CEnsemble":
        return <CEnsembleElement {...props} qualifiers={qualifiers} />;
      case "CPdbEnsembleItem":
      case "CFloatRange":
      case "CContainer":
        return <CContainerElement {...props} qualifiers={qualifiers} />;
      case "CCell":
        return <CCellElement {...props} qualifiers={qualifiers} />;
      case "CAltSpaceGroup":
        return <CAltSpaceGroupElement {...props} qualifiers={qualifiers} />;

      default:
        return <Typography>{item ? item._class : "No item"}</Typography>;
    }
  }, [item]);

  return inferredVisibility && <>{interfaceElement}</>;
};
