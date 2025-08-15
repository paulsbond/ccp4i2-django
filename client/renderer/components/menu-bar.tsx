import { AppBar, FormControlLabel, Switch, Typography } from "@mui/material";
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

export default function MenuBar() {
  const { projectId, jobId, devMode, setDevMode } = useCCP4i2Window();
  const api = useApi();
  const { data: project, mutate: mutateProject } = api.get<Project>(
    `projects/${projectId}`
  );
  const { data: job } = api.get<Job>(`jobs/${jobId}`);
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

  const onToggleDevMode = async (
    ev: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!window.electronAPI) {
      console.error("Electron API is not available");
      return;
    }
    window.electronAPI.sendMessage("toggle-dev-mode", {});
    ev.preventDefault();
    ev.stopPropagation();
  };
  return (
    <AppBar position="static">
      <HistoryToolbar>
        <FormControlLabel
          control={
            <Switch
              checked={devMode}
              onChange={onToggleDevMode}
              name="devModeToggle"
              color="warning"
            />
          }
          label="Dev Mode"
        />
        <FileMenu />
        <EditMenu />
        <ViewMenu />
        <UtilMenu />
        <HelpMenu />
        <Typography sx={{ flexGrow: 1 }} />
        {job?.number && <Typography variant="h6">Job {job.number}</Typography>}
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
