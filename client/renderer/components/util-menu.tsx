"use client";
import { useCallback, useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { RunningProcessesContext } from "./contexts/running-processes";

export default function UtilMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { jobsAndProcessesDialogOpen, setJobsAndProcessesDialogOpen } =
    useContext(RunningProcessesContext);
  const router = useRouter();
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSystemAdministratorToolsClick = () => {
    router.push("/config");
    handleClose();
  };
  const handleRunningJobsClick = useCallback(async () => {
    console.log(setJobsAndProcessesDialogOpen);
    setJobsAndProcessesDialogOpen(true);
    handleClose();
  }, [setJobsAndProcessesDialogOpen]);

  return (
    <>
      <Button color="inherit" onClick={handleClick}>
        Utilities
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Copy demo data to project</MenuItem>
        <MenuItem onClick={handleRunningJobsClick}>
          Running jobs and processes {`${jobsAndProcessesDialogOpen}`}
        </MenuItem>
        <MenuItem onClick={handleClose}>Manage imported files</MenuItem>
        <MenuItem onClick={handleClose}>Send error report</MenuItem>
        <MenuItem onClick={handleSystemAdministratorToolsClick}>
          System administrator tools
        </MenuItem>
        <MenuItem onClick={handleClose}>Developer tools</MenuItem>
      </Menu>
    </>
  );
}
