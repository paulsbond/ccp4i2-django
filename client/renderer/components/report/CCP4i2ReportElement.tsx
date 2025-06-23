import { useMemo } from "react";
import $ from "jquery";
import { Job } from "../../types/models";

import { CCP4i2ReportFlotGraphGroup } from "./CCP4i2ReportFlotGraphGroup";
import { CCP4i2ReportTable } from "./CCP4i2ReportTable";
import { CCP4i2ReportInputOutputData } from "./CCP4i2ReportInputOutputData";
import { CCP4i2ReportFold } from "./CCP4i2ReportFold";
import { CCP4i2ReportDiv } from "./CCP4i2ReportDiv";
import { CCP4i2ReportPre } from "./CCP4i2ReportPre";
import { CCP4i2ReportGeneric } from "./CCP4i2ReportGeneric";
import { CCP4i2ReportTitle } from "./CCP4i2ReportTitle";
import { CCP4i2ReportText } from "./CCP4i2ReportText";
import { CCP4i2ReportReference } from "./CCP4i2ReportReference";
import { CCP4i2ReportObjectGallery } from "./CCP4i2ReportObjectGallery";
import { CCP4i2ApplicationOutputView } from "./CCP4i2ApplicationOutputView";
import { CCP4i2ReportJobDetails } from "./CCP4i2ReportJobDetails";

export interface CCP4i2ReportElementProps {
  iItem: number;
  item: HTMLElement | HTMLTableSectionElement;
  job: Job;
}

export const CCP4i2ReportElement: React.FC<CCP4i2ReportElementProps> = ({
  iItem,
  item,
  job,
}) => {
  const returnElement = useMemo<React.ReactNode>(() => {
    const htmlElement = $(item).get(0);
    const tagName = htmlElement?.tagName;
    if (tagName) {
      if (["CCP4i2ReportFold"].includes(tagName)) {
        return (
          <CCP4i2ReportFold
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportJobDetails"].includes(tagName)) {
        return (
          <CCP4i2ReportJobDetails
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (
        [
          "CCP4i2ReportDiv",
          "div",
          "CCP4i2ReportResults",
          "CCP4i2ReportReferenceGroup",
        ].includes(tagName)
      ) {
        return (
          <CCP4i2ReportDiv
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportPre"].includes(tagName)) {
        return (
          <CCP4i2ReportPre
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportFlotGraph"].includes(tagName)) {
        return <CCP4i2ApplicationOutputView output={item} />;
      } else if (
        ["CCP4i2ReportGeneric", "CCP4i2ReportGenericElement"].includes(tagName)
      ) {
        return (
          <CCP4i2ReportGeneric
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportFlotGraphGroup"].includes(tagName)) {
        return (
          <CCP4i2ReportFlotGraphGroup
            iItem={iItem}
            key={`${iItem}`}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportObjectGallery"].includes(tagName)) {
        return (
          <CCP4i2ReportObjectGallery
            iItem={iItem}
            key={`${iItem}`}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportTable"].includes(tagName)) {
        return (
          <CCP4i2ReportTable
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportText"].includes(tagName)) {
        return (
          <CCP4i2ReportText
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportTitle"].includes(tagName)) {
        return (
          <CCP4i2ReportTitle
            iItem={iItem}
            key={`${iItem}`}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportReference"].includes(tagName)) {
        return (
          <CCP4i2ReportReference
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportInputData"].includes(tagName)) {
        return (
          <CCP4i2ReportInputOutputData
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportOutputData"].includes(tagName)) {
        return (
          <CCP4i2ReportInputOutputData
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      }
    }
    return <div>{tagName}</div>;
  }, [item, iItem, job]);
  return <>{returnElement}</>;
};

export function cssToDict(cssText: string) {
  const regex = /([\w-]*)\s*:\s*([^;]*)/g;
  var match,
    properties: any = {};

  while ((match = regex.exec(cssText))) {
    const camelCase = match[1]
      .trim()
      .replace(/-(.)/g, (m, p) => p.toUpperCase());
    properties[camelCase] = match[2];
  }
  return properties;
}
