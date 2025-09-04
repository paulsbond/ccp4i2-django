import {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { doRetrieve, fullUrl } from "../api";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Editor } from "@monaco-editor/react";
import { prettifyXml } from "../utils";
import { createContext } from "react";
import $ from "jquery";
import { parseMTZ } from "../mtzparser";
import { useCCP4i2Window } from "../app-context";

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

export const FilePreviewProvider: React.FC<PropsWithChildren> = ({
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
    useFilePreviewContext();
  const [previewContent, setPreviewContent] = useState<string | null>("");
  const { cootModule } = useCCP4i2Window();

  const handleMtzPreview = useCallback(
    async (fileContent: ArrayBuffer) => {
      if (cootModule) {
        const byteArray = new Uint8Array(fileContent);
        try {
          cootModule.FS_unlink("/tmp/fileName");
        } catch (e) {}
        cootModule.FS_createDataFile("/tmp", "fileName", byteArray, true, true);
        const header_info_em: any = cootModule.get_mtz_columns("/tmp/fileName");
        cootModule.FS_unlink("/tmp/fileName");
        // Convert emscripten array to regular array for easier handling
        const header_info: string[] = [];
        for (let key = 0; key < header_info_em.size(); key++) {
          header_info.push(header_info_em.get(key));
        }
        console.log(header_info);
        setPreviewContent(JSON.stringify(header_info, null, 2));
      }
    },
    [cootModule]
  );

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
        } else {
          const fileContent = await fetch(contentSpecification.url).then(
            (response) => response.arrayBuffer()
          );
          var enc = new TextDecoder("utf-8");
          if (contentSpecification.language === "json") {
            const fileText = enc.decode(fileContent);
            setPreviewContent(JSON.stringify(JSON.parse(fileText), null, 2));
          } else if (contentSpecification.language === "mtz") {
            handleMtzPreview(fileContent);
          } else if (contentSpecification.language === "xml") {
            const fileText = enc.decode(fileContent);
            setPreviewContent(prettifyXml($.parseXML(fileText)));
          } else {
            const fileText = enc.decode(fileContent);
            setPreviewContent(fileText);
          }
        }
      };
      asyncFunc();
    }
  }, [contentSpecification, cootModule]);

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

export const useFilePreviewContext = () => {
  const context = useContext(FilePreviewContext);
  if (!context) {
    throw new Error(
      "useFilePreviewContext must be used within a FilePreviewProvider"
    );
  }
  return context;
};
