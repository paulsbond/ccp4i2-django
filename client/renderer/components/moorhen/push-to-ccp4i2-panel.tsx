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

interface PushToCCP4i2Props {
  project?: ProjectInfo;
  molNo?: number;
  //item?: moorhen.Molecule | moorhen.Map | null;
  onClose: () => void;
}

export const PushToCCP4i2Panel: React.FC<PushToCCP4i2Props> = ({
  project,
  molNo,
  onClose,
}) => {
  const api = useApi();
  const { data: projects } = api.get<ProjectInfo[]>("projects") || [];
  const [selectedProject, setSelectedProject] = useState<
    ProjectInfo | undefined
  >(project);

  const { data: jobs, mutate: mutateJobs } = api.get<JobInfo[]>(
    `projects/${selectedProject?.id}/jobs/`
  );

  const handlePushToCCP4i2 = useCallback(async () => {
    console.log({ molNo });
    // Implement your push logic here
    if (selectedProject) {
      // e.g. api.pushToCCP4i2(selectedProject)
      console.log("Pushing to CCP4i2:", selectedProject);
      const result = await api.post<CreateTaskResponse>(
        `projects/${selectedProject.id}/create_task/`,
        {
          task_name: "coordinate_selector",
        }
      );
      console.log({ result });
      mutateJobs();
      /*
      const modelCoords =
        item.type === "molecule"
          ? await (item as moorhen.Molecule).getAtoms()
          : null;
      console.log(modelCoords);
      const formData = new FormData();

      formData.append("objectPath", item._objectPath);
      formData.append(
        "file",
        new Blob([fileBuffer as string], {
          type: item._qualifiers.mimeTypeName,
        }),
        selectedFiles[0].name
      );

      const uploadResult = await api.post<any>(
        `jobs/${job.id}/upload_file_param`,
        formData
      );
      */
    }
  }, [selectedProject, molNo]);

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
