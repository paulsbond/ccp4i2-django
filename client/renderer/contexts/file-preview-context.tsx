import { PropsWithChildren, useContext, useEffect, useState } from "react";
import { doRetrieve, fullUrl } from "../api";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Editor } from "@monaco-editor/react";
import { prettifyXml } from "../utils";
import { createContext } from "react";
import $ from "jquery";

export interface EditorContentSpecification {
  url: string;
  title: string;
  language: string;
}

interface FilePreviewDialogProps {
  contentSpecification: EditorContentSpecification | null;
  setContentSpecification: (spec: EditorContentSpecification | null) => void;
}

export const FilePreviewContext = createContext<FilePreviewDialogProps>({
  contentSpecification: null,
  setContentSpecification: () => {},
});

export const FilePreviewContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [contentSpecification, setContentSpecification] =
    useState<EditorContentSpecification | null>(null);
  return (
    <>
      <FilePreviewContext.Provider
        value={{ contentSpecification, setContentSpecification }}
      >
        {children}
        <FilePreviewDialog />
      </FilePreviewContext.Provider>
    </>
  );
};

const FilePreviewDialog: React.FC = () => {
  const { contentSpecification, setContentSpecification } =
    useContext(FilePreviewContext);
  const [previewContent, setPreviewContent] = useState<string | null>("");
  useEffect(() => {
    if (contentSpecification) {
      const asyncFunc = async () => {
        if (!contentSpecification.url) {
          return;
        }
        if (contentSpecification.url.endsWith("/download/")) {
          const fileContent = await doRetrieve(
            fullUrl(contentSpecification.url),
            contentSpecification.title
          );
          var enc = new TextDecoder("utf-8");
          setPreviewContent(enc.decode(fileContent));
        } else if (contentSpecification.url.includes("/digest_param_file/")) {
          const fileContent = await fetch(
            fullUrl(contentSpecification.url)
          ).then((response) => response.arrayBuffer());
          var enc = new TextDecoder("utf-8");
          const fileText = enc.decode(fileContent);
          if (contentSpecification.language === "json")
            setPreviewContent(JSON.stringify(JSON.parse(fileText), null, 2));
          else if (contentSpecification.language === "xml")
            setPreviewContent(prettifyXml($.parseXML(fileText)));
          else setPreviewContent(fileText);
        } else if (contentSpecification.url.includes("/project_file")) {
          const fileContent = await fetch(contentSpecification.url).then(
            (response) => response.arrayBuffer()
          );
          var enc = new TextDecoder("utf-8");
          const fileText = enc.decode(fileContent);
          if (contentSpecification.language === "json")
            setPreviewContent(JSON.stringify(JSON.parse(fileText), null, 2));
          else if (contentSpecification.language === "xml")
            setPreviewContent(prettifyXml($.parseXML(fileText)));
          else setPreviewContent(fileText);
        } else {
          const fileContent = await fetch(
            fullUrl(contentSpecification.url)
          ).then((response) => response.arrayBuffer());
          var enc = new TextDecoder("utf-8");
          const fileText = enc.decode(fileContent);
          if (contentSpecification.language === "json")
            setPreviewContent(JSON.stringify(JSON.parse(fileText), null, 2));
          else if (contentSpecification.language === "xml")
            setPreviewContent(prettifyXml($.parseXML(fileText)));
          else setPreviewContent(fileText);
        }
      };
      asyncFunc();
    }
  }, [contentSpecification]);

  return (
    <Dialog
      fullWidth
      maxWidth="xl"
      open={Boolean(contentSpecification)}
      onClose={() => {
        setContentSpecification(null);
      }}
    >
      <DialogTitle>{contentSpecification?.title}</DialogTitle>
      <DialogContent>
        <Editor
          width="100%"
          height="calc(100vh - 20rem)"
          value={previewContent || ""}
          language={contentSpecification?.language || "text"}
        />
      </DialogContent>
    </Dialog>
  );
};
