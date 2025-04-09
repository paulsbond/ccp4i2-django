import { createContext } from "react";

interface CCP4i2Context {
  projectId?: number | null;
  setProjectId?: (projectId: number) => void | null;
  jobId?: number | null;
  setJobId?: (jobId: number) => void | null;
  jobPanelSize?: number;
  setJobPanelSize?: (size: number) => void;
  cootModule?: any | null;
  setCootModule?: (module: any | null) => void;
}
export const CCP4i2Context = createContext<CCP4i2Context>({
  projectId: null,
  setProjectId: () => {},
  jobId: null,
  setJobId: () => {},
  jobPanelSize: 7,
  setJobPanelSize: () => {},
  cootModule: null,
  setCootModule: () => {},
});
