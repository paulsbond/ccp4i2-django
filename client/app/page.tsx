"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  IconButton,
  LinearProgress,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Clear, Delete, Download, Upload } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { get, post } from "./api";
import { Project } from "./models";
import { shortDate } from "./pipes";
import { useSet } from "./hooks";
import SearchField from "./components/search-field";

export default function ProjectsPage() {
  const router = useRouter();
  const projects = get<Project[]>("projects");
  const selected = useSet<number>([]);
  const [query, setQuery] = useState("");

  function newProject() {
    post<Project>("projects").then((project) => {
      router.push(`/project/${project.id}`);
    });
  }

  function deleteProject(project: Project) {
    // TODO
  }

  function exportProject(project: Project) {
    // TODO
  }

  function deleteSelected() {
    // TODO
  }

  function exportSelected() {
    // TODO
  }

  function toggleAll() {
    if (projects) {
      if (selected.size === projects.length) {
        selected.clear();
      } else {
        projects.forEach((project) => selected.add(project.id));
      }
    }
  }

  if (!projects) return <LinearProgress />;
  return (
    <Stack spacing={2}>
      <Toolbar sx={{ gap: 2 }}>
        <Tooltip title="Start a new project">
          <Button variant="contained" startIcon={<Add />} onClick={newProject}>
            New
          </Button>
        </Tooltip>
        <Tooltip title="Import existing projects">
          <Button variant="outlined" startIcon={<Upload />}>
            Import
          </Button>
        </Tooltip>
      </Toolbar>
      <Box>
        <Toolbar
          disableGutters={selected.size === 0}
          sx={{
            ...(selected.size > 0 && {
              gap: 2,
              bgcolor: (theme) =>
                alpha(
                  theme.palette.primary.main,
                  theme.palette.action.activatedOpacity
                ),
            }),
          }}
        >
          {selected.size === 0 ? (
            <SearchField onDelay={setQuery} />
          ) : (
            <>
              <Tooltip title="Clear selection">
                <IconButton onClick={selected.clear}>
                  <Clear />
                </IconButton>
              </Tooltip>
              <Typography color="inherit" variant="subtitle1" component="div">
                {selected.size} selected
              </Typography>
              <Tooltip title="Export selected projects">
                <IconButton onClick={exportSelected}>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete selected projects">
                <IconButton onClick={deleteSelected}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Tooltip
                  title={
                    selected.size == projects.length
                      ? "Deselect all projects"
                      : "Select all projects"
                  }
                >
                  <Checkbox
                    checked={selected.size == projects.length}
                    indeterminate={
                      selected.size > 0 && selected.size < projects.length
                    }
                    onClick={toggleAll}
                  />
                </Tooltip>
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Created</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects
              .filter((project) =>
                project.name.toLowerCase().includes(query.toLowerCase())
              )
              .sort((a, b) => {
                return (
                  new Date(b.created).getTime() - new Date(a.created).getTime()
                );
              })
              .map((project: Project) => (
                <TableRow
                  key={project.id}
                  hover
                  onClick={(event) => router.push(`/project/${project.id}`)}
                  sx={{
                    cursor: "pointer",
                    ...(selected.has(project.id) && {
                      bgcolor: (theme) =>
                        alpha(
                          theme.palette.primary.main,
                          theme.palette.action.activatedOpacity
                        ),
                    }),
                  }}
                >
                  <TableCell>
                    <Tooltip title="Select project">
                      <Checkbox
                        checked={selected.has(project.id)}
                        onClick={(event) => {
                          event.stopPropagation();
                          selected.has(project.id)
                            ? selected.delete(project.id)
                            : selected.add(project.id);
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{shortDate(project.created)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Export project">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            exportProject(project);
                          }}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete project">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteProject(project);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}
