import { useEffect, useMemo, useState } from "react";
import { Job, Project } from "../models";
import { FileTree } from "./contexts/file-browser";
import { useProject } from "../utils";

interface JobDirectoryViewProps {
  job: Job;
  project: Project;
}
export const JobDirectoryView = ({ job, project }) => {
  const { directory } = useProject(project.id);

  const directoryData = useMemo(() => {
    if (!directory || !job || !directory.container) {
      return null;
    }
    let dirNode = directory.container.find(
      (item: any) => item.name === "CCP4_JOBS"
    );
    const jobNumberElements = job.number.split(".").reverse();
    while (jobNumberElements.length > 0) {
      const jobNumber = jobNumberElements.pop();
      dirNode = dirNode.contents.find(
        (item: any) => item.name === `job_${jobNumber}`
      );
      if (!dirNode) {
        return null;
      }
      if (jobNumberElements.length === 0) {
        return dirNode.contents;
      }
    }
  }, [job, project, directory]);

  return directoryData && <FileTree data={directoryData} />;
};
