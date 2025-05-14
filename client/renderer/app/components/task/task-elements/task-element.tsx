import { Job } from "../../../models";
import { CIntElement } from "./cint";
import { PropsWithChildren, useMemo } from "react";
import { SxProps, Theme, Typography } from "@mui/material";
import { CStringElement } from "./cstring";
import { useJob } from "../../../utils";
import { CFloatElement } from "./cfloat";
import { CPdbDataFileElement } from "./cpdbdatafile";
import { CMiniMtzDataFileElement } from "./cminimtzdatafile";
import { CBooleanElement } from "./cboolean";
import { CListElement } from "./list";
import { CContainerElement } from "./ccontainer";
import { CImportUnmergedElement } from "./cimportunmerged";
import { CCellElement } from "./ccell";
import { CEnsembleElement } from "./censemble";
import { CAltSpaceGroupElement } from "./caltspacegroupelement";
import { CSimpleDataFileElement } from "./csimpledatafile";
import { CReindexOperatorElement } from "./creindexoperator";
import { CRangeElement } from "./crange";
import { v4 as uuid4 } from "uuid";
import { CAsuContentSeqElement } from "./casucontentseq";
import { CPdbEnsembleItemElement } from "./cpdbensembleitem";
import { Breakpoint } from "@mui/system";
import { CAsuContentSeqListElement } from "./casucontentseqlist";
type ResponsiveStyleValue<T> =
  | T
  | Array<T | null>
  | Partial<Record<Breakpoint, T>>;

type GridSize = number | "auto" | boolean;
type ResponsiveGridSize = ResponsiveStyleValue<GridSize>;

export interface CCP4i2TaskElementProps extends PropsWithChildren {
  job: Job;
  itemName: string;
  sx?: SxProps<Theme>;
  pathOfItem?: (item: HTMLElement) => string;
  visibility?: boolean | (() => boolean);
  disabled?: boolean | (() => boolean);
  qualifiers?: any;
  onUploadSuccess?: (updatedItem: any) => void;
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

  const { item } = getTaskItem(props.itemName);
  const the_uuid = uuid4();

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
        return (
          <CIntElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CFloat":
      case "CCellLength":
      case "CCellAngle":
      case "CWavelength":
        return (
          <CFloatElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CString":
      case "CSequenceString":
      case "CFilePath":
      case "COneWord":
      case "CCrystalName":
      case "CRangeSelection":
      case "CDatasetName":
        return (
          <CStringElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CBoolean":
        return (
          <CBooleanElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CPdbDataFile":
        return (
          <CPdbDataFileElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CImportUnmerged":
        return (
          <CImportUnmergedElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CDictDataFile":
      case "CTLSDataFile":
      case "CPhaserSolDataFile":
      case "CPhaserRFileDataFile":
      case "CRefmacRestraintsDataFile":
      case "CAsuDataFile":
      case "CSeqDataFile":
      case "CSeqAlignDataFile":
      case "CHhpredDataFile":
      case "CBlastDataFile":
      case "CDataFile":
      case "CUnmergedDataFile":
      case "CCootHistoryDataFile":
      case "CGenericReflDataFile":
      case "CDialsJsonFile":
      case "CDialsPickleFile":
      case "CMDLMolDataFile":
        return (
          <CSimpleDataFileElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CFreeRDataFile":
      case "CMiniMtzDataFile":
      case "CMtzDataFile":
      case "CObsDataFile":
      case "CMapCoeffsDataFile":
      case "CXmlDataFile":
      case "CPhsDataFile":
        return (
          <CMiniMtzDataFileElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CList":
      case "CImportUnmergedList":
      case "CAltSpaceGroupList":
      case "CEnsembleList":
        return (
          <CListElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CAsuContentSeqList":
        return (
          <CAsuContentSeqListElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CEnsemble":
        return (
          <CEnsembleElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CFloatRange":
        return (
          <CRangeElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CAsuContentSeq":
        return (
          <CAsuContentSeqElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CPdbEnsembleItem":
        return (
          <CPdbEnsembleItemElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CSpaceGroupCell":
      case "CContainer":
        return (
          <CContainerElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CReindexOperator":
        return (
          <CReindexOperatorElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      case "CCell":
        return (
          <CCellElement key={the_uuid} {...props} qualifiers={qualifiers} />
        );
      case "CSpaceGroup":
      case "CAltSpaceGroup":
        return (
          <CAltSpaceGroupElement
            key={the_uuid}
            {...props}
            qualifiers={qualifiers}
          />
        );
      default:
        return (
          <Typography key={the_uuid}>
            {item ? item._class : "No item"}
          </Typography>
        );
    }
  }, [item]);

  return inferredVisibility ? <>{interfaceElement}</> : null;
};
