"use client";
import { PropsWithChildren, use, useContext, useEffect, useState } from "react";
import { Paper, Stack, Tab, Tabs } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CCP4i2Context } from "../../../app-context";
import { useApi } from "../../../api";
import { CCP4i2DirectoryViewer } from "../../../components/directory_viewer";
import { useProject } from "../../../utils";
import { ClassicJobList } from "../../../components/classic-jobs-list";
import { DraggableContext } from "../../../providers/draggable-context";
import { CootProvider } from "../../../providers/coot-provider";
import { FilePreviewContextProvider } from "../../../providers/file-preview-context";
import { Job } from "../../../types/models";
import { JobMenuContextProvider } from "../../../providers/job-context-menu";
import { FileMenuContextProvider } from "../../../providers/file-context-menu";
import MenuBar from "../../../components/menu-bar";
import { NavigationShortcutsProvider } from "../../../providers/navigation-shortcuts-provider";

export interface ProjectLayoutProps extends PropsWithChildren {
  params: Promise<{ id: string; jobid: string }>;
}

export default function ProjectLayout(props: ProjectLayoutProps) {
  const { setProjectId, setCootModule, setJobPanelSize } =
    useContext(CCP4i2Context);
  const api = useApi();
  const [tabValue, setTabValue] = useState(0);
  const { id } = use(props.params);
  const { project } = useProject(parseInt(id));

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
    <DraggableContext>
      <NavigationShortcutsProvider>
        <Stack
          spacing={2}
          sx={{
            height: "calc(100vh - 4rem)",
            paddingTop: "1rem",
            width: "100%",
          }}
        >
          <CootProvider>
            <FilePreviewContextProvider>
              <JobMenuContextProvider>
                <FileMenuContextProvider>
                  <MenuBar />
                  <PanelGroup direction="horizontal">
                    <Panel defaultSize={30} minSize={20}>
                      <Paper
                        sx={{ overflowY: "auto", height: "calc(100vh - 8rem)" }}
                      >
                        <Tabs
                          value={tabValue}
                          onChange={handleTabChange}
                          variant="fullWidth"
                        >
                          <Tab value={0} label="Job list" />
                          {/*<Tab value={1} label="Job grid" />*/}
                          <Tab value={2} label="Project directory" />
                        </Tabs>
                        {tabValue == 0 && project && (
                          <ClassicJobList projectId={project.id} />
                        )}
                        {/*tabValue == 1 && <JobsGrid projectId={id} size={{ xs: 12 }} />*/}
                        {tabValue == 2 && project && (
                          <CCP4i2DirectoryViewer projectId={project.id} />
                        )}
                      </Paper>
                    </Panel>
                    <PanelResizeHandle
                      style={{
                        width: 10,
                        backgroundColor: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "col-resize",
                      }}
                    >
                      <div
                        style={{
                          width: 4,
                          height: "50%",
                          backgroundColor: "gray",
                          borderRadius: 2,
                        }}
                      />
                    </PanelResizeHandle>
                    <Panel
                      defaultSize={70}
                      minSize={20}
                      onResize={(size) =>
                        setJobPanelSize && setJobPanelSize(size)
                      }
                    >
                      {props.children}
                    </Panel>
                  </PanelGroup>
                </FileMenuContextProvider>
              </JobMenuContextProvider>
            </FilePreviewContextProvider>
          </CootProvider>
        </Stack>
      </NavigationShortcutsProvider>{" "}
    </DraggableContext>
  );
}
