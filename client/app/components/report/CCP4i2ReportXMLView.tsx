import { Fragment, ReactNode, useCallback, useMemo } from "react";
import $ from "jquery";
import { Paper, Skeleton, Typography } from "@mui/material";
//@ts-ignore
import { handleItem } from "./CCP4i2ReportElements";
import { Job } from "../../models";

interface CCP4i2ReportXMLViewProps {
  report_xml: { report_xml: string };
  job: Job;
}

export const CCP4i2ReportXMLView: React.FC<CCP4i2ReportXMLViewProps> = ({
  report_xml,
  job,
}) => {
  const bodyNode = useMemo<JQuery<XMLDocument> | null>(() => {
    if (report_xml.report_xml) return $($.parseXML(report_xml.report_xml));
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
        return callbackHandleItem(iItem, item) as ReactNode;
      })
      .toArray();
  }, [bodyNode]);

  if (!bodyNode) return <Skeleton />;

  return (
    <Paper
      sx={{
        width: "100%",
        height: "calc(100vh - 15rem)",
        overflowY: "auto",
      }}
    >
      {reportContent}
    </Paper>
  );
};
