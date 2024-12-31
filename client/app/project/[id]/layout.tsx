"use client";
import { PropsWithChildren, useState } from "react";
import { Stack, Tab, Tabs } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import MenuBar from "../../components/menu-bar";
import ToolBar from "../../components/tool-bar";

export default function ProjectLayout(props: PropsWithChildren) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, value: number) => {
    setTabValue(value);
  };

  return (
    <Stack spacing={2} sx={{ height: "100vh" }}>
      <MenuBar />
      <ToolBar />
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Job list" />
            <Tab label="Project directory" />
          </Tabs>
        </Panel>
        <PanelResizeHandle style={{ width: 5, backgroundColor: "black" }} />
        <Panel defaultSize={70} minSize={20}>
          {props.children}
        </Panel>
      </PanelGroup>
    </Stack>
  );
}
