import {
  File as FileInfo,
  Job as JobInfo,
  Project as ProjectInfo,
} from "../../types/models";
import { moorhen } from "moorhen/types/moorhen";

export interface ItemMetadata {
  fileId: number;
  projectName?: string;
  jobNumber?: string;
  fileAnnotation?: string;
  isLoading: boolean;
  error?: string;
}

export function extractFileId(uniqueId: string): number | null {
  const match = uniqueId.match(/\/api\/proxy\/files\/(\d+)\/download\//);
  return match ? parseInt(match[1], 10) : null;
}

export async function fetchItemMetadata(
  item: moorhen.Molecule | moorhen.Map
): Promise<ItemMetadata | null> {
  const fileId = extractFileId(item.uniqueId || "");
  if (!fileId) return null;

  try {
    // Step 1: Fetch file information
    const fileResponse = await fetch(`/api/proxy/files/${fileId}/`);
    if (!fileResponse.ok) throw new Error("Failed to fetch file info");
    const fileInfo: FileInfo = await fileResponse.json();

    // Step 2: Fetch job information
    const jobResponse = await fetch(`/api/proxy/jobs/${fileInfo.job}/`);
    if (!jobResponse.ok) throw new Error("Failed to fetch job info");
    const jobInfo: JobInfo = await jobResponse.json();

    // Step 3: Fetch project information
    const projectResponse = await fetch(
      `/api/proxy/projects/${jobInfo.project}/`
    );
    if (!projectResponse.ok) throw new Error("Failed to fetch project info");
    const projectInfo: ProjectInfo = await projectResponse.json();

    return {
      fileId,
      projectName: projectInfo.name,
      jobNumber: jobInfo.number,
      fileAnnotation: fileInfo.annotation || fileInfo.job_param_name,
      isLoading: false,
    };
  } catch (error) {
    return {
      fileId,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
