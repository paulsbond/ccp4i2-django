import { useContext } from "react";
import { useApi } from "../api";
import { CCP4i2Context } from "../app-context";
import { prettifyXml } from "./report/CCP4i2ReportFlotWidget";
import { Editor } from "@monaco-editor/react";
import { LinearProgress } from "@mui/material";
import { useJob } from "../utils";

export const ValidationViewer = () => {
  const api = useApi();
  const { jobId } = useContext(CCP4i2Context);
  const { validation } = useJob(jobId);
  return validation ? (
    <Editor
      height="calc(100vh - 15rem)"
      value={prettifyXml(validation)}
      language="xml"
    />
  ) : (
    <LinearProgress />
  );
};
