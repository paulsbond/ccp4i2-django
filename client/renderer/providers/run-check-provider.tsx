import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
  useRef,
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

/**
 * An error report keyed by parameter name or error type.
 * Each entry contains a maxSeverity (number) and an array of messages (strings).
 */
export interface CCP4i2ErrorReport {
  [key: string]: {
    maxSeverity: number;
    messages: string[];
    // You can add more fields here if needed
  };
}

/**
 * An object whose keys are strings and values are ReactNode actions.
 */
export interface CCP4i2RunActions {
  [key: string]: ReactNode;
}

export type ProcessErrorsCallback = (validation: CCP4i2ErrorReport) => any;

interface RunCheckContextType {
  runTaskRequested: number | null;
  setRunTaskRequested: (taskId: number | null) => void;
  processErrorsCallback: null | ProcessErrorsCallback;
  setProcessErrorsCallback: (fn: null | ProcessErrorsCallback) => void;
  confirmTaskRun: (taskId: number) => Promise<boolean>;
  extraDialogActions: CCP4i2RunActions;
  setExtraDialogActions: (actions: CCP4i2RunActions) => void;
  processedErrors: CCP4i2ErrorReport | null;
}

export const RunCheckContext = createContext<RunCheckContextType>({
  runTaskRequested: null,
  setRunTaskRequested: () => {},
  confirmTaskRun: () => Promise.resolve(false),
  processErrorsCallback: null,
  setProcessErrorsCallback: () => {},
  extraDialogActions: {},
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
  const [extraDialogActions, setExtraDialogActions] =
    useState<CCP4i2RunActions>({});
  const { jobId } = useContext(CCP4i2Context);
  const { validation } = useJob(parseInt(`${jobId}` || "0"));

  const processedErrors: CCP4i2ErrorReport | null = useMemo(() => {
    if (
      validation &&
      processErrorsCallback &&
      typeof processErrorsCallback === "function"
    ) {
      const result = processErrorsCallback(validation);
      console.log({ processedErrors: result });
      return result;
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
  const autoSubmitTimer = useRef<NodeJS.Timeout | null>(null);
  const { jobId } = useContext(CCP4i2Context);

  // ...inside ErrorAwareRunDialog...

  const seriousIssues: CCP4i2ErrorReport | null = processedErrors
    ? Object.fromEntries(
        Object.entries(processedErrors).filter(
          ([_, value]) => value.maxSeverity === 2 || value.maxSeverity === 3
        )
      )
    : null;

  const blockingIssues: CCP4i2ErrorReport | null = processedErrors
    ? Object.fromEntries(
        Object.entries(processedErrors).filter(
          ([_, value]) => value.maxSeverity === 2
        )
      )
    : null;

  const hasSeriousIssues = seriousIssues
    ? Object.keys(seriousIssues).length > 0
    : false;

  useEffect(() => {
    if (autoSubmitTimer.current) {
      clearTimeout(autoSubmitTimer.current);
    }
    if (
      !hasSeriousIssues &&
      runTaskRequested !== null &&
      jobId !== null &&
      jobId === runTaskRequested
    ) {
      autoSubmitTimer.current = setTimeout(() => {
        handleConfirm();
      }, 100); // Auto-submit after 100 milliseconds if no serious issues
    }
    return () => {
      if (autoSubmitTimer.current) {
        clearTimeout(autoSubmitTimer.current);
      }
    };
  }, [seriousIssues, runTaskRequested, jobId]);

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
        {seriousIssues && Object.keys(seriousIssues).length > 0 && (
          <pre style={{ color: "red" }}>
            {Object.entries(seriousIssues).map(([key, issueSet], index) =>
              issueSet.messages.map((issue, issueIndex) => (
                <div key={`${key}_${issueIndex}`}>{issue}</div>
              ))
            )}
          </pre>
        )}
        <DialogActions>
          {Object.keys(extraDialogActions)?.map((actionName, index) => (
            <React.Fragment key={index}>
              {extraDialogActions[actionName]}
            </React.Fragment> // Ensure each action is wrapped in a fragment
          ))}
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={
              blockingIssues !== null && Object.keys(blockingIssues).length > 0
            }
          >
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
