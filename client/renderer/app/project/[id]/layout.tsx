"use client";
import {
  PropsWithChildren,
  use,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Avatar, Paper, Stack, Tab, Tabs } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CCP4i2Context } from "../../app-context";
import { useApi } from "../../api";
import Script from "next/script";
import { CCP4i2DirectoryViewer } from "../../components/directory_viewer";
import { useProject } from "../../utils";
import { ClassicJobList } from "../../components/classic-jobs-list";
import { DndContext, DragOverlay } from "@dnd-kit/core";

const createArgs = {
  print(t: string) {
    console.log(["output", t]);
  },
  printErr(t: string) {
    console.error(["output", t]);
  },
  locateFile(path: string, prefix: string) {
    // if it's moorhen.wasm, use a custom dir
    if (path.endsWith("moorhen.wasm")) return "/moorhen.wasm";
    if (path.endsWith("mtz.wasm")) return prefix + path;
    // otherwise, use the default, the prefix (JS file's dir) + the path
    return prefix + path;
  },
};

export interface ProjectLayoutProps extends PropsWithChildren {
  params: Promise<{ id: string }>;
}

export default function ProjectLayout(props: ProjectLayoutProps) {
  const { setProjectId, setCootModule, setJobPanelSize } =
    useContext(CCP4i2Context);
  const api = useApi();
  const [tabValue, setTabValue] = useState(0);
  const [activeDragItem, setActiveDragItem] = useState<string | number | null>(
    null
  );
  const { id } = use(props.params);
  const { project } = useProject(parseInt(id));
  const scriptElement = useRef<HTMLElement | null | undefined>(null);

  useEffect(() => {
    return () => {
      if (scriptElement.current) {
        scriptElement.current.parentElement?.removeChild(scriptElement.current);
      }
    };
  }, []);

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

  const handleDragEnd = (event: any) => {
    setActiveDragItem(null);
    console.log("Drag end", event);
  };

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={({ active }) => setActiveDragItem(active.id)}
    >
      <Stack
        spacing={2}
        sx={{ height: "calc(100vh - 4rem)", paddingTop: "1rem" }}
      >
        {true && (
          <Script
            src="/moorhen.js"
            strategy="lazyOnload"
            id="moorhen-script-element"
            onLoad={async (arg) => {
              const cootModule =
                //@ts-ignore
                createCootModule(createArgs).then((module: any) => {
                  //@ts-ignore
                  setCootModule(module);
                  scriptElement.current = Array.from(
                    document.getElementsByTagName("script")
                  ).find((htmlElement: HTMLElement) => {
                    return htmlElement.getAttribute("src") === "/moorhen.js";
                  });
                  console.log({ cm: module, scriptElement });
                });
            }}
          />
        )}
        <PanelGroup direction="horizontal">
          <Panel defaultSize={30} minSize={20}>
            <Paper sx={{ overflowY: "auto", height: "calc(100vh - 8rem)" }}>
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
          <PanelResizeHandle style={{ width: 5, backgroundColor: "black" }} />
          <Panel
            defaultSize={70}
            minSize={20}
            onResize={(size) => setJobPanelSize && setJobPanelSize(size)}
          >
            {props.children}
          </Panel>
        </PanelGroup>
      </Stack>
      <DragOverlay>
        {activeDragItem ? (
          <Avatar
            src="/api/proxy/djangostatic/qticons/ccp4i2.png"
            sx={{
              width: 64,
              height: 64,
              boxShadow: 3,
              opacity: 0.8,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
