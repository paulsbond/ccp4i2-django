import {
  Avatar,
  Button,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { doDownload, useApi } from "../api";
import {
  Job,
  File as DjangoFile,
  JobCharValue,
  JobFloatValue,
} from "../models";
import { CCP4i2JobAvatar } from "./job-avatar";
import React, {
  createContext,
  SyntheticEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  RichTreeView,
  TreeItem2,
  TreeItem2Content,
  TreeItem2GroupTransition,
  TreeItem2Icon,
  TreeItem2IconContainer,
  TreeItem2Label,
  TreeItem2LabelInput,
  TreeItem2Props,
  TreeItem2Provider,
  TreeItem2Root,
  TreeItem2SlotProps,
  useTreeItem2,
  useTreeItem2Utils,
} from "@mui/x-tree-view";
import {
  CopyAll,
  Delete,
  Download,
  Favorite,
  FavoriteBorder,
  Menu as MenuIcon,
  RunCircle,
} from "@mui/icons-material";
import { Chicle } from "next/font/google";
import { CCP4i2Context } from "../app-context";
import { useRouter } from "next/navigation";
import { fileTypeMapping } from "./files-table";
import { useDeleteDialog } from "./delete-dialog";

interface JobWithChildren extends Job {
  children: (Job | DjangoFile)[];
}

interface ContextProps {
  previewNode: JobWithChildren | DjangoFile | null;
  setPreviewNode: (node: JobWithChildren | DjangoFile | null) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (element: HTMLElement | null) => void;
  menuNode: Job | JobWithChildren | DjangoFile | null;
  setMenuNode: (node: Job | JobWithChildren | DjangoFile | null) => void;
}

const TreeBrowserContext = createContext<ContextProps>({
  previewNode: null,
  setPreviewNode: () => {},
  anchorEl: null,
  setAnchorEl: () => {},
  menuNode: null,
  setMenuNode: () => {},
});

interface ClassicJobListProps {
  projectId: number;
  parent?: number;
  withSubtitles?: boolean;
}
export const ClassicJobList: React.FC<ClassicJobListProps> = ({
  projectId,
  parent = null,
  withSubtitles = false,
}) => {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [previewNode, setPreviewNode] = useState<
    JobWithChildren | DjangoFile | null
  >(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuNode, setMenuNode] = useState<
    Job | JobWithChildren | DjangoFile | null
  >(null);

  const navigate = useRouter();
  const api = useApi();

  const { data: jobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: projectId,
    endpoint: "jobs",
  });

  const { data: files } = api.get_endpoint<DjangoFile[]>({
    type: "projects",
    id: projectId,
    endpoint: "files",
  });

  const decoratedJobs = useMemo<
    (JobWithChildren | DjangoFile)[] | undefined
  >(() => {
    return jobs
      ?.filter((job) => job.parent === parent)
      .map((job) => {
        const childJobs: (Job | DjangoFile)[] = jobs.filter(
          (childJob) => childJob.parent === job.id
        );
        const childFiles = files?.filter((file) => file.job === job.id);
        return {
          ...job,
          children: childJobs.concat(childFiles || []),
        };
      });
  }, [jobs, files]);

  const getItemLabel = useCallback(
    (jobOrFile: JobWithChildren | DjangoFile) => {
      const isJob = "parent" in jobOrFile;
      return isJob
        ? `${(jobOrFile as Job).number}: ${(jobOrFile as Job).title}`
        : (jobOrFile as DjangoFile).annotation.trim().length > 0
        ? (jobOrFile as DjangoFile).annotation
        : (jobOrFile as DjangoFile).job_param_name;
    },
    []
  );

  const handleSelectedItemsChange = useCallback(
    (event: React.SyntheticEvent, ids: string | null) => {
      const job = jobs?.find((job) => job.uuid === ids);
      console.log(ids);
      console.log({ job }, jobs);
      if (job) {
        navigate.push(`/project/${job.project}/job/${job.id}`);
      }
      setSelectedItems(ids ? [ids] : []);
    },
    [jobs]
  );

  return (
    <TreeBrowserContext.Provider
      value={{
        anchorEl,
        setAnchorEl,
        menuNode,
        setMenuNode,
        previewNode,
        setPreviewNode,
      }}
    >
      {decoratedJobs && (
        <RichTreeView
          items={decoratedJobs || []}
          isItemEditable={(item) => true}
          experimentalFeatures={{ labelEditing: true }}
          getItemId={(jobOrFile) => jobOrFile.uuid}
          getItemLabel={getItemLabel}
          slots={{ item: CustomTreeItem }}
          onSelectedItemsChange={handleSelectedItemsChange}
        />
      )}
      <JobMenu />
    </TreeBrowserContext.Provider>
  );
};

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
  { id, itemId, label, disabled, children }: TreeItem2Props,
  ref: React.Ref<HTMLLIElement>
) {
  const api = useApi();
  const projectId = useContext(CCP4i2Context).projectId;
  const { data: jobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: projectId,
    endpoint: "jobs",
  });
  const { data: jobCharValues } = api.get_endpoint<JobCharValue[]>({
    type: "projects",
    id: projectId,
    endpoint: "job_char_values",
  });
  const { data: jobFloatValues } = api.get_endpoint<JobFloatValue[]>({
    type: "projects",
    id: projectId,
    endpoint: "job_float_values",
  });
  const { data: files } = api.get_endpoint<DjangoFile[]>({
    type: "projects",
    id: projectId,
    endpoint: "files",
  });

  const job = jobs?.find((job) => job.uuid === itemId);

  const file = files?.find((file) => file.uuid === itemId);

  const { anchorEl, setAnchorEl, menuNode, setMenuNode } =
    useContext(TreeBrowserContext);

  const kpiContent = useMemo(() => {
    return (
      <>
        {job &&
          jobCharValues
            ?.filter((item: JobCharValue) => item.job === job.id)
            .map((item: JobCharValue) => (
              <Chip
                key={item.key}
                avatar={<div style={{ width: "5rem" }}>{item.key}</div>}
                label={item.value}
              />
            ))}
        {job &&
          jobFloatValues
            ?.filter((item: JobFloatValue) => item.job === job.id)
            .map((item) => (
              <Chip
                key={item.key}
                sx={{ backgroundColor: "#DFD" }}
                avatar={<div style={{ width: "5rem" }}>{item.key}</div>}
                label={item.value.toPrecision(3)}
              />
            ))}
      </>
    );
  }, [jobCharValues, jobFloatValues]);

  const {
    getRootProps,
    getContentProps,
    getLabelProps,
    getGroupTransitionProps,
    getIconContainerProps,
    getLabelInputProps,
    status,
  } = useTreeItem2({ id, itemId, label, disabled, children, rootRef: ref });

  const fileTypeIcon = (type: string) => {
    return Object.keys(fileTypeMapping).includes(type)
      ? fileTypeMapping[type]
      : "ccp4";
  };

  const jobTime =
    job && job.finish_time
      ? `Finished ${new Date(job.finish_time).toLocaleString()}`
      : job && job.creation_time
      ? `Modified ${new Date(job.creation_time).toLocaleString()}`
      : null;

  return (
    <TreeItem2Provider itemId={itemId}>
      <TreeItem2Root
        {...getRootProps()}
        sx={
          !file && !job?.number.includes(".")
            ? { border: "1px solid #999" }
            : {}
        }
      >
        <TreeItem2Content {...getContentProps()}>
          <TreeItem2IconContainer {...getIconContainerProps()}>
            <TreeItem2Icon status={status} />
          </TreeItem2IconContainer>
          <Stack direction="row">
            {job ? (
              <CCP4i2JobAvatar job={job} />
            ) : file ? (
              <Avatar
                src={`/qticons/${fileTypeIcon(file.type)}.png`}
                sx={{ height: "1.5rem", width: "1.5rem" }}
              />
            ) : (
              ""
            )}
          </Stack>
          {status.editing ? (
            <TreeItem2LabelInput {...getLabelInputProps()} />
          ) : (
            <Stack direction={"column"}>
              <TreeItem2Label {...getLabelProps()} />
              {jobTime && (
                <Typography variant="body2" sx={{ fontSize: "75%" }} noWrap>
                  {jobTime}
                </Typography>
              )}
              <Stack direction="row">{kpiContent}</Stack>
            </Stack>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          />
          <IconButton
            onClick={(ev) => {
              ev.stopPropagation();
              setAnchorEl(ev.currentTarget);
              setMenuNode(job || file || null);
            }}
          >
            <MenuIcon />
          </IconButton>
        </TreeItem2Content>
        {children && (
          <TreeItem2GroupTransition {...getGroupTransitionProps()} />
        )}
      </TreeItem2Root>
    </TreeItem2Provider>
  );
});

const JobMenu: React.FC = () => {
  const { anchorEl, setAnchorEl, menuNode, setMenuNode } =
    useContext(TreeBrowserContext);
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
