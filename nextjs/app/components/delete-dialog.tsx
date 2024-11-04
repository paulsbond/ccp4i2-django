"use client";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useReducer,
} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface DeleteDialogState {
  open: boolean;
  what?: string;
  onDelete?: () => void;
}

interface DeleteDialogAction {
  type: "show" | "hide";
  what?: string;
  onDelete?: () => void;
}

const DeleteDialogContext = createContext<Dispatch<DeleteDialogAction> | null>(
  null
);

export function DeleteDialogProvider(props: PropsWithChildren) {
  const [state, dispatch] = useReducer(deleteDialogReducer, { open: false });

  function handleCancel() {
    dispatch({ type: "hide" });
  }

  function handleDelete() {
    state.onDelete?.();
    dispatch({ type: "hide" });
  }

  return (
    <>
      <Dialog open={state.open}>
        <DialogTitle>{`Delete ${state.what}?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <DeleteDialogContext.Provider value={dispatch}>
        {props.children}
      </DeleteDialogContext.Provider>
    </>
  );
}

export function useDeleteDialog() {
  return useContext(DeleteDialogContext);
}

function deleteDialogReducer(
  state: DeleteDialogState,
  action: DeleteDialogAction
): DeleteDialogState {
  switch (action.type) {
    case "show":
      return { open: true, what: action.what, onDelete: action.onDelete };
    case "hide":
      return { open: false };
  }
}
