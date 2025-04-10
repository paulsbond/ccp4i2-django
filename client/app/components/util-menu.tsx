"use client";
import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";

export default function UtilMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button color="inherit" onClick={handleClick}>
        Utilities
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Copy demo data to project</MenuItem>
        <MenuItem onClick={handleClose}>Running jobs and processes</MenuItem>
        <MenuItem onClick={handleClose}>Manage imported files</MenuItem>
        <MenuItem onClick={handleClose}>Send error report</MenuItem>
        <MenuItem onClick={handleClose}>System administrator tools</MenuItem>
        <MenuItem onClick={handleClose}>Developer tools</MenuItem>
      </Menu>
    </>
  );
}
