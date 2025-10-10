"use client";
import { useState, useRef } from "react";
import {
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { YoutubeSearchedFor, ZoomIn, ZoomOut } from "@mui/icons-material";
import { ThemeToggle } from "./theme-toggle";
import { DevModeToggle } from "./dev-mode-toggle";

export default function ViewMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const themeToggleRef = useRef<HTMLButtonElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleZoomIn = () => {
    if (typeof window !== "undefined" && window?.electronAPI) {
      window.electronAPI.sendMessage("zoom-in", {});
    }
    handleClose();
  };

  const handleZoomOut = () => {
    if (typeof window !== "undefined" && window?.electronAPI) {
      window.electronAPI.sendMessage("zoom-out", {});
    }
    handleClose();
  };

  const handleZoomReset = () => {
    if (typeof window !== "undefined" && window?.electronAPI) {
      window.electronAPI.sendMessage("zoom-reset", {});
    }
    handleClose();
  };

  const handleThemeToggle = () => {
    if (themeToggleRef.current) {
      themeToggleRef.current.click();
    }
    handleClose();
  };

  return (
    <>
      <Button color="inherit" onClick={handleClick}>
        View
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleZoomIn}>
          <ListItemIcon>
            <ZoomIn fontSize="small" />
          </ListItemIcon>
          <ListItemText>Zoom in</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (Ctrl++)
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleZoomOut}>
          <ListItemIcon>
            <ZoomOut fontSize="small" />
          </ListItemIcon>
          <ListItemText>Zoom out</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (Ctrl+-)
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleZoomReset}>
          <ListItemIcon>
            <YoutubeSearchedFor fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset zoom</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (Ctrl+0)
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleThemeToggle}>
          <ThemeToggle ref={themeToggleRef} />
          <ListItemText>Toggle Theme</ListItemText>
        </MenuItem>
        <MenuItem>
          <DevModeToggle />
        </MenuItem>
      </Menu>
    </>
  );
}
