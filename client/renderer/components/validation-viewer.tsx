import { Editor } from "@monaco-editor/react";
import { useContext, useMemo } from "react";
import { RunCheckContext } from "../providers/run-check-provider";
import { useJob } from "../utils";
interface ValidationViewerProps {
  jobId?: number;
}
export const ValidationViewer: React.FC<ValidationViewerProps> = ({
  jobId,
}) => {
  const { processedErrors } = useContext(RunCheckContext);
  const { validation } = useJob(jobId || -1);
  const compiledErrors = useMemo(() => {
    return { ...validation, ...processedErrors };
  }, [processedErrors, validation]);
  return (
    <Editor
      height="calc(100vh - 15rem)"
      value={JSON.stringify(compiledErrors, null, 2)}
      language="json"
    />
  );
};
