import {
  Autocomplete,
  AutocompleteChangeReason,
  Avatar,
  LinearProgress,
  Stack,
  TextField,
} from "@mui/material";
import { useApi } from "../../../api";
import { CCP4i2TaskElementProps } from "./task-element";
import { File as CCP4i2File, Job, nullFile, Project } from "../../../models";
import {
  ChangeEvent,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useJob } from "../../../utils";
import { ErrorTrigger } from "./error-info";
import { TaskInterfaceContext } from "../task-container";
import { InputFileFetch } from "./input-file-fetch";
import { InputFileUpload } from "./input-file-upload";

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
  CDataFile: "application/CCP4-data",
};

export interface CCP4i2DataFileElementProps extends CCP4i2TaskElementProps {
  setFileContent?: (fileContent: ArrayBuffer | null | string | File) => void;
  setFiles?: (files: FileList | null) => void;
  infoContent?: ReactNode;
}
export const CDataFileElement: React.FC<CCP4i2DataFileElementProps> = (
  props
) => {
  const { job, sx, itemName } = props;
  const api = useApi();
  const { getTaskItem, setParameter, getValidationColor } = useJob(job.id);
  const item = getTaskItem(itemName);
  const { inFlight, setInFlight } = useContext(TaskInterfaceContext);

  const [value, setValue] = useState<CCP4i2File>(nullFile);

  const { objectPath, qualifiers } = useMemo<{
    objectPath: string | null;
    qualifiers: any | null;
  }>(() => {
    if (item)
      return { objectPath: item._objectPath, qualifiers: item._qualifiers };
    return { objectPath: null, qualifiers: null };
  }, [item]);

  const { data: project_files } = api.get_endpoint<CCP4i2File[]>({
    type: "projects",
    id: job.project,
    endpoint: "files",
  });

  const { data: project_jobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job.project,
    endpoint: "jobs",
  });
  const { data: projects } = api.get<Project[]>("projects");
  const { mutate: mutateDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item._objectPath}`
  );

  const fileType = useMemo<string | null>(() => {
    if (item?._class) {
      return fileTypeMapping[item?._class];
    }
    return null;
  }, [item]);

  if (!project_files || !project_jobs) return <LinearProgress />;

  const fileOptions = useMemo<CCP4i2File[] | null>(() => {
    return project_files
      .filter((file: CCP4i2File) => {
        const fileJob: Job | undefined = project_jobs?.find(
          (job: Job) => job.id == file.job
        );
        if (fileJob)
          return (
            (file.type === fileType || fileType === "CCP4-data") &&
            !fileJob.parent
          );
        return file.type === fileType || fileType === "CCP4-data";
      })
      .sort((a, b) => {
        return b.job - a.job;
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
        if (chosenOption) setValue(chosenOption);
        else setValue(nullFile);
      }
      //Here if no dbFileId.  In principle, I think this should not happen
      else setValue(nullFile);
    }
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
      if (reason === "clear" || value === nullFile) {
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

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    if (props.setFiles) props.setFiles(ev.currentTarget.files);
  };

  return (
    inferredVisibility && (
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
          options={fileOptions?.concat([nullFile]) || []}
          getOptionLabel={getOptionLabel}
          getOptionKey={(option) => `${option.uuid}`}
          renderInput={(params) => (
            <TextField
              {...params}
              error={getValidationColor(item) === "error.light"}
              slotProps={{
                inputLabel: {
                  shrink: true,
                  disableAnimation: true,
                },
              }}
              label={guiLabel}
              size="small"
            />
          )}
          title={objectPath || item._className || "Title"}
        />
        <InputFileUpload
          sx={{ my: 1, mr: 2 }}
          disabled={inFlight || job.status !== 1}
          accept={item._qualifiers.fileExtensions
            .map((ext: string) => `.${ext}`)
            .join(",")}
          handleFileChange={handleFileChange}
        />
        {item?._qualifiers?.downloadModes?.length > 0 && (
          <InputFileFetch
            sx={{ my: 1, mr: 2 }}
            disabled={inFlight || job.status !== 1}
            accept={item._qualifiers.fileExtensions
              .map((ext: string) => `.${ext}`)
              .join(",")}
            handleFileChange={handleFileChange}
            item={item}
          />
        )}
        <ErrorTrigger {...{ item, job }} />
      </Stack>
    )
  );
};
