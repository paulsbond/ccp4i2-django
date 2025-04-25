import { Avatar, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { EndpointFetch, useApi } from "../api";
import {
  Job,
  File as DjangoFile,
  JobCharValue,
  JobFloatValue,
} from "../models";
import { CCP4i2JobAvatar } from "./job-avatar";
import { forwardRef, useCallback, useContext, useMemo, useState } from "react";
import {
  RichTreeView,
  TreeItem2Content,
  TreeItem2GroupTransition,
  TreeItem2Icon,
  TreeItem2IconContainer,
  TreeItem2Label,
  TreeItem2LabelInput,
  TreeItem2Props,
  TreeItem2Provider,
  TreeItem2Root,
  useTreeItem2,
} from "@mui/x-tree-view";
import { Menu as MenuIcon } from "@mui/icons-material";
import { CCP4i2Context } from "../app-context";
import { useRouter } from "next/navigation";
import { JobMenu, JobMenuContext, JobWithChildren } from "./job-context-menu";
import { useDraggable } from "@dnd-kit/core";
import { FileAvatar } from "./file-avatar";
import { FileMenuContext } from "./file-context-menu";

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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const navigate = useRouter();
  const api = useApi();

  const endpointFetch: EndpointFetch = {
    type: "projects",
    id: projectId,
    endpoint: "jobs",
  };
  const { data: jobs } = api.get_endpoint<Job[]>(endpointFetch, 10000);

  const { data: files } = api.get_endpoint<DjangoFile[]>(
    {
      type: "projects",
      id: projectId,
      endpoint: "files",
    },
    10000
  );

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
      })
      .reverse();
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
    decoratedJobs && (
      <RichTreeView
        items={decoratedJobs || []}
        isItemEditable={(item) => true}
        experimentalFeatures={{ labelEditing: true }}
        getItemId={(jobOrFile) => jobOrFile.uuid}
        getItemLabel={getItemLabel}
        slots={{ item: CustomTreeItem }}
        onSelectedItemsChange={(event, ids) => {
          // Prevent selection when an item is opened
          const closest = (event.target as Element).closest(
            '[class*="-MuiTreeItem2-iconContainer"]'
          );
          if (event.type !== "click" || !closest) {
            handleSelectedItemsChange(event, ids);
          }
        }}
      />
    )
  );
};

const CustomTreeItem = forwardRef(function CustomTreeItem(
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
  const { data: jobCharValues } = api.get_endpoint<JobCharValue[]>(
    {
      type: "projects",
      id: projectId,
      endpoint: "job_char_values/",
    },
    10000
  );
  const { data: jobFloatValues } = api.get_endpoint<JobFloatValue[]>(
    {
      type: "projects",
      id: projectId,
      endpoint: "job_float_values/",
    },
    10000
  );
  const { data: files } = api.get_endpoint<DjangoFile[]>({
    type: "projects",
    id: projectId,
    endpoint: "files",
  });

  const job = jobs?.find((job) => job.uuid === itemId);

  const file = files?.find((file) => file.uuid === itemId);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: job ? `job_${itemId}` : `file_${itemId}`,
    data: { job, file },
  });

  const { setJobMenuAnchorEl, setJob } = useContext(JobMenuContext);
  const { setFileMenuAnchorEl, setFile } = useContext(FileMenuContext);

  const kpiContent = useMemo(() => {
    return (
      <>
        {job &&
          jobCharValues
            ?.filter((item: JobCharValue) => item.job === job.id)
            .map((item: JobCharValue) => (
              <Chip
                key={item.key}
                avatar={<div style={{ width: "4rem" }}>{item.key}</div>}
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
                avatar={<div style={{ width: "4rem" }}>{item.key}</div>}
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
              <CCP4i2JobAvatar
                job={job}
                ref={setNodeRef}
                {...listeners}
                {...attributes}
              />
            ) : file ? (
              <FileAvatar
                file={file}
                ref={setNodeRef}
                {...listeners}
                {...attributes}
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
          <Button
            size="small"
            sx={{ p: 0, m: 0 }}
            variant="outlined"
            onClick={(ev) => {
              ev.stopPropagation();
              if (job) {
                setJobMenuAnchorEl(ev.currentTarget);
                setJob(job || null);
              } else if (file) {
                setFileMenuAnchorEl(ev.currentTarget);
                setFile(file || null);
              }
            }}
          >
            <MenuIcon fontSize="small" />
          </Button>
        </TreeItem2Content>
        {children && (
          <TreeItem2GroupTransition {...getGroupTransitionProps()} />
        )}
      </TreeItem2Root>
    </TreeItem2Provider>
  );
});
