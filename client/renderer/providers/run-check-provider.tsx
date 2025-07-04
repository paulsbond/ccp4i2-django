import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "@mui/material";
import { useJob } from "../utils";

export type ProcessErrorsCallback = (validation: any) => any;
interface RunCheckContextType {
  runTaskRequested: number | null;
  setRunTaskRequested: (taskId: number | null) => void;
  processErrorsCallback: (validation: any) => any;
  setProcessErrorsCallback: (fn: ProcessErrorsCallback) => void;
  confirmTaskRun: (taskId: number) => Promise<boolean>;
}

export const RunCheckContext = createContext<RunCheckContextType>({
  runTaskRequested: null,
  setRunTaskRequested: () => {},
  confirmTaskRun: () => Promise.resolve(false),
  processErrorsCallback: (validation: any) => validation,
  setProcessErrorsCallback: () => {},
});

interface RunCheckProviderProps {
  children: ReactNode;
}

export const RunCheckProvider: React.FC<RunCheckProviderProps> = ({
  children,
}) => {
  const [runTaskRequested, setRunTaskRequested] = useState<number | null>(null);
  const [pendingResolve, setPendingResolve] = useState<
    ((value: boolean) => void) | null
  >(null);
  const [processErrorsCallback, setProcessErrorsCallback] =
    useState<ProcessErrorsCallback>((validation: any) => validation);

  const confirmTaskRun = (taskId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      setRunTaskRequested(taskId);
      setPendingResolve(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (pendingResolve) {
      pendingResolve(true);
      setPendingResolve(null);
    }
    setRunTaskRequested(null);
  };

  const handleCancel = () => {
    if (pendingResolve) {
      pendingResolve(false);
      setPendingResolve(null);
    }
    setRunTaskRequested(null);
  };

  return (
    <RunCheckContext.Provider
      value={{
        runTaskRequested,
        setRunTaskRequested,
        confirmTaskRun,
        processErrorsCallback,
        setProcessErrorsCallback,
      }}
    >
      {children}
      <ErrorAwareRunDialog
        runTaskRequested={runTaskRequested}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
      />
    </RunCheckContext.Provider>
  );
};

interface ErrorAwareRunDialogProps {
  runTaskRequested: number | null;
  handleConfirm: () => void;
  handleCancel: () => void;
}
const ErrorAwareRunDialog: React.FC<ErrorAwareRunDialogProps> = ({
  runTaskRequested,
  handleConfirm,
  handleCancel,
}) => {
  const { validation } = useJob(runTaskRequested || 0);
  const { processErrorsCallback } = useRunCheck();

  console.log(
    "processErrorsCallback",
    processErrorsCallback,
    typeof processErrorsCallback
  );

  const processedErrors = useMemo(() => {
    if (typeof processErrorsCallback === "function") {
      return processErrorsCallback(validation);
    }
    return validation;
  }, [validation, processErrorsCallback]);

  const seriousIssues = processedErrors
    ? Object.keys(processedErrors)
        .filter((key: string) =>
          [2, 3].includes(processedErrors[key].maxSeverity)
        )
        .map((key: string) => processedErrors[key].messages)
    : [];

  const blockingIssues = processedErrors
    ? Object.keys(processedErrors)
        .filter((key: string) => [2].includes(processedErrors[key].maxSeverity))
        .map((key: string) => processedErrors[key].messages)
    : [];

  return (
    <Dialog
      open={runTaskRequested !== null}
      onClose={() => handleCancel()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: { minWidth: 600 },
      }}
    >
      <DialogContent>
        <DialogTitle>Confirm Task Execution</DialogTitle>
        {seriousIssues.length > 0 && (
          <pre style={{ color: "red" }}>
            {seriousIssues.map((issueSet, index) =>
              issueSet.map((issue, issueIndex) => (
                <div key={`${index}_${issueIndex}`}>{issue}</div>
              ))
            )}
          </pre>
        )}
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={blockingIssues.length > 0}>
            Confirm
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export const useRunCheck = (): RunCheckContextType => {
  const context = useContext(RunCheckContext);
  if (!context) {
    throw new Error("useRunCheck must be used within a RunCheckProvider");
  }
  return context;
};
