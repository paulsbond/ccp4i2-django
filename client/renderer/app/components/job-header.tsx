import {
  Avatar,
  Button,
  IconButton,
  LinearProgress,
  Toolbar,
  Typography,
} from "@mui/material";
import { Job, File as DjangoFile } from "../models";
import EditableTypography from "./editable-typography";
import { useApi } from "../api";
import { KeyedMutator } from "swr";
import { useMemo, useState } from "react";
import { CCP4i2JobAvatar } from "./job-avatar";
import { JobMenu, JobMenuContext, JobWithChildren } from "./job-menu";
import { Menu } from "@mui/icons-material";

interface JobHeaderProps {
  job: Job;
  mutateJobs: KeyedMutator<Job[]>;
}
export const JobHeader: React.FC<JobHeaderProps> = ({ job, mutateJobs }) => {
  const api = useApi();
  const [previewNode, setPreviewNode] = useState<
    JobWithChildren | DjangoFile | null
  >(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuNode, setMenuNode] = useState<
    Job | JobWithChildren | DjangoFile | null
  >(null);

  if (!job) return <LinearProgress />;

  return (
    <JobMenuContext.Provider
      value={{
        anchorEl,
        setAnchorEl,
        menuNode,
        setMenuNode,
        previewNode,
        setPreviewNode,
      }}
    >
      <Toolbar variant="regular" sx={{ backgroundColor: "#f0f0f0" }}>
        <CCP4i2JobAvatar job={job} />
        <Typography variant="h5" sx={{ ml: 2, mr: 2 }}>
          {job.number}
        </Typography>
        <EditableTypography
          variant="h5"
          text={job.title}
          onDelay={async (name) => {
            const formData = new FormData();
            formData.set("title", name);
            await api.patch(`jobs/${job.id}`, formData);
            mutateJobs();
          }}
        />
        <Typography sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          onClick={(ev) => {
            ev.stopPropagation();
            setAnchorEl(ev.currentTarget);
            setMenuNode(job);
          }}
        >
          <Menu />
        </Button>
      </Toolbar>
      <JobMenu />
    </JobMenuContext.Provider>
  );
};
