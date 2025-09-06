import { useApi } from "../../api";
import { Project as ProjectInfo, Job as JobInfo } from "../../types/models";
import { moorhen } from "moorhen/types/moorhen";
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Button,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import { CreateTaskResponse } from "../../utils";
import { usePopcorn } from "../../providers/popcorn-provider";

interface PushToCCP4i2Props {
  project?: ProjectInfo;
  molNo?: number;
  item?: moorhen.Molecule | moorhen.Map | null;
  onClose: () => void;
}

function detectCoordinateFormat(text: string): "pdb" | "mmcif" | "unknown" {
  const trimmedText = text.replace(/^\s+/, ""); // Remove leading whitespace and blank lines
  if (/^(HEADER|TITLE|ATOM  |HETATM)/m.test(trimmedText)) {
    return "pdb";
  }
  if (/^data_/m.test(trimmedText) && /_atom_site\./.test(trimmedText)) {
    return "mmcif";
  }
  return "unknown";
}

export const PushToCCP4i2Panel: React.FC<PushToCCP4i2Props> = ({
  project,
  molNo,
  item,
  onClose,
}) => {
  const api = useApi();
  const { data: projects } = api.get<ProjectInfo[]>("projects") || [];
  const [selectedProject, setSelectedProject] = useState<
    ProjectInfo | undefined
  >(project);
  const { setMessage } = usePopcorn();

  const { data: jobs, mutate: mutateJobs } = api.get<JobInfo[]>(
    `projects/${selectedProject?.id}/jobs/`
  );

  const handlePushToCCP4i2 = useCallback(async () => {
    console.log({ molNo, item });
    // Implement your push logic here
    if (selectedProject && item) {
      setMessage("Pushing model coordinates to CCP4i2...");
      console.log("Pushing to CCP4i2:", selectedProject);
      const result = await api.post<CreateTaskResponse>(
        `projects/${selectedProject.id}/create_task/`,
        {
          task_name: "coordinate_selector",
        }
      );
      //console.log({ result });
      mutateJobs();
      const modelCoords =
        item.type === "molecule"
          ? await (item as moorhen.Molecule).getAtoms()
          : null;
      if (!modelCoords) return;

      const format = detectCoordinateFormat(modelCoords);
      setMessage(`Detected coordinate format: ${format}`);

      const moleculeName =
        (item as moorhen.Molecule).name +
        (format === "mmcif" ? ".cif" : ".pdb");

      const formData = new FormData();
      formData.append("objectPath", "coordinate_selector.inputData.XYZIN");
      formData.append(
        "file",
        new Blob([modelCoords], {
          type: format === "mmcif" ? "chemical/x-cif" : "chemical/x-pdb",
        }),
        moleculeName
      );
      const uploadResult = await api.post<any>(
        `jobs/${result.new_job?.id}/upload_file_param`,
        formData
      );
      setMessage(`Upload result status: ${uploadResult.status}`);
      const run_result = await api.post<CreateTaskResponse>(
        `jobs/${result.new_job?.id}/run/`,
        {
          task_name: "coordinate_selector",
        }
      );
      setMessage(`Run result status: ${run_result.status}`);
      onClose();
    }
  }, [selectedProject, molNo, item]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Push to CCP4i2 Panel
      </Typography>
      <Autocomplete
        options={projects || []}
        getOptionLabel={(option) => option.name}
        value={selectedProject}
        onChange={(_, value) => setSelectedProject(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Project"
            variant="outlined"
            fullWidth
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        disableClearable
      />
      <Button
        sx={{ mt: 2 }}
        variant="contained"
        color="primary"
        disabled={!selectedProject}
        onClick={handlePushToCCP4i2}
      >
        Push to CCP4i2
      </Button>
      {/* Additional panel content can go here */}
    </Box>
  );
};
