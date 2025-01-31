"use client";
import { PropsWithChildren, useEffect, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { CssBaseline } from "@mui/material";
import MenuBar from "./menu-bar";

export const CCP4i2App = (props: PropsWithChildren) => {
  const [projectId, setProjectId] = useState<Number | null>(null);
  const [jobId, setJobId] = useState<Number | null>(null);
  const [cootModule, setCootModule] = useState<any | null>(null);

  return (
    <CCP4i2Context.Provider
      value={{
        projectId,
        setProjectId,
        jobId,
        setJobId,
        cootModule,
        setCootModule,
      }}
    >
      <CssBaseline />
      <MenuBar />
      {props.children}
    </CCP4i2Context.Provider>
  );
};
