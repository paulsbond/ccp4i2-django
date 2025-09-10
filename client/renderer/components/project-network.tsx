"use client";
import React, { useMemo } from "react";
//@ts-ignore
import CytoscapeComponent from "react-cytoscapejs";
import { useApi } from "../api";
import {
  File as FileInfo,
  FileUse as FileUseInfo,
  Job as JobInfo,
} from "../types/models";

export interface ProjectNetworkProps {
  projectId: number;
}
export const ProjectNetwork = ({ projectId }: ProjectNetworkProps) => {
  const api = useApi();
  const { data: fileUses } = api.get<FileUseInfo[]>(
    `projects/${projectId}/file_uses/`
  );
  const { data: files } = api.get<FileInfo[]>(`projects/${projectId}/files/`);
  const { data: jobs } = api.get<JobInfo[]>(`projects/${projectId}/jobs/`);
  const topLevelJobs = useMemo(
    () => (jobs ? jobs.filter((job) => job.parent === null) : []),
    [jobs]
  );
  const topLevelFiles = useMemo(() => {
    const topLevelJobIds = topLevelJobs.map((job) => job.id);
    return files
      ? files.filter((file) => topLevelJobIds.includes(file.job))
      : [];
  }, [files, topLevelJobs]);
  const topLevelFileUses = useMemo(() => {
    const topLevelFileIds = topLevelFiles.map((file) => file.id);
    const topLevelJobIds = topLevelJobs.map((job) => job.id);
    return fileUses
      ? fileUses.filter(
          (fileUse) =>
            topLevelFileIds.includes(fileUse.file) &&
            topLevelJobIds.includes(fileUse.job)
        )
      : [];
  }, [fileUses, topLevelFiles, topLevelJobs]);

  const networkElements = useMemo(() => {
    if (!topLevelFileUses || !topLevelFiles || !topLevelJobs) return [];
    const fileNodes = topLevelFiles.map((file) => ({
      data: { id: `file-${file.id}`, label: file.annotation, type: "file" },
    }));
    const jobNodes = topLevelJobs.map((job) => ({
      data: { id: `job-${job.id}`, label: job.number, type: "job" },
    }));
    const fileUseEdges = topLevelFileUses.map((fileUse) => ({
      data: {
        id: `file-use-${fileUse.id}`,
        source: `file-${fileUse.file}`,
        target: `job-${fileUse.job}`,
      },
    }));
    const fileFromEdges = topLevelFiles.map((file) => ({
      data: {
        id: `file-${file.id}-from-job-${file.job}`,
        source: `file-${file.id}`,
        target: `job-${file.job}`,
      },
    }));
    return [...fileNodes, ...jobNodes, ...fileUseEdges, ...fileFromEdges];
  }, [topLevelFileUses, topLevelFiles, topLevelJobs]);

  return (
    <CytoscapeComponent
      elements={networkElements}
      style={{ width: "1200px", height: "1200px" }}
      layout={{ name: "cose", animate: false }} // Automatic, minimally overlapped layout
    />
  );
};
