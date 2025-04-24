import {
  SyntheticEvent,
  useCallback,
  useContext,
  createContext,
  useMemo,
  useEffect,
  useState,
} from "react";
import { Job, File as DjangoFile } from "../models";
import { doDownload, fullUrl, useApi } from "../api";
import { useRouter } from "next/navigation";
import { useDeleteDialog } from "./delete-dialog";
import { List, ListItem, Menu, MenuItem, Paper, Toolbar } from "@mui/material";
import { CCP4i2JobAvatar } from "./job-avatar";
import {
  CopyAll,
  Delete,
  Download,
  Preview,
  RunCircle,
  Terminal,
} from "@mui/icons-material";
import { FilePreviewDialog } from "./file-preview";
import { JobMenuContextData } from "./JobOrFileMenuContext";

export interface JobWithChildren extends Job {
  children: (Job | DjangoFile)[];
}

export const JobMenu: React.FC = () => {
  const {
    anchorEl,
    setAnchorEl,
    menuNode,
    setMenuNode,
    previewNode,
    setPreviewNode,
    previewType,
    setPreviewType,
  } = useContext(JobMenuContextData);
  const api = useApi();
  const router = useRouter();
  const deleteDialog = useDeleteDialog();

  const { data: jobs, mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: (menuNode as Job)?.project,
    endpoint: "jobs",
  });

  const { data: dependentJobs } = api.get_endpoint<Job[]>({
    type: "jobs",
    id: (menuNode as Job)?.id,
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
      ev.stopPropagation();
      const job = menuNode as Job;
      const cloneResult: Job = await api.post(`jobs/${job.id}/clone/`);
      if (cloneResult?.id) {
        mutateJobs();
        setAnchorEl(null);
        router.push(`/project/${job.project}/job/${cloneResult.id}`);
      }
    },
    [menuNode, mutateJobs]
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
    [menuNode, mutateJobs]
  );

  const handleDownloadFile = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        const composite_path = api.noSlashUrl(`files/${file.id}/download/`);
        doDownload(composite_path, file.name);
        setAnchorEl(null);
      }
    },
    [menuNode]
  );

  const handlePreviewFile = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        setPreviewNode(file);
        setPreviewType("text");
        setAnchorEl(null);
      }
    },
    [menuNode]
  );

  const handlePreviewFileDigest = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        setPreviewNode(file);
        setPreviewType("digest");
        setAnchorEl(null);
      }
    },
    [menuNode]
  );

  const handlePreviewFileInCoot = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        console.log("Handling preview in coot", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "coot" });
        setAnchorEl(null);
      }
    },
    [menuNode]
  );

  const handlePreviewFileInHklview = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        console.log("Handling preview in hklview", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "hklview" });
        setAnchorEl(null);
      }
    },
    [menuNode]
  );

  const handlePreviewFileInCCP4MG = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        console.log("Handling preview in CCP4MG", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "ccp4mg" });
        setAnchorEl(null);
      }
    },
    [menuNode]
  );

  const handlePreviewFileInTerminal = useCallback(
    async (ev: SyntheticEvent) => {
      ev.stopPropagation();
      const file = menuNode as DjangoFile;
      if (file) {
        console.log("Handling preview in terminal", file);
        api.post<any>(`files/${file.id}/preview/`, { viewer: "terminal" });
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
            setAnchorEl(null);
            setMenuNode(null);
            router.push(`/project/${job.project}`);
          },
          onCancel: () => {
            setAnchorEl(null);
            setMenuNode(null);
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
    [dependentJobs, menuNode, mutateJobs]
  );

  const menuNodeAsFile = menuNode as DjangoFile;

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
      <MenuItem key="Download" onClick={handleDownloadFile}>
        <Download /> Download
      </MenuItem>
      <MenuItem key="Preview" onClick={handlePreviewFile}>
        <Preview /> Preview
      </MenuItem>
      <MenuItem key="Terminal" onClick={handlePreviewFileInTerminal}>
        <Terminal /> Terminal
      </MenuItem>
      {menuNodeAsFile &&
        ["chemical/x-pdb", "application/CCP4-mtz-map"].includes(
          menuNodeAsFile.type
        ) && (
          <MenuItem key="Coot" onClick={handlePreviewFileInCoot}>
            <Preview /> Coot
          </MenuItem>
        )}
      {menuNodeAsFile &&
        ["chemical/x-pdb", "application/CCP4-mtz-map"].includes(
          menuNodeAsFile.type
        ) && (
          <MenuItem key="CCP4MG" onClick={handlePreviewFileInCCP4MG}>
            <Preview /> CCP4MG
          </MenuItem>
        )}
      {menuNodeAsFile &&
        menuNodeAsFile.type.startsWith("application/CCP4-mtz") && (
          <MenuItem key="HKLVIEW" onClick={handlePreviewFileInHklview}>
            <Preview /> HKLVIEW
          </MenuItem>
        )}
      {menuNodeAsFile && (
        <MenuItem key="DIGEST" onClick={handlePreviewFileDigest}>
          <Preview /> DIGEST
        </MenuItem>
      )}
      <ClassicJobsListPreviewDialog />
    </Menu>
  );
};

export const ClassicJobsListPreviewDialog: React.FC = () => {
  const { previewNode, setPreviewNode, previewType, setPreviewType } =
    useContext(JobMenuContextData);
  const { noSlashUrl } = useApi();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewNode) return;
    if (!(previewNode as DjangoFile).name) return;
    console.log(previewNode);
    const djangoFile = previewNode as DjangoFile;
    if (previewNode && previewType === "text") {
      const composite_path = fullUrl(`files/${djangoFile.id}/download/`);
      setPreviewUrl(composite_path);
    } else if (previewNode && previewType === "digest") {
      const composite_path = fullUrl(
        `jobs/${djangoFile.job}/digest_output/?job_param_name=${djangoFile.job_param_name}/`
      );
      setPreviewUrl(composite_path);
    }
  }, [previewNode, noSlashUrl, previewType]);

  useEffect(() => {
    if (!previewUrl) setPreviewNode(null);
  }, [previewUrl]);

  const fileName = useMemo(() => {
    if (previewType === "digest") {
      return "digest.json";
    } else {
      return (previewNode as DjangoFile)?.name;
    }
  }, [previewNode, previewType]);

  return (
    previewNode && (
      <FilePreviewDialog
        url={previewUrl}
        filename={fileName}
        setUrl={setPreviewUrl}
      />
    )
  );
};
