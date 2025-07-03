import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Button } from "@mui/material";
import { useJob } from "../utils";
import { useApi } from "../api";

interface RunCheckContextType {
  runTaskRequested: number | null;
  setRunTaskRequested: (taskId: number | null) => void;
  filterErrors: null | ((validation: any) => any);
  confirmTaskRun: (taskId: number) => Promise<boolean>;
}

const RunCheckContext = createContext<RunCheckContextType | undefined>(
  undefined
);

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
  const [filterErrors, setFilterErrors] = useState<
    null | ((validation: any) => any)
  >((validation: any) => validation);

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
        filterErrors: filterErrors,
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
  const api = useApi();
  const { validation } = useJob(runTaskRequested || 0);
  const seriousIssues = validation
    ? Object.keys(validation)
        .filter((key: string) => validation[key].maxSeverity == 2)
        .map((key: string) => `${validation[key].messages}`)
    : [];

  return (
    <Dialog open={runTaskRequested !== null} onClose={() => handleCancel()}>
      <DialogContent>
        <DialogTitle>Confirm Task Execution</DialogTitle>
        {seriousIssues.length > 0 && (
          <Typography color="error" variant="body1">
            {seriousIssues.map((issue, index) => (
              <pre>{issue}</pre>
            ))}
          </Typography>
        )}
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={seriousIssues.length > 0}>
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
