import { Avatar, Toolbar, Typography } from "@mui/material";
import { Job } from "../models";
import EditableTypography from "./editable-typography";
import { useApi } from "../api";
import { KeyedMutator } from "swr";

interface JobHeaderProps {
  job: Job;
  mutateJobs: KeyedMutator<Job[]>;
}
export const JobHeader: React.FC<JobHeaderProps> = ({ job, mutateJobs }) => {
  const api = useApi();
  return (
    <Toolbar>
      <Avatar
        sx={{ width: "1.5rem", height: "1.5rem" }}
        src={`/svgicons/${job.task_name}.svg`}
      />
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
  );
};
