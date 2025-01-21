import { Avatar, LinearProgress, Toolbar, Typography } from "@mui/material";
import { Job } from "../models";
import EditableTypography from "./editable-typography";
import { useApi } from "../api";
import { KeyedMutator } from "swr";
import { useMemo } from "react";
import { CCP4i2JobAvatar } from "./job-avatar";

interface JobHeaderProps {
  job: Job;
  mutateJobs: KeyedMutator<Job[]>;
}
export const JobHeader: React.FC<JobHeaderProps> = ({ job, mutateJobs }) => {
  const api = useApi();

  if (!job) return <LinearProgress />;

  return (
    <Toolbar>
      <CCP4i2JobAvatar job={job} />
      <Typography variant="subtitle1" sx={{ ml: 2, mr: 2 }}>
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
  );
};
