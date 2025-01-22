"use client";
import { PropsWithChildren, use, useContext, useEffect, useState } from "react";
import { Paper, Stack, Tab, Tabs } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProjectDirectory from "../../components/project-directory";
import ToolBar from "../../components/tool-bar";
import { JobsGrid } from "../../components/jobs-grid";
import { CCP4i2Context } from "../../app-context";
import { useApi } from "../../api";
import { Project } from "../../models";

export interface ProjectLayoutProps extends PropsWithChildren {
  params: Promise<{ id: number }>;
}
export default function ProjectLayout(props: ProjectLayoutProps) {
  const { setProjectId } = useContext(CCP4i2Context);
  const api = useApi();
  const [tabValue, setTabValue] = useState(0);
  const { id } = use(props.params);
  const { data: project } = api.get<Project>(`projects/${id}`);
  useEffect(() => {
    const asyncFunc = async () => {
      if (project && setProjectId) {
        setProjectId(project.id);
      }
    };
    asyncFunc();
  }, [project, setProjectId]);

  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    setTabValue(value);
  };

  return (
    <Stack
      spacing={2}
      sx={{ height: "calc(100vh - 4rem)", paddingTop: "1rem" }}
    >
      <ToolBar />
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <Paper sx={{ overflowY: "auto", height: "calc(100vh - 8rem)" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab value={0} label="Job list" />
              <Tab value={1} label="Project directory" />
            </Tabs>
            {tabValue == 0 && <JobsGrid projectId={id} size={12} />}
            {tabValue == 1 && <ProjectDirectory />}
          </Paper>
        </Panel>
        <PanelResizeHandle style={{ width: 5, backgroundColor: "black" }} />
        <Panel defaultSize={70} minSize={20}>
          {props.children}
        </Panel>
      </PanelGroup>
    </Stack>
  );
}
