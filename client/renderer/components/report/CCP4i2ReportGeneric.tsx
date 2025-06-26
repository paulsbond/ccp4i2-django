import { useEffect, useMemo, useState } from "react";
import $ from "jquery";
import { CCP4i2RVAPITable } from "./CCP4i2RVAPITable";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";

export const CCP4i2ReportGeneric: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  const [isRVAPITable, setIsRVAPITable] = useState(false);

  useEffect(() => {
    setIsRVAPITable($(props.item).children("table.rvapi-page").length > 0);
  }, [props.item, props.job]);

  const tableBody = useMemo(() => {
    const tableBody = $(props.item).find("tbody").get(0);
    return tableBody;
  }, [props.item]);

  // Clean up SVG namespaces for rendering
  const cleanedInnerHTML = useMemo(() => {
    let html = props.item.innerHTML;
    // Remove all namespace prefixes like ns0:
    html = html.replace(/<\s*\/?\s*ns\d*:/g, (match) =>
      match.replace(/ns\d*:/, "")
    );
    // Remove xmlns:ns0="..." attributes
    html = html.replace(/xmlns:ns\d+="[^"]*"/g, "");
    return html;
  }, [props.item.innerHTML]);

  return isRVAPITable && tableBody ? (
    <CCP4i2RVAPITable iItem={props.iItem} item={tableBody} job={props.job} />
  ) : (
    <div dangerouslySetInnerHTML={{ __html: cleanedInnerHTML }} />
  );
};
