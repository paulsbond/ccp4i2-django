import { createContext } from "react";
import { Job, Project } from "./models";

interface CCP4i2Context {
  projectId?: number | null;
  setProjectId?: (projectId: number) => void | null;
  jobId?: number | null;
  setJobId?: (jobId: number) => void | null;
  cootModule?: any | null;
  setCootModule?: (module: any | null) => void;
}
export const CCP4i2Context = createContext<CCP4i2Context>({
  projectId: null,
  jobId: null,
});
