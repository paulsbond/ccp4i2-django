"use client";
import { useState } from "react";
import {
  AppBar,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Add,
  ContentCopy,
  Code,
  Download,
  Description,
  DirectionsRun,
  Help,
  Menu as MenuIcon,
  MenuBook,
  PlayCircle,
  Search,
  Settings,
  SystemUpdateAlt,
  Upload,
  YoutubeSearchedFor,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

function FileMenu() {
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
        File/Projects
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <MenuIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage/open projects</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>New project</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export project</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Upload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import project</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClose}>Project 1</MenuItem>
        <MenuItem onClick={handleClose}>Project 2</MenuItem>
        <MenuItem onClick={handleClose}>More Projects</MenuItem>
        <Divider />
        <MenuItem onClick={handleClose}>View old CCP4i projects</MenuItem>
        <MenuItem onClick={handleClose}>Browser</MenuItem>
        <MenuItem onClick={handleClose}>Quit CCP4i2</MenuItem>
      </Menu>
    </>
  );
}

function EditMenu() {
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
        Edit
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Search fontSize="small" />
          </ListItemIcon>
          <ListItemText>Find</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (Ctrl+F)
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Preferences</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function ViewMenu() {
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
        View
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ZoomIn fontSize="small" />
          </ListItemIcon>
          <ListItemText>Zoom in</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (Ctrl++)
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ZoomOut fontSize="small" />
          </ListItemIcon>
          <ListItemText>Zoom out</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (Ctrl+-)
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <YoutubeSearchedFor fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset zoom</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (Ctrl+0)
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

function UtilMenu() {
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

function HelpMenu() {
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
        Help/Tutorials
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}>About</MenuItem>
        <MenuItem onClick={handleClose}>Tutorials</MenuItem>
        <MenuItem onClick={handleClose}>Quickstart - 10 minute intro</MenuItem>
        <MenuItem onClick={handleClose}>
          Quick expert - more quick hints
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <PlayCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>View YouTube video</ListItemText>
        </MenuItem>
        <MenuItem>Task documentation</MenuItem>
        <MenuItem>Task info from CCP4 Cloud</MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Help fontSize="small" />
          </ListItemIcon>
          <ListItemText>CCP4i2 Help</ListItemText>
          <Typography variant="body2" color="textSecondary">
            (F1)
          </Typography>
        </MenuItem>
        <MenuItem>Tips of the day</MenuItem>
      </Menu>
    </>
  );
}

function MenuBar() {
  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <FileMenu />
        <EditMenu />
        <ViewMenu />
        <UtilMenu />
        <HelpMenu />
      </Toolbar>
    </AppBar>
  );
}

function ToolBar() {
  return (
    <Stack
      direction="row"
      spacing={2}
      useFlexGap
      sx={{ flexWrap: "wrap", justifyContent: "center", px: 2 }}
    >
      <Button variant="outlined" startIcon={<MenuIcon />}>
        Task menu
      </Button>
      <Button variant="outlined" startIcon={<DirectionsRun />}>
        Run
      </Button>
      <Button variant="outlined" startIcon={<ContentCopy />}>
        Clone job
      </Button>
      <Button variant="outlined" startIcon={<Help />}>
        Help
      </Button>
      <Button variant="outlined" startIcon={<MenuBook />}>
        Bibliography
      </Button>
      <Button variant="outlined" startIcon={<SystemUpdateAlt />}>
        Export MTZ
      </Button>
      <Button variant="outlined" startIcon={<Description />}>
        Show log file
      </Button>
      <Button variant="outlined" startIcon={<Code />}>
        Show i2run command
      </Button>
    </Stack>
  );
}

export default function MockPage() {
  return (
    <Stack spacing={2}>
      <MenuBar />
      <ToolBar />
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <h1>Hello</h1>
        </Panel>
        <PanelResizeHandle style={{ width: 5, backgroundColor: "black" }} />
        <Panel defaultSize={70} minSize={20}>
          <h1>World</h1>
        </Panel>
      </PanelGroup>
    </Stack>
  );
}
