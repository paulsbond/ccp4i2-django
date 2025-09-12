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

  // Helper function to find if there's a path between two jobs through intermediate jobs
  const hasIndirectPath = (
    sourceJobId: number,
    targetJobId: number,
    jobToJobMap: Map<number, Set<number>>
  ): boolean => {
    const visited = new Set<number>();
    const queue = [sourceJobId];
    visited.add(sourceJobId);

    while (queue.length > 0) {
      const currentJobId = queue.shift()!;
      const directTargets = jobToJobMap.get(currentJobId) || new Set();

      for (const nextJobId of directTargets) {
        if (nextJobId === targetJobId) {
          return true; // Found indirect path
        }
        if (!visited.has(nextJobId)) {
          visited.add(nextJobId);
          queue.push(nextJobId);
        }
      }
    }
    return false;
  };

  const networkElements = useMemo(() => {
    if (!topLevelFileUses || !topLevelFiles || !topLevelJobs) return [];

    const fileNodes = topLevelFiles.map((file) => {
      const job = topLevelJobs.find((j) => j.id === file.job);
      return {
        data: {
          id: `file-${file.id}`,
          label: `${job?.number}: ${file.annotation || file.job_param_name}`,
          type: "file",
        },
      };
    });

    const jobNodes = topLevelJobs.map((job) => ({
      data: {
        id: `job-${job.id}`,
        label: `${job.number}: ${job.title || job.task_name}`,
        type: "job",
      },
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
            sourceJobId: file.job,
            targetJobId: fileUse.job,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Calculate pruned job-to-job edges
    const prunedJobToJobEdges = (() => {
      // Group edges by source-target pair to handle multiple file relationships
      const edgeGroups = new Map<string, (typeof jobToJobEdges)[0][]>();

      jobToJobEdges.forEach((edge) => {
        if (!edge) return;
        const key = `${edge.sourceJobId}-${edge.targetJobId}`;
        if (!edgeGroups.has(key)) {
          edgeGroups.set(key, []);
        }
        edgeGroups.get(key)!.push(edge);
      });

      // Create a map of unique job-to-job connections (one per source-target pair)
      const uniqueConnections = new Map<number, Set<number>>();
      Array.from(edgeGroups.keys()).forEach((key) => {
        const [sourceStr, targetStr] = key.split("-");
        const sourceId = parseInt(sourceStr);
        const targetId = parseInt(targetStr);

        if (!uniqueConnections.has(sourceId)) {
          uniqueConnections.set(sourceId, new Set());
        }
        uniqueConnections.get(sourceId)!.add(targetId);
      });

      // Filter out edge groups that have indirect paths through other jobs
      const keptEdgeGroups = Array.from(edgeGroups.entries()).filter(
        ([key, edges]) => {
          const [sourceStr, targetStr] = key.split("-");
          const sourceId = parseInt(sourceStr);
          const targetId = parseInt(targetStr);

          // Create a temporary map without this direct connection
          const tempMap = new Map<number, Set<number>>();
          uniqueConnections.forEach((targets, source) => {
            const filteredTargets = new Set<number>();
            targets.forEach((target) => {
              // Exclude the current direct connection
              if (!(source === sourceId && target === targetId)) {
                filteredTargets.add(target);
              }
            });
            if (filteredTargets.size > 0) {
              tempMap.set(source, filteredTargets);
            }
          });

          // Check if there's an indirect path without this direct connection
          return !hasIndirectPath(sourceId, targetId, tempMap);
        }
      );

      // Return all edges from the kept groups (preserving multiple file relationships)
      return keptEdgeGroups.flatMap(([key, edges]) => edges);
    })();

    // Calculate file-to-file edges
    const fileToFileEdges = topLevelFileUses
      .filter((fileUse) => fileUse.role === 1)
      .map((fileUse) => {
        const job = topLevelJobs.find((j) => j.id === fileUse.job);
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
              label: job?.task_name,
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    switch (selectedNetwork) {
      case "fileToFile":
        return [...fileNodes, ...fileToFileEdges];
      case "jobToJob":
        return [...jobNodes, ...jobToJobEdges];
      case "prunedJobToJob":
        return [...jobNodes, ...prunedJobToJobEdges];
      case "full":
      default:
        return [...fileNodes, ...jobNodes, ...fileUseEdges, ...fileFromEdges];
    }
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
            value="prunedJobToJob"
            control={<Radio />}
            label="Pruned Job-to-Job"
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
