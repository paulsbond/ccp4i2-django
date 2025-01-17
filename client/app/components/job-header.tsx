import { Avatar, LinearProgress, Toolbar, Typography } from "@mui/material";
import { Job } from "../models";
import EditableTypography from "./editable-typography";
import { useApi } from "../api";
import { KeyedMutator } from "swr";
import { useMemo } from "react";

interface JobHeaderProps {
  job: Job;
  mutateJobs: KeyedMutator<Job[]>;
}
export const JobHeader: React.FC<JobHeaderProps> = ({ job, mutateJobs }) => {
  const api = useApi();
  const bgColor = useMemo(() => {
    switch (job?.status) {
      case 0:
        return "#AAA";
      case 1:
        return "#FFF";
      case 2:
        return "#FFA";
      case 3:
        return "#AAF";
      case 4:
        return "#FDA";
      case 5:
        return "#FAA";
      case 6:
        return "#AFA";
      default:
        return "#AAA";
    }
  }, [job]);
  if (!job) return <LinearProgress />;

  return (
    <Toolbar>
      <Avatar
        sx={{ width: "1.5rem", height: "1.5rem", backgroundColor: bgColor }}
        src={`/svgicons/${job.task_name}.svg`}
      />
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
