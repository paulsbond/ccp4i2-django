import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import $ from "jquery";
import { LinearProgress, Paper, Skeleton } from "@mui/material";
import { Job } from "../../models";
import { CCP4i2ReportElement } from "./CCP4i2ReportElement";
import { useApi } from "../../api";
import { M_PLUS_1 } from "next/font/google";

interface CCP4i2ReportXMLViewProps {
  jobId: string;
}

export const CCP4i2ReportXMLView: React.FC<CCP4i2ReportXMLViewProps> = ({
  jobId,
}) => {
  const api = useApi();
  const { data: job, mutate: mutateJob } = api.get<Job>(`jobs/${jobId}`);
  if (!job) return <LinearProgress />;

  const { data: report_xml, mutate: mutateReportXml } = api.get<any>(
    `jobs/${jobId}/report_xml`
  );
  const reloadTimeout = useRef<any>(null);

  const doReload = useCallback(() => {
    if (reloadTimeout.current != null) {
      clearTimeout(reloadTimeout.current);
      reloadTimeout.current = null;
    }
    setTimeout(async () => {
      await mutateReportXml();
      await mutateJob();
      if ([2, 3].includes(job.status)) {
        doReload();
      }
    }, 5000);
  }, [job]);

  useEffect(() => {
    if (reloadTimeout.current != null) {
      clearTimeout(reloadTimeout.current);
    }
    doReload();
  }, [job]);

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
      return $reportXMLDocument;
    }
    return null;
  }, [report_xml]);

  const reportContent = useMemo<ReactNode[] | null[] | null>(() => {
    if (!bodyNode) return null;
    return bodyNode
      .children()
      .children()
      .map((iItem: Number, item: any) => {
        return (
          <CCP4i2ReportElement
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        ); //callbackHandleItem(iItem, item) as ReactNode;
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
