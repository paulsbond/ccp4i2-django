import {
  Autocomplete,
  AutocompleteChangeReason,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
} from "@mui/material";
import { useApi } from "../../../api";
import { CCP4i2TaskElementProps } from "./task-element";
import { File, Job, Project } from "../../../models";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { valueOfItemPath } from "../task-utils";

export const CPdbDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { sx, qualifiers, objectPath, job } = props;
  const [inFlight, setInFlight] = useState(false);
  const [value, setValue] = useState<any | null>(null);

  const { data: project_files, mutate: mutateFiles } = api.get<File[]>(
    `projects/${job.project}/files`
  );
  const { data: project_jobs, mutate: mutateJobs } = api.get<Job[]>(
    `projects/${job.project}/jobs`
  );
  const { data: projects, mutate: mutateProjects } =
    api.get<Project[]>(`projects`);
  const { data: params_xml, mutate: mutateParams } = api.get<{
    status: string;
    params_xml: string;
  }>(`jobs/${props.job.id}/params_xml`);

  const paramsXML = params_xml?.params_xml
    ? $($.parseXML(params_xml?.params_xml))
    : $();

  if (!project_files) return <LinearProgress />;

  const fileOptions = project_files.filter(
    (file: File) => file.type === "chemical/x-pdb"
  );

  useEffect(() => {
    if (objectPath && paramsXML && fileOptions) {
      const result = valueOfItemPath(
        objectPath.split(".").slice(1).join("."),
        paramsXML
      );
      console.log(objectPath, result);
      if (result && result.dbFileId && result.dbFileId.trim().length > 0) {
        const chosenOption = fileOptions.find((file: File) => {
          const dehyphentatedUUID = file.uuid.replace(/-/g, "");
          const dehyphentatedDbFileId = result.dbFileId.replace(/-/g, "");
          return dehyphentatedUUID === dehyphentatedDbFileId;
        });
        console.log({ result, chosenOption });
        setValue(chosenOption);
        return;
      }
    }
    setValue(null);
  }, [paramsXML, objectPath, fileOptions]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  const handleSelect = useCallback(
    async (
      event: SyntheticEvent<Element, Event>,
      value: File | null,
      reason: AutocompleteChangeReason
    ) => {
      const setParameterArg: any = {
        object_path: objectPath,
      };
      if (reason === "clear") {
        setParameterArg.value = null;
      } else if (value) {
        setValue(value);
        setParameterArg.value = {
          dbFileId: value.uuid.replace(/-/g, ""),
          subType: value.sub_type,
          contentFlag: value.content,
          annotation: value.annotation,
          baseName: value.name,
        };
        let project: string | null = null;
        if (value.directory == 2) {
          setParameterArg.value.relPath = "CCP4_IMPORTED_FILES";
        }
        if (job && project_jobs) {
          const job_of_file = project_jobs?.find((the_job: Job) => {
            return the_job.id === value.job;
          });
          if (job_of_file) {
            if (value.directory == 1) {
              const jobDir = job_of_file.number
                .split(".")
                .map((ele: string) => `job_${ele}`)
                .join("/");
              setParameterArg.value.relPath = `CCP4_JOBS/${jobDir}`;
            }
            if (projects) {
              const project = projects?.find((the_project: Project) => {
                return the_project.id === job_of_file.project;
              });
              if (project) {
                setParameterArg.value.project = project.uuid.replace(/-/g, "");
              }
            }
          }
        }
      }
      setInFlight(true);
      await api.post<Job>(`jobs/${job.id}/set_parameter`, setParameterArg);
      await mutateParams();
      setInFlight(false);
    },
    [job, objectPath, project_jobs, projects]
  );

  return (
    <Stack direction="row">
      <Autocomplete
        disabled={job.status !== 1}
        sx={sx}
        value={value}
        onChange={handleSelect}
        options={fileOptions || []}
        getOptionLabel={(option) => `${option.annotation}`}
        getOptionKey={(option) => `${option.uuid}`}
        renderInput={(params) => <TextField {...params} label={guiLabel} />}
        title={objectPath || "CPdbDataFile"}
      />

      <CircularProgress
        sx={{ height: "2rem", width: "2rem", mt: "1.25rem" }}
        variant={inFlight ? "indeterminate" : "determinate"}
        value={100}
      />
    </Stack>
  );

  return;
};
