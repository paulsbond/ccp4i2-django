"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Checkbox,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Theme,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Clear, Delete, Download } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useApi } from "../api";
import { Project } from "../models";
import { shortDate } from "../pipes";
import { useDeleteDialog } from "./delete-dialog";
import { useSet } from "../hooks";
import SearchField from "./search-field";

const sxSelected = {
  bgcolor: (theme: Theme) =>
    alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
};

export default function ProjectsTable() {
  const api = useApi();
  const router = useRouter();
  const { data: projects, mutate } = api.get<Project[]>("projects");
  const selectedIds = useSet<number>([]);
  const [query, setQuery] = useState("");
  const deleteDialog = useDeleteDialog();

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects
      ?.filter((project) =>
        project.name.toLowerCase().includes(query.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.last_access).getTime() - new Date(a.last_access).getTime()
      );
  }, [projects, query]);

  function deleteSelected() {
    const selectedProjects = projects?.filter((project) =>
      selectedIds.has(project.id)
    );
    if (selectedProjects) deleteProjects(selectedProjects);
  }

  function deleteProjects(projects: Project[]) {
    if (deleteDialog)
      deleteDialog({
        type: "show",
        what:
          projects.length === 1
            ? projects[0].name
            : `${projects.length} projects`,
        onDelete: () => {
          const promises = projects.map((project) => {
            selectedIds.delete(project.id);
            return api.delete(`projects/${project.id}`);
          });
          Promise.all(promises).then(() => mutate());
        },
      });
  }

  function exportProject(project: Project) {
    // TODO
  }

  function exportSelected() {
    // TODO
  }

  function toggleAll() {
    if (projects) {
      if (selectedIds.size === projects.length) {
        selectedIds.clear();
      } else {
        projects.forEach((project) => selectedIds.add(project.id));
      }
    }
  }

  if (projects === undefined) return <LinearProgress />;
  if (projects.length === 0) return <></>;
  return (
    Array.isArray(projects) && (
      <Box>
        {selectedIds.size === 0 ? (
          <Toolbar disableGutters>
            <SearchField what="projects" onDelay={setQuery} />
          </Toolbar>
        ) : (
          <Toolbar sx={{ gap: 2, ...sxSelected }}>
            <Tooltip title="Clear selection">
              <IconButton onClick={selectedIds.clear}>
                <Clear />
              </IconButton>
            </Tooltip>
            <Typography color="inherit" variant="subtitle1" component="div">
              {selectedIds.size} selected
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
          </Toolbar>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Tooltip
                  title={
                    selectedIds.size == projects.length
                      ? "Deselect all projects"
                      : "Select all projects"
                  }
                >
                  <Checkbox
                    checked={selectedIds.size == projects.length}
                    indeterminate={
                      selectedIds.size > 0 && selectedIds.size < projects.length
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
            {filteredProjects?.map((project: Project) => (
              <TableRow
                key={project.id}
                hover
                onClick={(event) => router.push(`/project/${project.id}`)}
                sx={{
                  cursor: "pointer",
                  ...(selectedIds.has(project.id) && sxSelected),
                }}
              >
                <TableCell>
                  <Tooltip title="Select project">
                    <Checkbox
                      checked={selectedIds.has(project.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectedIds.has(project.id)
                          ? selectedIds.delete(project.id)
                          : selectedIds.add(project.id);
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{shortDate(project.creation_time)}</TableCell>
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
                          deleteProjects([project]);
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
    )
  );
}
