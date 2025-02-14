import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import $ from "jquery";
import { LinearProgress, Paper, Skeleton } from "@mui/material";
import { Job } from "../../models";
import { CCP4i2ReportElement } from "./CCP4i2ReportElement";
import { useApi } from "../../api";
import { M_PLUS_1 } from "next/font/google";
import { CCP4i2Context } from "../../app-context";

export const CCP4i2ReportXMLView = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { data: job, mutate: mutateJob } = api.follow<Job>(`jobs/${jobId}`);
  const { data: report_xml, mutate: mutateReportXml } =
    job?.status == 3
      ? api.follow_endpoint_xml({
          type: "jobs",
          id: jobId,
          endpoint: "report_xml",
        })
      : api.get_endpoint_xml({
          type: "jobs",
          id: jobId,
          endpoint: "report_xml",
        });

  if (!job) return <LinearProgress />;

  const bodyNode = useMemo<JQuery<XMLDocument> | null>(() => {
    if (report_xml) {
      //return $(report_xml);
      const reportXMLDocument = report_xml;
      const $reportXMLDocument = $(reportXMLDocument);
      let iterator: any;
      try {
        iterator = reportXMLDocument.evaluate(
          "//CCP4i2ReportGeneric/br",
          reportXMLDocument,
          null,
          XPathResult.ORDERED_NODE_ITERATOR_TYPE
        );
      } catch (err) {
        console.log(err, reportXMLDocument);
      }
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
      const reportXMLDocument1 = $.parseXML(modifiedXmlString);
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
