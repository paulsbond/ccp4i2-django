import {
  Autocomplete,
  AutocompleteChangeReason,
  Avatar,
  Button,
  ClickAwayListener,
  LinearProgress,
  Popper,
  Stack,
  styled,
  SxProps,
  TextField,
  Typography,
} from "@mui/material";
import { useApi } from "../../../api";
import { CCP4i2TaskElementProps } from "./task-element";
import { File as CCP4i2File, Job, Project } from "../../../models";
import { CDataFile } from "../../../cdata_types";
import {
  ReactNode,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Folder } from "@mui/icons-material";
import { readFilePromise, useJob } from "../../../utils";
import { ErrorInfo } from "./error-info";

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

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface InputFileUploadProps {
  handleFileChange: (files: FileList | null) => void;
  disabled: boolean;
  accept: string;
  sx?: SxProps;
}
export const InputFileUpload: React.FC<InputFileUploadProps> = ({
  handleFileChange,
  disabled,
  accept,
  sx,
}) => {
  return (
    <Button
      disabled={disabled}
      component="label"
      role={undefined}
      variant="outlined"
      tabIndex={-1}
      size="small"
      startIcon={<Folder />}
      sx={sx}
    >
      <VisuallyHiddenInput
        disabled={disabled}
        type="file"
        onChange={(event) => {
          handleFileChange(event.target.files);
        }}
        accept={accept}
        sx={sx}
      />
    </Button>
  );
};

export interface CCP4i2DataFileElementProps extends CCP4i2TaskElementProps {
  setFileContent?: (fileContent: ArrayBuffer | null | string | File) => void;
  setFiles?: (files: FileList | null) => void;
  infoContent?: ReactNode;
}
export const CDataFileElement: React.FC<CCP4i2DataFileElementProps> = (
  props
) => {
  const { job, sx, infoContent, itemName } = props;
  const api = useApi();
  const { getTaskItem, setParameter, getValidationColor } = useJob(job.id);
  const item = getTaskItem(itemName);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [validationAnchor, setValidationAnchor] = useState<HTMLElement | null>(
    null
  );
  const validationOpen = Boolean(validationAnchor);
  const progressRef = useRef<HTMLElement | null>(null);
  const { mutate: mutateDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item._objectPath}`
  );

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

  const { data: project_files, mutate: mutateFiles } = api.get<CCP4i2File[]>(
    `projects/${job.project}/files`
  );

  const { data: project_jobs, mutate: mutateJobs } = api.get<Job[]>(
    `projects/${job.project}/jobs`
  );
  const { data: projects, mutate: mutateProjects } =
    api.get<Project[]>(`projects`);

  const fileType = useMemo<string | null>(() => {
    if (item?._class) {
      return fileTypeMapping[item?._class];
    }
    return null;
  }, [item]);

  if (!project_files || !project_jobs) return <LinearProgress />;

  const fileOptions = useMemo<CCP4i2File[] | null>(() => {
    return project_files.filter((file: CCP4i2File) => {
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
        const chosenOption = fileOptions.find((file: CCP4i2File) => {
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
      value: CCP4i2File | null,
      reason: AutocompleteChangeReason
    ) => {
      const setParameterArg: any = {
        object_path: objectPath,
      };
      if (reason === "clear") {
        setParameterArg.value = null;
      } else if (value) {
        setValue(value);
        const newFile: CDataFile = {
          dbFileId: value.uuid.replace(/-/g, ""),
          subType: value.sub_type,
          contentFlag: value.content,
          annotation: value.annotation,
          baseName: value.name,
          relPath: "",
          project: 0,
        };
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
      await setParameter(setParameterArg);
      mutateDigest();
      setInFlight(false);
    },
    [job, objectPath, project_jobs, projects]
  );

  const getOptionLabel = useCallback(
    (option: CCP4i2File) => {
      const fileJob: Job | undefined = project_jobs?.find(
        (job: Job) => job.id == option.job
      );
      if (fileJob) return `${fileJob.number}: ${option.annotation}`;
      return `${option.annotation}`;
    },
    [project_jobs]
  );

  const defaultSetFile = (files: FileList | null) => {};

  return (
    <Stack
      direction="row"
      sx={{
        border: "3px solid",
        borderColor: getValidationColor(item),
        borderRadius: "0.5rem",
        mx: 2,
        my: 1,
      }}
    >
      <Avatar src={`/qticons/${item._class.slice(1)}.png`} />
      <Autocomplete
        disabled={inFlight || job.status !== 1}
        sx={{ m: 1, width: "80rem", maxWidth: "80rem", ...sx }}
        size="small"
        value={value}
        onChange={handleSelect}
        options={fileOptions || []}
        getOptionLabel={getOptionLabel}
        getOptionKey={(option) => `${option.uuid}`}
        renderInput={(params) => (
          <TextField {...params} label={guiLabel} size="small" />
        )}
        title={objectPath || item._className || "Title"}
      />
      <InputFileUpload
        sx={{ my: 1, mr: 2 }}
        disabled={inFlight || job.status !== 1}
        accept={item._qualifiers.fileExtensions
          .map((ext: string) => `.${ext}`)
          .join(",")}
        handleFileChange={props.setFiles || defaultSetFile}
      />
      <ErrorInfo {...props}>{infoContent}</ErrorInfo>
      <LinearProgress
        ref={progressRef}
        sx={{ height: "2rem", width: "4rem", mt: 1.5 }}
        variant={inFlight ? "indeterminate" : "determinate"}
        value={0}
      />
    </Stack>
  );
  return;
};
