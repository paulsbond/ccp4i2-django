"use client";
import { PropsWithChildren, useEffect, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { CssBaseline } from "@mui/material";
import MenuBar from "./menu-bar";
import { File, Job } from "../models";
import { RunningProcessesProvider } from "./running-processes";
import { PopcornProvider } from "./popcorn-provider";

export const CCP4i2App = (props: PropsWithChildren) => {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [cootModule, setCootModule] = useState<any | null>(null);
  const [jobPanelSize, setJobPanelSize] = useState<number>(70);
  const [devMode, setDevMode] = useState<boolean>(true);
  const [activeDragItem, setActiveDragItem] = useState<Job | File | null>(null);

  return (
    <PopcornProvider>
      <CCP4i2Context.Provider
        value={{
          projectId,
          setProjectId,
          jobId,
          setJobId,
          cootModule,
          setCootModule,
          jobPanelSize,
          setJobPanelSize,
          devMode,
          setDevMode,
          activeDragItem,
          setActiveDragItem,
        }}
      >
        <CssBaseline />
        <RunningProcessesProvider>
          <MenuBar />
          {props.children}
        </RunningProcessesProvider>
      </CCP4i2Context.Provider>
    </PopcornProvider>
  );
};
