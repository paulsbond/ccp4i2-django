import {
  Autocomplete,
  AutocompleteChangeReason,
  Avatar,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useApi } from "../../../api";
import { CCP4i2TaskElementProps, errorInValidation } from "./task-element";
import { File, Job, Project } from "../../../models";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { green, red, yellow } from "@mui/material/colors";

const fileTypeMapping: { [key: string]: string } = {
  CObsDataFile: "application/CCP4-mtz-observed",
  CFreeRDataFile: "application/CCP4-mtz-freerflag",
  CMapCoeffsDataFile: "application/CCP4-mtz-map",
  CPhsDataFile: "application/CCP4-mtz-phases",
  CDictDataFile: "application/refmac-dictionary",
  CCootHistoryDataFile: "application/coot-script",
  CUnmergedDataFile: "application/CCP4-unmerged-experimental",
  CPdbDataFile: "chemical/x-pdb",
  CAsuDataFile: "application/CCP4-asu-content",
};

export const CDataFileElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { job, sx, item } = props;
  const api = useApi();
  const { mutate } = api.container<any>(`jobs/${job.id}/container`);
  const { mutate: mutateParams } = api.get<any>(`jobs/${job.id}/container`);

  useEffect(() => {
    setValue(item._value);
  }, [item]);

  const { objectPath, qualifiers } = useMemo<{
    objectPath: string | null;
    qualifiers: any | null;
  }>(() => {
    if (item)
      return { objectPath: item._objectPath, qualifiers: item._qualifiers };
    return { objectPath: null, qualifiers: null };
  }, [item]);
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

  const { data: validation, mutate: mutateValidation } = api.container<any>(
    `jobs/${props.job.id}/validation`
  );
  const { mutate: mutateContent } = api.digest<any>(
    `jobs/${props.job.id}/digest?object_path=${objectPath}`
  );

  const fileType = useMemo<string | null>(() => {
    if (item?._class) {
      return fileTypeMapping[item?._class];
    }
    return null;
  }, [item]);

  if (!project_files || !project_jobs) return <LinearProgress />;

  const fileOptions = useMemo<any | null>(() => {
    return project_files.filter((file: File) => {
      const fileJob: Job | undefined = project_jobs?.find(
        (job: Job) => job.id == file.job
      );
      if (fileJob) return file.type === fileType && !fileJob.parent;
      return file.type === fileType;
    });
  }, [project_files, project_jobs, fileType]);

  useEffect(() => {
    if (objectPath && fileOptions && item) {
      const result = item._value;
      if (
        result &&
        result.dbFileId &&
        result.dbFileId._value &&
        result.dbFileId._value.trim().length > 0
      ) {
        const chosenOption = fileOptions.find((file: File) => {
          const dehyphentatedUUID = file.uuid.replace(/-/g, "");
          const dehyphentatedDbFileId = result.dbFileId._value.replace(
            /-/g,
            ""
          );
          return dehyphentatedUUID === dehyphentatedDbFileId;
        });
        setValue(chosenOption);
        return;
      }
    }
    setValue(null);
  }, [objectPath, fileOptions, item]);

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
      await mutate();
      await mutateParams();
      await mutateValidation();
      await mutateContent();
      setInFlight(false);
    },
    [job, objectPath, project_jobs, projects]
  );

  const getOptionLabel = useCallback(
    (option: File) => {
      const fileJob: Job | undefined = project_jobs?.find(
        (job: Job) => job.id == option.job
      );
      if (fileJob) return `${fileJob.number}: ${option.annotation}`;
      return `${option.annotation}`;
    },
    [project_jobs]
  );

  const fieldError = useMemo(() => {
    return errorInValidation(item._objectPath, validation);
  }, [item, validation]);

  return (
    <Stack
      direction="row"
      sx={{
        border: "1px solid black",
        borderRadius: "0.5rem",
        mx: 2,
        backgroundColor: !fieldError
          ? green[100]
          : fieldError.severity.includes("WARNING")
          ? yellow[100]
          : red[100],
      }}
    >
      <Avatar sx={{ mt: 3 }} src={`/qticons/${item._class.slice(1)}.png`} />
      <Autocomplete
        disabled={job.status !== 1}
        sx={sx}
        value={value}
        onChange={handleSelect}
        options={fileOptions || []}
        getOptionLabel={getOptionLabel}
        getOptionKey={(option) => `${option.uuid}`}
        renderInput={(params) => <TextField {...params} label={guiLabel} />}
        title={objectPath || item._className || "Title"}
      />
      {fieldError && <Typography>{fieldError.description}</Typography>}
      <CircularProgress
        sx={{ height: "2rem", width: "2rem", mt: "1.5rem" }}
        variant={inFlight ? "indeterminate" : "determinate"}
        value={100}
      />
    </Stack>
  );

  return;
};
