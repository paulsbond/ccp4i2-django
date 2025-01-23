"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { Add, Download, Menu as MenuIcon, Upload } from "@mui/icons-material";
import { useApi } from "../api";
import { Project } from "../models";

export default function FileMenu() {
  const router = useRouter();
  const api = useApi();
  const { data: projects, mutate: mutateProjects } =
    api.get<Project[]>("projects");

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
        <MenuItem
          key="Manage"
          onClick={() => {
            handleClose();
            router.push("/");
          }}
        >
          <ListItemIcon>
            <MenuIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage/open projects</ListItemText>
        </MenuItem>
        <MenuItem
          key="Add"
          onClick={() => {
            handleClose();
            router.push("/new-project");
          }}
        >
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>New project</ListItemText>
        </MenuItem>
        <MenuItem key="Export" onClick={handleClose}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export project</ListItemText>
        </MenuItem>
        <MenuItem key="Import" onClick={handleClose}>
          <ListItemIcon>
            <Upload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import project</ListItemText>
        </MenuItem>
        <Divider />
        {projects
          ?.sort((a: Project, b: Project) => {
            const dateA = new Date(a.last_access);
            const dateB = new Date(b.last_access);
            return dateB.getTime() - dateA.getTime();
          })
          .map((project: Project) => (
            <MenuItem
              key={project.id}
              onClick={async () => {
                setAnchorEl(null);
                const formData = new FormData();
                const nowString = new Date().toISOString();
                formData.set("last_access", nowString);
                const result = await api
                  .patch(`projects/${project.id}`, formData)
                  .then(() => {
                    mutateProjects();
                  });
                router.push(`/project/${project.id}`);
              }}
            >
              {project.name} - {`${new Date(project.last_access)}`}
            </MenuItem>
          ))}
        <MenuItem key="MoreProjects" onClick={handleClose}>
          More Projects
        </MenuItem>
        <Divider />
        <MenuItem key="CCP4i" onClick={handleClose}>
          View old CCP4i projects
        </MenuItem>
        <MenuItem key="Browser" onClick={handleClose}>
          Browser
        </MenuItem>
        <MenuItem key="Quit" onClick={handleClose}>
          Quit CCP4i2
        </MenuItem>
      </Menu>
    </>
  );
}
