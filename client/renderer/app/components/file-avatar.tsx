import { Avatar } from "@mui/material";
import { File } from "../models";
import { fileTypeMapping } from "./files-table";
import { useDraggable } from "@dnd-kit/core";
import { forwardRef } from "react";

export const fileTypeIcon = (type: string) => {
  return Object.keys(fileTypeMapping).includes(type)
    ? fileTypeMapping[type]
    : "ccp4";
};

export const FileAvatar = forwardRef<HTMLDivElement, { file: File }>(
  ({ file, ...props }, ref) => {
    return (
      <Avatar
        {...props}
        ref={ref}
        sx={{
          width: "2rem",
          height: "2rem",
          border: "2px dashed #1976d2",
          padding: "4px",
          cursor: "grab",
          transition: "box-shadow 0.2s ease",
          "&:hover": {
            boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.5)",
          },
        }}
        src={`/api/proxy/djangostatic/qticons/${fileTypeIcon(file.type)}.png`}
      />
    );
  }
);
