import {
  PropsWithChildren,
  SyntheticEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Job, File as DjangoFile } from "../types/models";
import { doDownload, useApi } from "../api";
import { useRouter } from "next/navigation";
import { useDeleteDialog } from "./delete-dialog";
import { List, ListItem, Menu, MenuItem, Paper, Toolbar } from "@mui/material";
import { CCP4i2JobAvatar } from "../components/job-avatar";
import {
  CopyAll,
  Delete,
  FireExtinguisherRounded,
  Pending,
  RunCircle,
  SmsFailed,
  TerminalOutlined,
} from "@mui/icons-material";
import { createContext } from "react";
import { usePopcorn } from "./popcorn-provider";

interface JobMenuContextDataProps {
  jobMenuAnchorEl: HTMLElement | null;
  setJobMenuAnchorEl: (element: HTMLElement | null) => void;
  job: Job | null;
  setJob: (job: Job | null) => void;
}

export const JobMenuContext = createContext<JobMenuContextDataProps>({
  jobMenuAnchorEl: null,
  setJobMenuAnchorEl: () => {},
  job: null,
  setJob: () => {},
});

export const JobMenuContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [jobMenuAnchorEl, setJobMenuAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [job, setJob] = useState<Job | null>(null);

  return (
    <>
      <JobMenuContext.Provider
        value={{
          jobMenuAnchorEl,
          setJobMenuAnchorEl,
          job,
          setJob,
        }}
      >
        {children}
        <JobMenu />
      </JobMenuContext.Provider>
    </>
  );
};

export interface JobWithChildren extends Job {
  children: (Job | DjangoFile)[];
}

export const JobMenu: React.FC = () => {
  const { jobMenuAnchorEl, setJobMenuAnchorEl, job, setJob } =
    useContext(JobMenuContext);
  const api = useApi();
  const router = useRouter();
  const { setMessage } = usePopcorn();

  const deleteDialog = useDeleteDialog();
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] = useState<Element | null>(
    null
  );

  const { data: jobs, mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job?.project,
    endpoint: "jobs",
  });

  const { data: dependentJobs } = api.get_endpoint<Job[]>({
    type: "jobs",
    id: job?.id,
    endpoint: "dependent_jobs",
  });

  const topLevelDependentJobs = useMemo<Job[]>(() => {
    try {
      if (Array.isArray(dependentJobs) && dependentJobs.length > 0) {
        const result = dependentJobs
          ? dependentJobs.filter((job) => job.parent === null)
          : [];

        return result;
      }
    } catch (error) {
      console.log(dependentJobs);
      console.error(error);
    }
    return [];
  }, [dependentJobs]);

  const handleClone = useCallback(
    async (ev: SyntheticEvent) => {
      if (!job) return;
      ev.stopPropagation();
      const cloneResult: Job = await api.post(`jobs/${job.id}/clone/`);
      if (cloneResult?.id) {
        mutateJobs();
        setJobMenuAnchorEl(null);
        router.push(`/project/${job.project}/job/${cloneResult.id}`);
      }
    },
    [job, mutateJobs]
  );

  const handleRun = useCallback(
    async (ev: SyntheticEvent) => {
      if (!job) return;
      ev.stopPropagation();
      const runResult: Job = await api.post(`jobs/${job.id}/run/`);
      setMessage(`Submitted job ${runResult?.number}: ${runResult?.task_name}`);
      if (runResult?.id) {
        mutateJobs();
        setJobMenuAnchorEl(null);
        router.push(`/project/${job.project}/job/${runResult.id}`);
      }
    },
    [job, mutateJobs]
  );

  const handleTerminalInJobDirectory = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      if (job) {
        api.post<any>(`jobs/${job.id}/preview/`, { viewer: "terminal" });
        setJobMenuAnchorEl(null);
      }
    },
    [job, setJobMenuAnchorEl]
  );

  const handleStatusClicked = useCallback(
    (ev: SyntheticEvent) => {
      if (!job) return;
      ev.stopPropagation();
      setStatusMenuAnchorEl(ev.currentTarget);
    },
    [job, setStatusMenuAnchorEl]
  );

  const handleDelete = useCallback(
    (ev: SyntheticEvent) => {
      if (!job) return;
      ev.stopPropagation();
      if (deleteDialog)
        deleteDialog({
          type: "show",
          what: `${job.number}: ${job.title}`,
          onDelete: async () => {
            const deleteResult = await api.delete(`jobs/${job.id}`);
            console.log(deleteResult);
            mutateJobs();
            setJobMenuAnchorEl(null);
            setJob(null);
            router.push(`/project/${job.project}`);
          },
          onCancel: () => {
            setJobMenuAnchorEl(null);
            setJob(null);
          },
          children: [
            <Paper
              key="dependentJobs"
              sx={{ maxHeight: "10rem", overflowY: "auto" }}
            >
              {topLevelDependentJobs && topLevelDependentJobs?.length > 0 && (
                <>
                  The following {topLevelDependentJobs.length} dependent jobs
                  would be deleted
                  <List dense>
                    {topLevelDependentJobs &&
                      topLevelDependentJobs.map((dependentJob: Job) => {
                        return (
                          <ListItem key={dependentJob.uuid}>
                            <Toolbar>
                              <CCP4i2JobAvatar job={dependentJob} />
                              {`${dependentJob.number}: ${dependentJob.title}`}
                            </Toolbar>
                          </ListItem>
                        );
                      })}
                  </List>
                </>
              )}
            </Paper>,
          ],
          deleteDisabled: !(
            (dependentJobs && dependentJobs?.length == 0) ||
            (dependentJobs &&
              dependentJobs.some(
                (dependentJob: Job) => dependentJob.status == 6
              ))
          ),
        });
    },
    [dependentJobs, job, mutateJobs]
  );

  return (
    job && (
      <>
        <Menu
          open={Boolean(jobMenuAnchorEl)}
          anchorEl={jobMenuAnchorEl}
          onClose={() => setJobMenuAnchorEl(null)}
        >
          <MenuItem
            key="Clone"
            disabled={job.number.includes(".")}
            onClick={handleClone}
          >
            <CopyAll /> Clone
          </MenuItem>
          <MenuItem
            key="Run"
            disabled={job.number.includes(".") || job.status !== 1}
            onClick={handleRun}
          >
            <RunCircle /> Run
          </MenuItem>
          <MenuItem
            key="Delete"
            disabled={job.number.includes(".")}
            onClick={handleDelete}
          >
            <Delete /> Delete
          </MenuItem>
          <MenuItem
            key="Status"
            //disabled={job.number.includes(".")} // There are cases where we want to set the status of a job that is not top level
            onClick={handleStatusClicked}
          >
            <Delete /> Set status
          </MenuItem>
          <MenuItem
            key="Status"
            disabled={false}
            onClick={handleTerminalInJobDirectory}
          >
            <TerminalOutlined /> Terminal in job directory
          </MenuItem>
        </Menu>
        <StatusMenu
          job={job}
          anchorEl={statusMenuAnchorEl}
          onClose={() => {
            setStatusMenuAnchorEl(null);
            setJobMenuAnchorEl(null);
          }}
        />
      </>
    )
  );
};

interface StatusMenuProps {
  job: Job;
  anchorEL: HTMLElement;
  onClose: () => void;
}
const StatusMenu = ({ job, anchorEl, onClose }) => {
  const api = useApi();

  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job?.project,
    endpoint: "jobs",
  });

  const setStatus = useCallback(
    async (status: number) => {
      const formData = new FormData();
      formData.append("status", `${status}`);

      const result = await api.patch(`jobs/${job.id}/`, formData);
      if (result) {
        console.log(result);
        mutateJobs();
        onClose();
      }
    },
    [job, mutateJobs, onClose]
  );

  return (
    <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose}>
      <MenuItem onClick={() => setStatus(5)}>
        <SmsFailed /> Failed
      </MenuItem>
      <MenuItem onClick={() => setStatus(6)}>
        <FireExtinguisherRounded /> Finished
      </MenuItem>
      <MenuItem onClick={() => setStatus(1)}>
        <Pending /> Pending
      </MenuItem>
    </Menu>
  );
};
