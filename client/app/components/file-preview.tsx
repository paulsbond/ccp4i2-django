import { useContext, useEffect, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { doRetrieve, useApi } from "../api";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Editor } from "@monaco-editor/react";
import { prettifyXml } from "./report/CCP4i2ReportFlotWidget";

interface FilePreviewProps {
  url: string | null;
  setUrl: (url: string | null) => void;
  filename: string | null;
}
export const FilePreviewDialog: React.FC<FilePreviewProps> = ({
  url,
  setUrl,
  filename,
}) => {
  const [previewContent, setPreviewContent] = useState("");

  useEffect(() => {
    const asyncFunc = async () => {
      if (url && filename) {
        const fileContent = await doRetrieve(url, filename);
        var enc = new TextDecoder("utf-8");
        setPreviewContent(enc.decode(fileContent));
      }
    };
    asyncFunc();
  }, [url, filename]);

  return (
    <Dialog
      fullWidth
      maxWidth="xl"
      open={Boolean(url)}
      onClose={() => {
        setUrl(null);
      }}
    >
      <DialogTitle>{filename}</DialogTitle>
      <DialogContent>
        {url && filename && previewContent && (
          <Editor
            width="100%"
            height="calc(100vh - 20rem)"
            value={
              previewContent && filename.endsWith("xml")
                ? prettifyXml($.parseXML(previewContent))
                : previewContent
            }
            language={
              filename.endsWith("xml")
                ? "xml"
                : filename.endsWith("json")
                ? "json"
                : filename.endsWith("log")
                ? "log"
                : "text"
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
