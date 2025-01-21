import { useApi } from "../api";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Grid2,
  List,
  ListItem,
  Menu,
  MenuItem,
  Paper,
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
import {
  CopyAll,
  Delete,
  Menu as MenuIcon,
  RunCircle,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { JobHeader } from "./job-header";
import { useDeleteDialog } from "./delete-dialog";

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
  const router = useRouter();
  const deleteDialog = useDeleteDialog();
  const projectId = useMemo(() => {
    return job.project;
  }, [job]);
  const { data: dependentJobs, mutate: mutateDependentJobs } = api.get<Job[]>(
    `/jobs/${job.id}/dependent_jobs/`
  );
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
  const kpiContent = useMemo(() => {
    return (
      <>
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
              sx={{ backgroundColor: "#DFD" }}
              avatar={<div style={{ width: "5rem" }}>{item.key}</div>}
              label={item.value}
            />
          ))}
      </>
    );
  }, [jobCharValues, jobFloatValues]);

  const [jobsExpanded, setJobsExpanded] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleClone = async () => {
    const cloneResult: Job = await api.post(`jobs/${job.id}/clone/`);
    console.log(cloneResult);
    if (cloneResult?.id) {
      mutateJobs();
      setAnchorEl(null);
      router.push(`/project/${projectId}/job/${cloneResult.id}`);
    }
  };
  const handleRun = async () => {
    const runResult: Job = await api.post(`jobs/${job.id}/run/`);
    console.log(runResult);
    if (runResult?.id) {
      mutateJobs();
      setAnchorEl(null);
      router.push(`/project/${projectId}/job/${runResult.id}`);
    }
  };

  function handleDelete() {
    if (deleteDialog)
      deleteDialog({
        type: "show",
        what: `${job.number}: ${job.title}`,
        onDelete: () => {
          api.delete(`jobs/${job.id}`).then(() => {
            mutateJobs();
          });
        },
        children: [
          <Paper>
            <List>
              {dependentJobs &&
                dependentJobs.map((dependentJob: Job) => {
                  return (
                    <ListItem key={dependentJob.uuid}>
                      {dependentJob.uuid}
                    </ListItem>
                  );
                })}
            </List>
          </Paper>,
        ],
      });
  }

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={`context-menu-${job.id}`}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem key="Clone" onClick={handleClone}>
        <CopyAll /> Clone
      </MenuItem>
      <MenuItem key="Run" onClick={handleRun}>
        <RunCircle /> Run
      </MenuItem>
      <MenuItem key="Delete" onClick={handleDelete}>
        <Delete /> Delete
      </MenuItem>
    </Menu>
  );

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
      <MyCard
        key={job.number}
        variant="elevation"
        onClick={() => {
          router.push(`/project/${job.project}/job/${job.id}`);
        }}
      >
        <CardHeader
          action={
            <Button onClick={handleMenuOpen}>
              <MenuIcon />
            </Button>
          }
          sx={{ my: 0, mx: 0, px: 0, py: 0 }}
          title={<JobHeader job={job} mutateJobs={mutateJobs} />}
          subheader={kpiContent}
        />
        <CardActions sx={{ p: 0.5 }}>
          <Grid2 container>
            {subJobs && subJobs.length > 0 && (
              <Grid2 sx={{ xs: 6 }}>
                Child jobs
                <MyExpandMore
                  expand={jobsExpanded}
                  onClick={handleExpandJobsClick}
                  aria-expanded={jobsExpanded}
                  aria-label="Show child jobs"
                >
                  <ExpandMoreIcon />
                </MyExpandMore>
              </Grid2>
            )}
            {jobFiles && jobFiles.length > 0 && (
              <Grid2 sx={{ xs: 6 }}>
                Files
                <MyExpandMore
                  expand={filesExpanded}
                  onClick={handleExpandFilesClick}
                  aria-expanded={filesExpanded}
                  aria-label="Show files"
                >
                  <ExpandMoreIcon />
                </MyExpandMore>
              </Grid2>
            )}
          </Grid2>
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
      {renderMenu}
    </>
  );
};
