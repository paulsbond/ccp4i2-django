import { useCallback, useContext, useMemo } from "react";
import { CCP4i2Context } from "../../app-context";
import { useApi } from "../../api";
import { Job } from "../../models";
import { LinearProgress, Paper, Toolbar, Typography } from "@mui/material";
import ProsmartRefmacInterface from "./task-interfaces/prosmart_refmac";
import { valueOfItemPath as valueOfItemPathFunction } from "./task-utils";
export interface CCP4i2TaskInterfaceProps {
  job: Job;
  paramsXML: any;
  defXML: any;
  mutate: () => void;
  valueOfItemPath?: (itemName: string) => any | null;
}
export const TaskContainer = () => {
  const api = useApi();

  const { jobId } = useContext(CCP4i2Context);
  if (!jobId) return <LinearProgress />;

  const { data: job } = api.get<Job>(`jobs/${jobId}`);
  if (!job) return <LinearProgress />;

  const { data: params_xml, mutate } = api.get<{
    status: string;
    params_xml: string;
  }>(`jobs/${jobId}/params_xml`);
  if (!params_xml?.params_xml) return <LinearProgress />;

  const paramsXML = $($.parseXML(params_xml.params_xml));

  const valueOfItemPath: any | null = useCallback(
    (itemPath: string) => {
      if (paramsXML) {
        return valueOfItemPathFunction(
          itemPath,
          $.parseXML(params_xml.params_xml)
        );
      }
      return null;
    },
    [paramsXML]
  );

  const { data: def_xml } = api.get<{
    status: string;
    def_xml: string;
  }>(`jobs/${jobId}/def_xml`);
  if (!def_xml?.def_xml) return <LinearProgress />;

  const defXML = $($.parseXML(def_xml.def_xml));

  const taskInterface = useMemo(() => {
    switch (job.task_name) {
      case "prosmart_refmac":
        return (
          <ProsmartRefmacInterface
            {...{ paramsXML, defXML, mutate, job, valueOfItemPath }}
          />
        );
      default:
        return (
          <ProsmartRefmacInterface
            {...{ paramsXML, defXML, mutate, job, valueOfItemPath }}
          />
        );
    }
  }, [job]);

  return (
    <Paper>
      <Toolbar>
        <Typography variant="h5">{job.task_name}</Typography>
      </Toolbar>
      {taskInterface}
    </Paper>
  );
};
