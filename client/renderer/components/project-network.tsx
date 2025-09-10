"use client";
import React, { useMemo } from "react";
//@ts-ignore
import CytoscapeComponent from "react-cytoscapejs";
import Cytoscape from "cytoscape";
import COSEBilkent from "cytoscape-cose-bilkent";
import { useApi } from "../api";
import {
  File as FileInfo,
  FileUse as FileUseInfo,
  Job as JobInfo,
} from "../types/models";
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";

export interface ProjectNetworkProps {
  projectId: number;
}

Cytoscape.use(COSEBilkent);

export const ProjectNetwork = ({ projectId }: ProjectNetworkProps) => {
  const api = useApi();

  const [selectedNetwork, setSelectedNetwork] =
    React.useState<string>("fileToFile");
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
    // Calculate job-to-job edges
    const jobToJobEdges = topLevelFileUses
      .map((fileUse) => {
        const file = topLevelFiles.find((f) => f.id === fileUse.file);
        if (!file) return null;
        // Only create edge if file.job !== fileUse.job
        if (file.job !== fileUse.job) {
          return {
            data: {
              id: `job-to-job-${fileUse.id}`,
              source: `job-${file.job}`,
              target: `job-${fileUse.job}`,
              type: "job-to-job",
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    // Calculate file-to-file edges
    const fileToFileEdges = topLevelFileUses
      .filter((fileUse) => fileUse.role === 1)
      .map((fileUse) => {
        const sourceFile = topLevelFiles.find((f) => f.job === fileUse.job);
        const targetFile = topLevelFiles.find((f) => f.id === fileUse.file);
        // Only create edge if both files exist and are different
        if (sourceFile && targetFile && sourceFile.id !== targetFile.id) {
          return {
            data: {
              id: `file-to-file-${sourceFile.id}-to-${targetFile.id}`,
              source: `file-${sourceFile.id}`,
              target: `file-${targetFile.id}`,
              type: "file-to-file",
            },
          };
        }
        return null;
      })
      .filter(Boolean);
    return selectedNetwork === "fileToFile"
      ? [...fileNodes, ...fileToFileEdges]
      : selectedNetwork === "jobToJob"
      ? [...jobNodes, ...jobToJobEdges]
      : [...fileNodes, ...jobNodes, ...fileUseEdges, ...fileFromEdges];
  }, [topLevelFileUses, topLevelFiles, topLevelJobs, selectedNetwork]);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <RadioGroup
          row
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
        >
          <FormControlLabel
            value="fileToFile"
            control={<Radio />}
            label="File-to-File"
          />
          <FormControlLabel
            value="jobToJob"
            control={<Radio />}
            label="Job-to-Job"
          />
          <FormControlLabel
            value="full"
            control={<Radio />}
            label="Full Network"
          />
        </RadioGroup>
      </div>
      {networkElements.length > 0 ? (
        <CytoscapeComponent
          elements={networkElements}
          style={{ width: "1200px", height: "1200px" }}
          layout={{ name: "cose-bilkent", animate: false }}
          cy={(cy) => {
            cy.layout({ name: "cose-bilkent", animate: false }).run();
          }}
        />
      ) : (
        <p>No data to display</p>
      )}
    </>
  );
};
