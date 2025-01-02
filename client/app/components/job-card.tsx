import { useApi } from "../api";
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";
import { File, Job, JobCharValue, JobFloatValue } from "../models";
import EditableTypography from "./editable-typography";
import { useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { MyExpandMore } from "./expand-more";
import { JobsGrid } from "./jobs-grid";
import FilesTable from "./files-table";

const MyCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: 20,
}));

interface JobCardProps {
  job: Job;
  withSubtitle?: boolean;
}
export const JobCard: React.FC<JobCardProps> = ({
  job,
  withSubtitle = false,
}) => {
  const api = useApi();
  const projectId = useMemo(() => {
    return job.project;
  }, [job]);
  const { data: jobs, mutate: mutateJobs } = api.get<Job[]>(
    `/projects/${projectId}/jobs/`
  );
  const { data: files, mutate: mutateFiles } = api.get<File[]>(
    `/projects/${projectId}/files/`
  );
  const { data: jobFloatValues } = api.get<JobFloatValue[]>(
    `/projects/${projectId}/job_float_values/`
  );
  const { data: jobCharValues } = api.get<JobCharValue[]>(
    `/projects/${projectId}/job_char_values/`
  );
  const subJobs: any[] | undefined = useMemo(() => {
    return jobs?.filter((aJob) => aJob.parent === job.id);
  }, [jobs, job]);

  const jobFiles: any[] | undefined = useMemo(() => {
    return files?.filter((aFile) => aFile.job === job.id);
  }, [files, job]);

  const [jobsExpanded, setJobsExpanded] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);

  const handleExpandJobsClick = (ev: any) => {
    ev.stopPropagation();
    setJobsExpanded(!jobsExpanded);
  };
  const handleExpandFilesClick = (ev: any) => {
    ev.stopPropagation();
    setFilesExpanded(!filesExpanded);
  };
  return (
    <>
      <MyCard key={job.number} variant="elevation">
        <CardHeader
          title={
            <Toolbar>
              <Avatar src={`/svgicons/${job.task_name}.svg`} />
              <Typography variant="subtitle1" sx={{ mr: 2 }}>
                {job.number}
              </Typography>
              <EditableTypography
                variant="subtitle1"
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
          subheader={withSubtitle ? job.task_name : null}
        />
        <CardContent>
          {jobCharValues
            ?.filter((item: JobCharValue) => item.job === job.id)
            .map((item: JobCharValue) => (
              <Chip
                key={item.key}
                avatar={<div style={{ width: "5rem" }}>{item.key}</div>}
                label={item.value}
              />
            ))}
          {jobFloatValues
            ?.filter((item: JobFloatValue) => item.job === job.id)
            .map((item) => (
              <Chip
                key={item.key}
                avatar={<div style={{ width: "5rem" }}>{item.key}</div>}
                label={item.value}
              />
            ))}
        </CardContent>
        <CardActions sx={{ p: 0.5 }}>
          {subJobs && subJobs.length > 0 && (
            <>
              Child jobs
              <MyExpandMore
                expand={jobsExpanded}
                onClick={handleExpandJobsClick}
                aria-expanded={jobsExpanded}
                aria-label="Show child jobs"
              >
                <ExpandMoreIcon />
              </MyExpandMore>
            </>
          )}
          {jobFiles && jobFiles.length > 0 && (
            <>
              Files
              <MyExpandMore
                expand={filesExpanded}
                onClick={handleExpandFilesClick}
                aria-expanded={filesExpanded}
                aria-label="Show files"
              >
                <ExpandMoreIcon />
              </MyExpandMore>
            </>
          )}
        </CardActions>
        <Collapse
          key="ChildJobs"
          in={jobsExpanded}
          timeout="auto"
          unmountOnExit
        >
          <CardContent sx={{ p: 0.5 }}>
            {subJobs?.length && subJobs.length > 0 && (
              <JobsGrid
                projectId={projectId}
                size={12}
                parent={job.id}
                withSubtitles={false}
              />
            )}
          </CardContent>
        </Collapse>
        <Collapse
          key="JobFiles"
          in={filesExpanded}
          timeout="auto"
          unmountOnExit
        >
          <CardContent sx={{ p: 0.5 }}>
            {jobFiles && jobFiles.length > 0 && (
              <FilesTable files={jobFiles} mutate={mutateFiles} />
            )}
          </CardContent>
        </Collapse>
      </MyCard>
    </>
  );
};
