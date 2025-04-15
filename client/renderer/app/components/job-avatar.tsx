import { Avatar } from "@mui/material";
import { Job } from "../models";
import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";

interface CCP4i2JobAvatarProps {
  job: Job;
}
export const CCP4i2JobAvatar: React.FC<CCP4i2JobAvatarProps> = ({ job }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: job.id,
  });
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
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        width: "2rem",
        height: "2rem",
        backgroundColor: bgColor,
      }}
      src={`/api/proxy/djangostatic/svgicons/${job.task_name}.svg`}
      alt="User"
    />
  );
};
