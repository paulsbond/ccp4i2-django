import SimpleDialog from "@mui/material/Dialog";
import { useEffect } from "react";

interface ParseMtzProps {
  file: File | null;
  setFile: (file: File | null) => void;
}
export const ParseMtz = ({ file, setFile }) => {
  useEffect(() => {}, [file]);
  return <SimpleDialog open={file != null} onClose={}></SimpleDialog>;
};
