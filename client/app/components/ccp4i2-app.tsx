"use client";
import { PropsWithChildren, useEffect, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { CssBaseline } from "@mui/material";
import MenuBar from "./menu-bar";

export const CCP4i2App = (props: PropsWithChildren) => {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [cootModule, setCootModule] = useState<any | null>(null);
  const [jobPanelSize, setJobPanelSize] = useState<number>(70);

  return (
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
      }}
    >
      <CssBaseline />
      <MenuBar />
      {props.children}
    </CCP4i2Context.Provider>
  );
};
