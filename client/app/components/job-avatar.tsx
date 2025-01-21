import { Avatar } from "@mui/material";
import { Job } from "../models";
import { useMemo } from "react";

interface CCP4i2JobAvatarProps {
  job: Job;
}
export const CCP4i2JobAvatar: React.FC<CCP4i2JobAvatarProps> = ({ job }) => {
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
  return (
    <Avatar
      sx={{ width: "1.5rem", height: "1.5rem", backgroundColor: bgColor }}
      src={`/svgicons/${job.task_name}.svg`}
    />
  );
};
