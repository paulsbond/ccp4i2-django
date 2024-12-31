import { useState } from "react";
import { useApi } from "../api";
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Toolbar,
  Typography,
} from "@mui/material";
import { File, Job, JobCharValue, JobFloatValue } from "../models";
import { KeyedMutator } from "swr";
import EditableTypography from "./editable-typography";

interface JobsGridProps {
  projectId: number;
}
export const JobsGrid: React.FC<JobsGridProps> = (props) => {
  const api = useApi();
  const { data: jobs, mutate: mutateJobs } = api.get<Job[]>(
    `/projects/${props.projectId}/jobs/`
  );
  const { data: files } = api.get<File[]>(
    `/projects/${props.projectId}/files/`
  );
  const { data: jobFloatValues } = api.get<JobFloatValue[]>(
    `/projects/${props.projectId}/job_float_values/`
  );
  const { data: jobCharValues } = api.get<JobCharValue[]>(
    `/projects/${props.projectId}/job_char_values/`
  );
  return (
    jobs &&
    jobFloatValues &&
    jobCharValues &&
    files &&
    jobs
      .filter((item) => item.parent === null)
      .map((job: Job) => (
        <JobCard
          key={job.number}
          job={job}
          jobFloatValues={jobFloatValues.filter((item) => item.job === job.id)}
          jobCharValues={jobCharValues.filter((item) => item.job === job.id)}
          files={files.filter((item) => item.job === job.id)}
          mutateJobs={mutateJobs}
        />
      ))
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
  const [showEditTitle, setShowEditTitle] = useState(false);
  const [jobTitle, setJobTitle] = useState(job.title ? job.title : null);
  return (
    <>
      <Card key={job.number}>
        <CardHeader
          title={
            <Toolbar>
              <Typography variant="h4">{job.number}</Typography>
              <EditableTypography
                variant="h4"
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
