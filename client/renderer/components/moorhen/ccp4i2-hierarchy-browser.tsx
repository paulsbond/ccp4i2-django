import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  FolderOutlined,
  WorkOutline,
  InsertDriveFileOutlined,
  ChevronRight,
  ArrowBack,
  Home,
  Search,
  Clear,
} from "@mui/icons-material";
import { useApi } from "../../api";
import { Project, Job, File as DjangoFile } from "../../types/models";

interface CCP4i2HierarchyBrowserProps {
  onFileSelect: (fileId: number) => Promise<void>;
}

interface HierarchyPanelProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  breadcrumbs?: React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

const HierarchyPanel: React.FC<HierarchyPanelProps> = ({
  title,
  children,
  onBack,
  breadcrumbs,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}) => (
  <Paper
    elevation={2}
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      border: "1px solid #e0e0e0",
    }}
  >
    {/* Header */}
    <Box
      sx={{
        p: 2,
        backgroundColor: "#1976d2",
        color: "white",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {onBack && (
        <IconButton
          onClick={onBack}
          sx={{ color: "white", mr: 1 }}
          size="small"
        >
          <ArrowBack />
        </IconButton>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {breadcrumbs && <Box sx={{ mt: 0.5 }}>{breadcrumbs}</Box>}
      </Box>
    </Box>

    {/* Search Box */}
    <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
      <TextField
        fullWidth
        size="small"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          endAdornment: searchValue && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => onSearchChange("")}
                edge="end"
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
          },
        }}
      />
    </Box>

    {/* Content */}
    <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>
  </Paper>
);

interface ProjectItemProps {
  project: Project;
  onSelect: (project: Project) => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({ project, onSelect }) => (
  <ListItem disablePadding>
    <ListItemButton
      onClick={() => onSelect(project)}
      sx={{
        "&:hover": {
          backgroundColor: "#f5f5f5",
        },
      }}
    >
      <ListItemIcon>
        <FolderOutlined color="primary" />
      </ListItemIcon>
      <ListItemText
        primary={project.name || `Project ${project.id}`}
        secondary={`ID: ${project.id} • Created: ${new Date(
          project.creation_time
        ).toLocaleDateString()}`}
      />
      <ChevronRight color="action" />
    </ListItemButton>
  </ListItem>
);

interface JobItemProps {
  job: Job;
  onSelect: (job: Job) => void;
}

const JobItem: React.FC<JobItemProps> = ({ job, onSelect }) => {
  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "warning"; // Pending
      case 2:
        return "info"; // Running
      case 6:
        return "success"; // Finished
      case 5:
        return "error"; // Failed
      default:
        return "default";
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return "Pending";
      case 2:
        return "Running";
      case 6:
        return "Finished";
      case 5:
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onSelect(job)}
        sx={{
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        <ListItemIcon>
          <WorkOutline color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body1">
                {job.title || `Job ${job.number}`}
              </Typography>
              <Chip
                size="small"
                label={getStatusText(job.status)}
                color={getStatusColor(job.status)}
                variant="outlined"
              />
            </Stack>
          }
          secondary={`#${job.number} • ${job.task_name || "Unknown task"}`}
        />
        <ChevronRight color="action" />
      </ListItemButton>
    </ListItem>
  );
};

interface FileItemProps {
  file: DjangoFile;
  onSelect?: (file: DjangoFile) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onSelect }) => {
  const getFileTypeColor = (type: string) => {
    if (type.includes("pdb")) return "primary";
    if (type.includes("mtz")) return "secondary";
    if (type.includes("cif")) return "info";
    return "default";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onSelect?.(file)}
        sx={{
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        <ListItemIcon>
          <InsertDriveFileOutlined color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {file.name}
              </Typography>
              <Chip
                size="small"
                label={file.type.split("/").pop() || "unknown"}
                color={getFileTypeColor(file.type)}
                variant="outlined"
              />
            </Stack>
          }
          secondary={
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
              <Typography variant="caption">Type: {file.type}</Typography>
              <Typography variant="caption">
                Job param name: {file.job_param_name || "N/A"}
              </Typography>
            </Stack>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

// Helper function to sort jobs by hierarchical number
const sortJobsByNumber = (jobs: Job[]): Job[] => {
  return [...jobs].sort((a, b) => {
    // Extract the first number from the job number (e.g., "1.1.3" -> 1)
    const getFirstIndex = (jobNumber: string): number => {
      const parts = jobNumber.split(".");
      return parseInt(parts[0], 10) || 0;
    };

    const aFirstIndex = getFirstIndex(a.number);
    const bFirstIndex = getFirstIndex(b.number);

    // Sort in decreasing order (highest first)
    return bFirstIndex - aFirstIndex;
  });
};

// Add constants for allowed file types
const ALLOWED_FILE_TYPES = [
  "chemical/x-pdb",
  "application/CCP4-map",
  "application/CCP4-mtz-map",
  "application/refmac-dictionary",
] as const;

// Helper function to check if file type is allowed
const isAllowedFileType = (fileType: string): boolean => {
  return ALLOWED_FILE_TYPES.includes(fileType as any);
};

export const CCP4i2HierarchyBrowser: React.FC<CCP4i2HierarchyBrowserProps> = ({
  onFileSelect,
}) => {
  const api = useApi();

  // State management
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Search state
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>("");
  const [jobSearchTerm, setJobSearchTerm] = useState<string>("");
  const [fileSearchTerm, setFileSearchTerm] = useState<string>("");

  // API calls
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = api.get<Project[]>("/projects");

  const {
    data: jobs,
    isLoading: jobsLoading,
    error: jobsError,
  } = api.get_endpoint<Job[]>({
    type: "projects",
    id: selectedProject?.id,
    endpoint: "jobs",
  });

  const {
    data: files,
    isLoading: filesLoading,
    error: filesError,
  } = api.get_endpoint<DjangoFile[]>({
    type: "jobs",
    id: selectedJob?.id,
    endpoint: "files",
  });

  // Filtered and sorted data based on search terms
  const filteredProjects = useMemo(() => {
    if (!projects || !projectSearchTerm.trim()) return projects;

    const searchLower = projectSearchTerm.toLowerCase();
    return projects.filter((project) => {
      const projectName = (
        project.name || `Project ${project.id}`
      ).toLowerCase();
      const projectId = project.id.toString();
      return (
        projectName.includes(searchLower) || projectId.includes(searchLower)
      );
    });
  }, [projects, projectSearchTerm]);

  const filteredJobs = useMemo(() => {
    if (!jobs) return jobs;

    // First filter to parent jobs only
    const parentJobs = jobs.filter((job) => job.parent === null);

    // Sort by hierarchical job number (decreasing order by first index)
    const sortedJobs = sortJobsByNumber(parentJobs);

    // Apply search filter if there's a search term
    if (!jobSearchTerm.trim()) return sortedJobs;

    const searchLower = jobSearchTerm.toLowerCase();
    return sortedJobs.filter((job) => {
      const jobTitle = (job.title || `Job ${job.number}`).toLowerCase();
      const jobNumber = job.number.toLowerCase();
      const taskName = (job.task_name || "").toLowerCase();
      return (
        jobTitle.includes(searchLower) ||
        jobNumber.includes(searchLower) ||
        taskName.includes(searchLower)
      );
    });
  }, [jobs, jobSearchTerm]);

  const filteredFiles = useMemo(() => {
    if (!files) return files;

    // First filter by allowed file types
    const allowedFiles = files.filter((file) => isAllowedFileType(file.type));

    // Then apply search filter if there's a search term
    if (!fileSearchTerm.trim()) return allowedFiles;

    const searchLower = fileSearchTerm.toLowerCase();
    return allowedFiles.filter((file) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileName.includes(searchLower) || fileType.includes(searchLower);
    });
  }, [files, fileSearchTerm]);

  // Event handlers
  const handleProjectSelect = useCallback((project: Project) => {
    setSelectedProject(project);
    setSelectedJob(null); // Reset job selection when project changes
    setJobSearchTerm(""); // Clear job search when project changes
    setFileSearchTerm(""); // Clear file search when project changes
  }, []);

  const handleJobSelect = useCallback((job: Job) => {
    setSelectedJob(job);
    setFileSearchTerm(""); // Clear file search when job changes
  }, []);

  const handleFileSelect = useCallback(
    (file: DjangoFile) => {
      console.log("File selected:", file);
      onFileSelect(file.id);
    },
    [onFileSelect]
  );

  const handleBackToProjects = useCallback(() => {
    setSelectedProject(null);
    setSelectedJob(null);
    setJobSearchTerm("");
    setFileSearchTerm("");
  }, []);

  const handleBackToJobs = useCallback(() => {
    setSelectedJob(null);
    setFileSearchTerm("");
  }, []);

  // Render loading state
  const renderLoading = () => (
    <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
      <CircularProgress />
    </Box>
  );

  // Render error state
  const renderError = (error: any) => (
    <Box sx={{ p: 2 }}>
      <Alert severity="error">
        Failed to load data: {error?.message || "Unknown error"}
      </Alert>
    </Box>
  );

  // Render empty state
  const renderEmpty = (message: string) => (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  // Create breadcrumbs
  const createBreadcrumbs = () => {
    if (selectedJob) {
      return (
        <Breadcrumbs
          separator="›"
          sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={handleBackToProjects}
            sx={{
              color: "rgba(255,255,255,0.8)",
              textDecoration: "underline",
            }}
          >
            <Home sx={{ mr: 0.5, fontSize: "1rem" }} />
            Projects
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={handleBackToJobs}
            sx={{
              color: "rgba(255,255,255,0.8)",
              textDecoration: "underline",
            }}
          >
            {selectedProject?.name || `Project ${selectedProject?.id}`}
          </Link>
          <Typography variant="body2" sx={{ color: "white" }}>
            Job {selectedJob.number}
          </Typography>
        </Breadcrumbs>
      );
    } else if (selectedProject) {
      return (
        <Breadcrumbs
          separator="›"
          sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={handleBackToProjects}
            sx={{
              color: "rgba(255,255,255,0.8)",
              textDecoration: "underline",
            }}
          >
            <Home sx={{ mr: 0.5, fontSize: "1rem" }} />
            Projects
          </Link>
          <Typography variant="body2" sx={{ color: "white" }}>
            {selectedProject.name || `Project ${selectedProject.id}`}
          </Typography>
        </Breadcrumbs>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: "100%" }}>
      {/* Show Files Panel if job is selected */}
      {selectedJob && (
        <HierarchyPanel
          title={`Files in Job ${selectedJob.number}`}
          onBack={handleBackToJobs}
          breadcrumbs={createBreadcrumbs()}
          searchValue={fileSearchTerm}
          onSearchChange={setFileSearchTerm}
          searchPlaceholder="Search PDB, map, and dictionary files..."
        >
          {filesLoading && renderLoading()}
          {filesError && renderError(filesError)}
          {filteredFiles &&
            filteredFiles.length === 0 &&
            files &&
            files.filter((file) => isAllowedFileType(file.type)).length > 0 &&
            renderEmpty(`No supported files match "${fileSearchTerm}"`)}
          {filteredFiles &&
            filteredFiles.length === 0 &&
            (!files ||
              files.filter((file) => isAllowedFileType(file.type)).length ===
                0) &&
            renderEmpty(
              "No supported files found in this job (PDB, map, or dictionary files only)"
            )}
          {filteredFiles && filteredFiles.length > 0 && (
            <List>
              {filteredFiles.map((file, index) => (
                <React.Fragment key={file.id}>
                  <FileItem file={file} onSelect={handleFileSelect} />
                  {index < filteredFiles.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </HierarchyPanel>
      )}

      {/* Show Jobs Panel if project is selected but no job */}
      {selectedProject && !selectedJob && (
        <HierarchyPanel
          title={`Jobs in ${
            selectedProject.name || `Project ${selectedProject.id}`
          }`}
          onBack={handleBackToProjects}
          breadcrumbs={createBreadcrumbs()}
          searchValue={jobSearchTerm}
          onSearchChange={setJobSearchTerm}
          searchPlaceholder="Search jobs by title, number, or task..."
        >
          {jobsLoading && renderLoading()}
          {jobsError && renderError(jobsError)}
          {filteredJobs &&
            filteredJobs.length === 0 &&
            jobs &&
            jobs.length > 0 &&
            renderEmpty(`No jobs match "${jobSearchTerm}"`)}
          {filteredJobs &&
            filteredJobs.length === 0 &&
            (!jobs || jobs.length === 0) &&
            renderEmpty("No jobs found in this project")}
          {filteredJobs && filteredJobs.length > 0 && (
            <List>
              {filteredJobs.map((job, index) => (
                <React.Fragment key={job.id}>
                  <JobItem job={job} onSelect={handleJobSelect} />
                  {index < filteredJobs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </HierarchyPanel>
      )}

      {/* Show Projects Panel if nothing is selected */}
      {!selectedProject && (
        <HierarchyPanel
          title="Projects"
          searchValue={projectSearchTerm}
          onSearchChange={setProjectSearchTerm}
          searchPlaceholder="Search projects by name or ID..."
        >
          {projectsLoading && renderLoading()}
          {projectsError && renderError(projectsError)}
          {filteredProjects &&
            filteredProjects.length === 0 &&
            projects &&
            projects.length > 0 &&
            renderEmpty(`No projects match "${projectSearchTerm}"`)}
          {filteredProjects &&
            filteredProjects.length === 0 &&
            (!projects || projects.length === 0) &&
            renderEmpty("No projects found")}
          {filteredProjects && filteredProjects.length > 0 && (
            <List>
              {filteredProjects.map((project, index) => (
                <React.Fragment key={project.id}>
                  <ProjectItem
                    project={project}
                    onSelect={handleProjectSelect}
                  />
                  {index < filteredProjects.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </HierarchyPanel>
      )}
    </Box>
  );
};
