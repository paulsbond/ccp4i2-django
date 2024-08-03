import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Project } from "../models";

interface DeleteProjectDialogProps {
  open: boolean;
  projects: Project[];
  onCancel: () => void;
  onDelete: () => void;
}

export default function DeleteProjectDialog({
  open,
  projects,
  onCancel,
  onDelete,
}: DeleteProjectDialogProps) {
  if (projects.length === 0) {
    return null;
  }
  return (
    <Dialog open={open}>
      <DialogTitle>
        {projects.length > 1
          ? `Delete ${projects.length} Projects?`
          : `Delete ${projects[0].name}?`}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Deleted projects cannot be recovered.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
