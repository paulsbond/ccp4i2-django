import { useApi } from "../api";
import { Grid2 } from "@mui/material";
import { Job } from "../models";
import { JobCard } from "./job-card";

interface JobsGridProps {
  projectId: number;
  size: number;
  parent?: number;
  withSubtitles?: boolean;
}
export const JobsGrid: React.FC<JobsGridProps> = ({
  projectId,
  size = 4,
  parent = null,
  withSubtitles = false,
}) => {
  const api = useApi();
  const { data: jobs } = api.get<Job[]>(`/projects/${projectId}/jobs/`);
  return (
    <Grid2 container>
      {jobs &&
        jobs
          .filter((item) => item.parent === parent)
          .map((job: Job) => (
            <Grid2 key={job.number} size={{ xs: size }}>
              <JobCard key={job.id} job={job} withSubtitle={withSubtitles} />
            </Grid2>
          ))}
    </Grid2>
  );
};
