import { AppBar, Toolbar, Typography } from "@mui/material";
import EditMenu from "./edit-menu";
import FileMenu from "./file-menu";
import HelpMenu from "./help-menu";
import UtilMenu from "./util-menu";
import ViewMenu from "./view-menu";
import { useContext } from "react";
import { CCP4i2Context } from "../app-context";
import { useApi } from "../api";
import { Job, Project } from "../models";
import EditableTypography from "./editable-typography";

export default function MenuBar() {
  const { projectId, jobId } = useContext(CCP4i2Context);
  const api = useApi();
  const { data: project, mutate: mutateProject } = api.get<Project>(
    `projects/${projectId}`
  );
  const { data: job } = api.get<Job>(`jobs/${jobId}`);
  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <FileMenu />
        <EditMenu />
        <ViewMenu />
        <UtilMenu />
        <HelpMenu />
        <Typography sx={{ flexGrow: 1 }} />
        {job && <Typography variant="h6">Job {job.number}</Typography>}
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
      </Toolbar>
    </AppBar>
  );
}
