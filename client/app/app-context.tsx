import { createContext } from "react";
import { Job, Project } from "./models";

interface CCP4i2Context {
  projectId?: Number | null;
  setProjectId?: (projectId: Number) => void | null;
  jobId?: Number | null;
  setJobId?: (jobId: Number) => void | null;
  cootModule?: any | null;
  setCootModule?: (module: any | null) => void;
}
export const CCP4i2Context = createContext<CCP4i2Context>({
  projectId: null,
  jobId: null,
});
