import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
} from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "@mui/material";
import { useJob } from "../utils";
import { CCP4i2Context } from "../app-context";

export type ProcessErrorsCallback = (validation: any) => any;
interface RunCheckContextType {
  runTaskRequested: number | null;
  setRunTaskRequested: (taskId: number | null) => void;
  processErrorsCallback: null | ProcessErrorsCallback;
  setProcessErrorsCallback: (fn: null | ProcessErrorsCallback) => void;
  confirmTaskRun: (taskId: number) => Promise<boolean>;
  extraDialogActions?: React.ReactNode[];
  setExtraDialogActions: (actions: React.ReactNode[]) => void;
  processedErrors: any[] | null;
}

export const RunCheckContext = createContext<RunCheckContextType>({
  runTaskRequested: null,
  setRunTaskRequested: () => {},
  confirmTaskRun: () => Promise.resolve(false),
  processErrorsCallback: null,
  setProcessErrorsCallback: () => {},
  extraDialogActions: [],
  setExtraDialogActions: () => {},
  processedErrors: null,
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
    useState<ProcessErrorsCallback | null>(null);
  const [extraDialogActions, setExtraDialogActions] = useState<
    React.ReactNode[]
  >([]);
  const { jobId } = useContext(CCP4i2Context);
  const { validation } = useJob(parseInt(`${jobId}` || "0"));

  const processedErrors = useMemo(() => {
    if (
      validation &&
      processErrorsCallback &&
      typeof processErrorsCallback === "function"
    ) {
      return processErrorsCallback(validation);
    }
    return validation;
  }, [processErrorsCallback, validation, jobId]);

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
        extraDialogActions,
        setExtraDialogActions,
        processedErrors,
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
  const { extraDialogActions, processedErrors } = useRunCheck();

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

  // Automatically confirm if there are no serious issues
  useEffect(() => {
    if (runTaskRequested !== null && seriousIssues.length === 0) {
      handleConfirm();
    }
  }, [runTaskRequested, seriousIssues, handleConfirm]);

  return (
    <Dialog
      open={runTaskRequested !== null}
      onClose={() => handleCancel()}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          style: { minWidth: 600 },
        },
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
          {extraDialogActions?.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment> // Ensure each action is wrapped in a fragment
          ))}
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
