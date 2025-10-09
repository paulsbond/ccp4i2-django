import { AppBar, Typography, IconButton } from "@mui/material";
import LanIcon from "@mui/icons-material/Lan";
import EditMenu from "./edit-menu";
import FileMenu from "./file-menu";
import HelpMenu from "./help-menu";
import UtilMenu from "./util-menu";
import ViewMenu from "./view-menu";
import { useEffect } from "react";
import { useCCP4i2Window } from "../app-context";
import { useApi } from "../api";
import { Job, Project } from "../types/models";
import EditableTypography from "./editable-typography";
import HistoryToolbar from "./history-toolbar";
import { useRouter } from "next/navigation";
import { DevModeToggle } from "./dev-mode-toggle";

export default function MenuBar() {
  const { projectId, jobId, devMode, setDevMode } = useCCP4i2Window();
  const api = useApi();
  const { data: project, mutate: mutateProject } = api.get<Project>(
    `projects/${projectId}`
  );
  const { data: job } = api.get<Job>(`jobs/${jobId}`);
  const router = useRouter();
  useEffect(() => {
    // Send a message to the main process to get the config
    if (window.electronAPI) {
      window.electronAPI.sendMessage("get-config");
      // Listen for messages from the main process
      window.electronAPI.onMessage(
        "message-from-main",
        (event: any, data: any) => {
          if (data.message === "get-config") {
            setDevMode(data.config.devMode);
          }
        }
      );
    } else console.log("window.electron is not available");
  }, []);

  return (
    <AppBar position="static">
      <HistoryToolbar>
        <FileMenu />
        <EditMenu />
        <ViewMenu />
        <UtilMenu />
        <HelpMenu />
        {project && (
          <IconButton
            color="info"
            aria-label="View network"
            onClick={() => router.push(`/project/${projectId}/network`)}
            sx={{ ml: 1 }}
          >
            <LanIcon />
          </IconButton>
        )}
        <Typography sx={{ flexGrow: 1 }} />
        {job?.number && (
          <EditableTypography variant="h5" text={`Job ${job.number}: `} />
        )}
        {project && (
          <EditableTypography
            variant="h5"
            text={project.name}
            onDelay={(name) =>
              api.patch(`projects/${project.id}`, { name: name }).then((_) => {
                mutateProject();
              })
            }
          />
        )}
      </HistoryToolbar>
    </AppBar>
  );
}
