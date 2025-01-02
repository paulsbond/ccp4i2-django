import { useState } from "react";
import { useApi } from "../api";
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
<<<<<<< HEAD
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  Input,
  Paper,
  styled,
=======
>>>>>>> 11fca17258cc8a4ff11a8375e8f19d77c7d07e88
  Toolbar,
  Typography,
} from "@mui/material";
import { File, Job, JobCharValue, JobFloatValue } from "../models";
import { KeyedMutator } from "swr";
import EditableTypography from "./editable-typography";

interface JobsGridProps {
  projectId: number;
  size: number;
}
export const JobsGrid: React.FC<JobsGridProps> = ({ projectId, size = 4 }) => {
  const api = useApi();
  const { data: jobs, mutate: mutateJobs } = api.get<Job[]>(
    `/projects/${projectId}/jobs/`
  );
  const { data: files } = api.get<File[]>(`/projects/${projectId}/files/`);
  const { data: jobFloatValues } = api.get<JobFloatValue[]>(
    `/projects/${projectId}/job_float_values/`
  );
  const { data: jobCharValues } = api.get<JobCharValue[]>(
    `/projects/${projectId}/job_char_values/`
  );
  return (
    <Grid2 container>
      {jobs &&
        jobFloatValues &&
        jobCharValues &&
        files &&
        jobs
          .filter((item) => item.parent === null)
          .map((job: Job) => (
            <Grid2 key={job.number} size={{ xs: size }}>
              <JobCard
                key={job.number}
                job={job}
                jobFloatValues={jobFloatValues.filter(
                  (item) => item.job === job.id
                )}
                jobCharValues={jobCharValues.filter(
                  (item) => item.job === job.id
                )}
                files={files.filter((item) => item.job === job.id)}
                mutateJobs={mutateJobs}
              />
            </Grid2>
          ))}
    </Grid2>
  );
};

interface JobCardProps {
  job: Job;
  files: File[];
  jobFloatValues: JobFloatValue[];
  jobCharValues: JobCharValue[];
  mutateJobs: KeyedMutator<Job[]>;
}
export const JobCard: React.FC<JobCardProps> = ({
  job,
  jobFloatValues,
  jobCharValues,
  mutateJobs,
}) => {
  const api = useApi();
  return (
    <>
      <Card key={job.number}>
        <CardHeader
          title={
            <Toolbar>
              <Typography variant="h6" sx={{ mr: 1 }}>
                {job.number}
              </Typography>
              <EditableTypography
                variant="h6"
                text={job.title}
                onDelay={async (name) => {
                  const formData = new FormData();
                  formData.set("title", name);
                  await api.patch(`jobs/${job.id}`, formData);
                  mutateJobs();
                }}
              />
            </Toolbar>
          }
          subheader={job.task_name}
        />
        <CardContent>
          {jobCharValues.map((item) => (
            <Chip
              key={item.key}
              avatar={<div style={{ width: "5rem" }}>{item.key}</div>}
              label={item.value}
            />
          ))}
          {jobFloatValues.map((item) => (
            <Chip
              key={item.key}
              avatar={<div style={{ width: "5rem" }}>{item.key}</div>}
              label={item.value}
            />
          ))}
        </CardContent>
      </Card>
    </>
  );
};
