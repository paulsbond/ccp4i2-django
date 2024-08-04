"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
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
  Theme,
} from "@mui/material";
import { Clear, Delete, Download } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { get, post } from "./api";
import { Project } from "./models";
import { shortDate } from "./pipes";
import { useSet } from "./hooks";
import DeleteProjectDialog from "./components/delete-project-dialog";
import SearchField from "./components/search-field";
import ProjectsToolbar from "./components/projects-toolbar";

const sxSelected = {
  bgcolor: (theme: Theme) =>
    alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
};

export default function ProjectsPage() {
  const router = useRouter();
  const projects = get<Project[]>("projects");
  const selected = useSet<number>([]);
  const [query, setQuery] = useState("");
  const [deleteProjects, setDeleteProjects] = useState<Project[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects
      ?.filter((project) =>
        project.name.toLowerCase().includes(query.toLowerCase())
      )
      .sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );
  }, [projects, query]);

  function deleteProject(project: Project) {
    setDeleteProjects([project]);
    setDeleteOpen(true);
  }

  function exportProject(project: Project) {
    // TODO
  }

  function deleteSelected() {
    const selectedProjects = projects?.filter((project) =>
      selected.has(project.id)
    );
    if (!selectedProjects) return;
    setDeleteProjects(selectedProjects);
    setDeleteOpen(true);
  }

  function handleDelete() {
    deleteProjects.forEach((project) => {
      // TODO
    });
    setDeleteOpen(false);
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
    <>
      <DeleteProjectDialog
        open={deleteOpen}
        projects={deleteProjects}
        onCancel={() => setDeleteOpen(false)}
        onDelete={handleDelete}
      />
      <Stack spacing={2}>
        <ProjectsToolbar />
        <Box>
          {selected.size === 0 ? (
            <Toolbar disableGutters>
              <SearchField onDelay={setQuery} />
            </Toolbar>
          ) : (
            <Toolbar sx={{ gap: 2, ...sxSelected }}>
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
            </Toolbar>
          )}
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
              {filteredProjects?.map((project: Project) => (
                <TableRow
                  key={project.id}
                  hover
                  onClick={(event) => router.push(`/project/${project.id}`)}
                  sx={{
                    cursor: "pointer",
                    ...(selected.has(project.id) && sxSelected),
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
    </>
  );
}
