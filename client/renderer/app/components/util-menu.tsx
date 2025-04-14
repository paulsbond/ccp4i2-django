"use client";
import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { useRouter } from "next/navigation";

export default function UtilMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSystemAdministratorToolsClick = () => {
    router.push("/config");
    handleClose();
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
        <MenuItem onClick={handleSystemAdministratorToolsClick}>
          System administrator tools
        </MenuItem>
        <MenuItem onClick={handleClose}>Developer tools</MenuItem>
      </Menu>
    </>
  );
}
