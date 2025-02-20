import { SyntheticEvent, useCallback, useContext, createContext } from "react";
import { Job, File as DjangoFile } from "../models";
import { doDownload, useApi } from "../api";
import { useRouter } from "next/navigation";
import { useDeleteDialog } from "./delete-dialog";
import { List, ListItem, Menu, MenuItem, Paper, Toolbar } from "@mui/material";
import { CCP4i2JobAvatar } from "./job-avatar";
import { CopyAll, Delete, Download, RunCircle } from "@mui/icons-material";

export interface JobWithChildren extends Job {
  children: (Job | DjangoFile)[];
}

export interface ContextProps {
  previewNode: JobWithChildren | DjangoFile | null;
  setPreviewNode: (node: JobWithChildren | DjangoFile | null) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (element: HTMLElement | null) => void;
  menuNode: Job | JobWithChildren | DjangoFile | null;
  setMenuNode: (node: Job | JobWithChildren | DjangoFile | null) => void;
}

export const JobMenuContext = createContext<ContextProps>({
  previewNode: null,
  setPreviewNode: () => {},
  anchorEl: null,
  setAnchorEl: () => {},
  menuNode: null,
  setMenuNode: () => {},
});

export const JobMenu: React.FC = () => {
  const { anchorEl, setAnchorEl, menuNode, setMenuNode } =
    useContext(JobMenuContext);
  const api = useApi();
  const router = useRouter();
  const deleteDialog = useDeleteDialog();

  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: (menuNode as Job)?.project,
    endpoint: "jobs",
  });

  const { data: dependentJobs } = api.get_endpoint<Job[]>({
    type: "jobs",
    id: (menuNode as Job)?.id,
    endpoint: "dependent_jobs",
  });

  const handleClone = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const job = menuNode as Job;
      const cloneResult: Job = await api.post(`jobs/${job.id}/clone/`);
      if (cloneResult?.id) {
        mutateJobs();
        setAnchorEl(null);
        router.push(`/project/${job.project}/job/${cloneResult.id}`);
      }
    },
    [menuNode]
  );

  const handleRun = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const job = menuNode as Job;
      const runResult: Job = await api.post(`jobs/${job.id}/run/`);
      if (runResult?.id) {
        mutateJobs();
        setAnchorEl(null);
        router.push(`/project/${job.project}/job/${runResult.id}`);
      }
    },
    [menuNode]
  );

  const handleDownloadFile = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        ev.stopPropagation();
        const composite_path = api.noSlashUrl(`files/${file.id}/download/`);
        doDownload(composite_path, file.name);
        setAnchorEl(null);
      }
    },
    [menuNode]
  );

  const handleDelete = useCallback(
    (ev: SyntheticEvent) => {
      const job = menuNode as Job;
      ev.stopPropagation();
      if (deleteDialog)
        deleteDialog({
          type: "show",
          what: `${job.number}: ${job.title}`,
          onDelete: async () => {
            const deleteResult = await api.delete(`jobs/${job.id}`);
            console.log(deleteResult);
            mutateJobs();
          },
          children: [
            <Paper sx={{ maxHeight: "10rem", overflowY: "auto" }}>
              {dependentJobs && dependentJobs?.length > 0 && (
                <>
                  The following {dependentJobs.length} dependent jobs would be
                  deleted
                  <List dense>
                    {dependentJobs &&
                      dependentJobs.map((dependentJob: Job) => {
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
    [dependentJobs, menuNode]
  );

  return menuNode?.hasOwnProperty("parent") ? (
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => setAnchorEl(null)}
    >
      <MenuItem
        key="Clone"
        disabled={(menuNode as Job).number.includes(".")}
        onClick={handleClone}
      >
        <CopyAll /> Clone
      </MenuItem>
      <MenuItem
        key="Run"
        disabled={
          (menuNode as Job).number.includes(".") ||
          (menuNode as Job).status !== 1
        }
        onClick={handleRun}
      >
        <RunCircle /> Run
      </MenuItem>
      <MenuItem
        key="Delete"
        disabled={(menuNode as Job).number.includes(".")}
        onClick={handleDelete}
      >
        <Delete /> Delete
      </MenuItem>
    </Menu>
  ) : (
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => setAnchorEl(null)}
    >
      <MenuItem key="Done" onClick={handleDownloadFile}>
        <Download /> Download
      </MenuItem>
    </Menu>
  );
};
