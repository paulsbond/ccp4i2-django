"use client";
import { PropsWithChildren, use, useState } from "react";
import { Stack, Tab, Tabs } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProjectDirectory from "../../components/project-directory";
import ToolBar from "../../components/tool-bar";
import { JobsGrid } from "../../components/jobs-grid";

export interface ProjectLayoutProps extends PropsWithChildren {
  params: Promise<{ id: number }>;
}
export default function ProjectLayout(props: ProjectLayoutProps) {
  const [tabValue, setTabValue] = useState(0);
  const { id } = use(props.params);

  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    setTabValue(value);
  };

  return (
    <Stack spacing={2} sx={{ height: "100vh" }}>
      <ToolBar />
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab value={0} label="Job list" />
            <Tab value={1} label="Project directory" />
          </Tabs>
          {tabValue == 0 && <JobsGrid projectId={id} size={12} />}
          {tabValue == 1 && <ProjectDirectory />}
        </Panel>
        <PanelResizeHandle style={{ width: 5, backgroundColor: "black" }} />
        <Panel defaultSize={70} minSize={20}>
          {props.children}
        </Panel>
      </PanelGroup>
    </Stack>
  );
}
