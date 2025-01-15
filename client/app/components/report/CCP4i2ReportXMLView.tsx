import { Fragment, ReactNode, useCallback, useMemo } from "react";
import $ from "jquery";
import { Paper, Skeleton, Typography } from "@mui/material";
//@ts-ignore
import { handleItem } from "./CCP4i2ReportElements";
import { Job } from "../../models";
import { CCP4i2ReportElement } from "./CCP4i2ReportElements";

interface CCP4i2ReportXMLViewProps {
  report_xml: { report_xml: string };
  job: Job;
}

export const CCP4i2ReportXMLView: React.FC<CCP4i2ReportXMLViewProps> = ({
  report_xml,
  job,
}) => {
  const bodyNode = useMemo<JQuery<XMLDocument> | null>(() => {
    if (report_xml.report_xml) {
      const reportXMLDocument = $.parseXML(report_xml.report_xml);
      const $reportXMLDocument = $(reportXMLDocument);
      const iterator = reportXMLDocument.evaluate(
        "//CCP4i2ReportGeneric/br",
        reportXMLDocument,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE
      );
      try {
        const matchingNodes = [];
        let thisNode = iterator.iterateNext();

        while (thisNode) {
          matchingNodes.push(thisNode);
          thisNode = iterator.iterateNext();
        }
        console.log({ matchingNodes });
        matchingNodes.forEach((thisNode) => {
          const lastNode = thisNode;
          thisNode.parentNode?.removeChild(thisNode);
        });
      } catch (e) {
        console.error(`Error: Document tree modified during iteration ${e}`);
      }
      const modifiedXmlString = new XMLSerializer().serializeToString(
        reportXMLDocument
      );
      const reportXMLDocument1 = $.parseXML(report_xml.report_xml);
      const $reportXMLDocument1 = $(reportXMLDocument1);
      return $reportXMLDocument1;
    }
    return null;
  }, []);

  const callbackHandleItem = useCallback(
    (iItem: Number, item: any) => {
      if (job) {
        return handleItem(iItem, item, job);
      }
    },
    [job]
  );

  const reportContent = useMemo<ReactNode[] | null[] | null>(() => {
    if (!bodyNode) return null;
    return bodyNode
      .children()
      .children()
      .map((iItem: Number, item: any) => {
        return <CCP4i2ReportElement iItem={iItem} item={item} job={job} />; //callbackHandleItem(iItem, item) as ReactNode;
      })
      .toArray();
  }, [bodyNode]);

  if (!bodyNode) return <Skeleton />;

  return (
    <Paper
      sx={{
        width: "100%",
        height: "calc(100vh - 14rem)",
        overflowY: "auto",
      }}
    >
      {reportContent}
    </Paper>
  );
};
