"use client";
import { PropsWithChildren, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { CssBaseline } from "@mui/material";
import MenuBar from "./menu-bar";
import { Job, Project } from "../models";

export const CCP4i2App = (props: PropsWithChildren) => {
  const [projectId, setProjectId] = useState<Number | null>(null);
  const [jobId, setJobId] = useState<Number | null>(null);

  return (
    <CCP4i2Context.Provider
      value={{ projectId, setProjectId, jobId, setJobId }}
    >
      <CssBaseline />
      <MenuBar />
      {props.children}
    </CCP4i2Context.Provider>
  );
};
