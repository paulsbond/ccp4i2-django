import {
  Button,
  Stack,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu as MuiMenu,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  Code,
  ContentCopy,
  Description,
  DirectionsRun,
  Help,
  Menu,
  MenuBook,
  SystemUpdateAlt,
  MoreVert,
} from "@mui/icons-material";
import React, { useRef, useEffect, useState } from "react";
import { useApi } from "../api";
import { Job } from "../types/models";
import { useCCP4i2Window } from "../app-context";
import { useRouter } from "next/navigation";
import { HelpIframe } from "./help_iframe";
import { usePopcorn } from "../providers/popcorn-provider";
import { useRunCheck } from "../providers/run-check-provider";
import { useJobTab } from "../providers/job-tab-provider";

export default function ToolBar() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState<number>(0);
  const { projectId, jobId } = useCCP4i2Window();
  const api = useApi();
  const { data: job, mutate: mutateJob } = api.get_endpoint<Job>({
    type: "jobs",
    id: jobId,
    endpoint: "",
  });
  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: projectId,
    endpoint: "jobs",
  });
  const router = useRouter();
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showI2RunDialog, setShowI2RunDialog] = useState(false);
  const [i2RunCommand, setI2RunCommand] = useState<string>("");
  const { setMessage } = usePopcorn();
  const { confirmTaskRun } = useRunCheck();
  const { setJobTabValue } = useJobTab();

  // For menu of hidden buttons
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    const observer = new window.ResizeObserver((entries) => {
      for (let entry of entries) {
        setPanelWidth(entry.contentRect.width);
      }
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  const handleClone = async () => {
    if (job) {
      const cloneResult: Job = await api.post(`jobs/${job?.id}/clone/`);
      if (cloneResult?.id) {
        mutateJob();
        mutateJobs();
        router.push(`/project/${projectId}/job/${cloneResult.id}`);
      }
    }
  };
  const handleRun = async () => {
    if (job) {
      const confirmed = await confirmTaskRun(job.id);
      if (!confirmed) return;
      const runResult: Job = await api.post(`jobs/${job.id}/run/`);
      setMessage(`Submitted job ${runResult?.number}: ${runResult?.task_name}`);
      if (runResult?.id) {
        setTimeout(() => {
          mutateJob();
          mutateJobs();
        }, 1000);
      }
    }
  };

  const handleI2Run = async () => {
    if (job) {
      const result: { status: string; command: string } = await fetch(
        `/api/proxy/jobs/${job.id}/i2run_command/`
      ).then((res) => res.json());
      if (result?.command) {
        navigator.clipboard.writeText(result.command);
        setMessage("i2run command copied to clipboard");
        setI2RunCommand(result.command);
        setShowI2RunDialog(true);
      }
    }
  };

  const handleLog = () => {
    setJobTabValue(10);
  };

  // Example breakpoints for button visibility
  const showClone = panelWidth > 550;
  const showHelp = panelWidth > 650;
  const showBibliography = panelWidth > 750;
  const showExportMTZ = panelWidth > 950;
  const showLogFile = panelWidth > 1100;
  const showI2Run = panelWidth > 1200;

  // Track which buttons are hidden
  const hiddenButtons = [
    !showClone && {
      label: "Clone job",
      icon: <ContentCopy />,
      onClick: handleClone,
    },
    !showHelp && {
      label: "Help",
      icon: <Help />,
      onClick: () => {
        if (window?.open) {
          window.open(
            `https://ccp4i2.gitlab.io/rstdocs/tasks/${job?.task_name}/index.html`
          );
        }
      },
    },
    !showBibliography && {
      label: "Bibliography",
      icon: <MenuBook />,
      onClick: () => {},
    },
    !showExportMTZ && {
      label: "Export MTZ",
      icon: <SystemUpdateAlt />,
      onClick: () => {},
      disabled: job?.status != 6,
    },
    !showLogFile && {
      label: "Show log files",
      icon: <Description />,
      onClick: handleLog,
    },
    !showI2Run && {
      label: "i2run command",
      icon: <Code />,
      onClick: handleI2Run,
    },
  ].filter(Boolean);

  return (
    <>
      <div ref={panelRef}>
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{ flexWrap: "wrap", justifyContent: "center", px: 2, mb: 1 }}
        >
          <Button
            variant="outlined"
            startIcon={<Menu />}
            onClick={() => {
              router.push(`/project/${projectId}`);
            }}
          >
            Task menu
          </Button>
          <Button
            variant="outlined"
            startIcon={<DirectionsRun />}
            disabled={job?.status != 1}
            onClick={handleRun}
          >
            Run
          </Button>
          {showClone && (
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={handleClone}
            >
              Clone job
            </Button>
          )}
          {showHelp && (
            <Button
              variant="outlined"
              startIcon={<Help />}
              onClick={() => {
                if (window?.open) {
                  window.open(
                    `https://ccp4i2.gitlab.io/rstdocs/tasks/${job?.task_name}/index.html`
                  );
                }
              }}
            >
              Help
            </Button>
          )}
          {showBibliography && (
            <Button variant="outlined" startIcon={<MenuBook />}>
              Bibliography
            </Button>
          )}
          {showExportMTZ && (
            <Button
              variant="outlined"
              startIcon={<SystemUpdateAlt />}
              disabled={job?.status != 6}
            >
              Export MTZ
            </Button>
          )}
          {showLogFile && (
            <Button
              variant="outlined"
              startIcon={<Description />}
              disabled={job?.status != 6}
              onClick={handleLog}
            >
              Show log file
            </Button>
          )}
          {showI2Run && (
            <Button
              variant="outlined"
              startIcon={<Code />}
              onClick={handleI2Run}
            >
              i2run command
            </Button>
          )}
          {hiddenButtons.length > 0 && (
            <>
              <IconButton
                aria-label="More"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ ml: 1 }}
              >
                <MoreVert />
              </IconButton>
              <MuiMenu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                {hiddenButtons.map(
                  (btn, idx) =>
                    btn && (
                      <MenuItem
                        key={btn.label}
                        onClick={() => {
                          btn.onClick();
                          setMenuAnchor(null);
                        }}
                        disabled={btn.disabled}
                      >
                        {btn.icon}
                        <span style={{ marginLeft: 8 }}>{btn.label}</span>
                      </MenuItem>
                    )
                )}
              </MuiMenu>
            </>
          )}
          <HelpIframe
            url={`/help/html/tasks/${job?.task_name}/index.html`}
            open={showHelpPanel}
            handleClose={() => {
              setShowHelpPanel(false);
            }}
          />
        </Stack>
      </div>
      <Dialog open={showI2RunDialog} onClose={() => setShowI2RunDialog(false)}>
        <DialogTitle>i2run Command</DialogTitle>
        <DialogContent>
          <code style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
            {i2RunCommand}
          </code>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowI2RunDialog(false)} variant="contained">
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
