import {
  Autocomplete,
  AutocompleteChangeReason,
  Avatar,
  Button,
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
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { FileMenuContext } from "../../file-context-menu";
import { Menu } from "@mui/icons-material";

export const inverseFileTypeMapping: { [key: string]: string } = {
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
  CGenericReflDataFile: "application/CCP4-generic-reflections",
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
  const {
    getTaskItem,
    setParameter,
    getValidationColor,
    fileItemToParameterArg,
    mutateContainer,
  } = useJob(job.id);
  const { item } = getTaskItem(itemName);

  const { isOver, setNodeRef } = useDroppable({
    id: `job_${job.uuid}_${itemName}`,
    data: { job, item },
  });

  const { active } = useDndContext();

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

  const { data: project_files, mutate: mutateFiles } = api.get_endpoint<
    CCP4i2File[]
  >({
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
      return inverseFileTypeMapping[item?._class];
    }
    return null;
  }, [item]);

  const isValidDrop = useMemo(() => {
    if (!active?.data?.current?.file) return false;
    if (!item) return false;
    if (job?.status !== 1) return false;
    return (active.data.current?.file as CCP4i2File).type === fileType;
  }, [active, item, job]);

  if (!project_files || !project_jobs) return <LinearProgress />;

  const fileOptions = useMemo<CCP4i2File[] | null>(() => {
    return project_files
      .filter((file: CCP4i2File) => {
        const fileJob: Job | undefined = project_jobs?.find(
          (job: Job) => job.id == file.job
        );
        //console.log(file.type, fileType);
        if (fileJob)
          return (
            (file.type === fileType ||
              fileType === "CCP4-data" ||
              (file.type === "application/CCP4-generic-reflections" &&
                fileType === "application/CCP4-mtz-observed")) &&
            !fileJob.parent
          );
        return (
          file.type === fileType ||
          fileType === "CCP4-data" ||
          (file.type === "application/CCP4-generic-reflections" &&
            fileType === "application/CCP4-mtz-observed")
        );
      })
      .sort((a, b) => {
        return b.job - a.job;
      });
  }, [project_files, project_jobs, fileType]);

  const { setFileMenuAnchorEl, setFile } = useContext(FileMenuContext);

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
      let setParameterArg: any = {};
      if (!objectPath || !projects) return;
      if (reason === "clear" || value === nullFile) {
        setParameterArg.value = null;
        setParameterArg.object_path = objectPath;
        setValue(nullFile);
      } else if (value) {
        setValue(value);
        setParameterArg = fileItemToParameterArg(
          value,
          objectPath,
          project_jobs,
          projects
        );
      }
      setInFlight(true);
      await setParameter(setParameterArg);
      mutateDigest();
      mutateContainer();
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

  const disabled = useMemo(() => {
    if (!props.disabled) return inFlight || job.status !== 1;
    if (typeof props.disabled === "function") {
      return props.disabled() || inFlight || job.status !== 1;
    }
    return props.disabled || inFlight || job.status !== 1;
  }, [props.disabled]);

  return (
    inferredVisibility && (
      <Stack
        ref={setNodeRef}
        direction="row"
        sx={{
          border: "3px solid",
          borderColor: getValidationColor(item),
          backgroundColor: isOver
            ? isValidDrop
              ? "success.light"
              : "error.light"
            : "background.paper",
          borderRadius: "0.5rem",
          mx: 2,
          my: 1,
        }}
      >
        <Avatar
          src={`/api/proxy/djangostatic/qticons/${item._class.slice(1)}.png`}
        />
        <Autocomplete
          disabled={disabled}
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
        <Stack direction="row">
          {job.status == 1 && (
            <InputFileUpload
              sx={{
                my: 1,
                borderRadius: "0",
                "&:first-of-type": {
                  borderTopLeftRadius: "0.5rem",
                  borderBottomLeftRadius: "0.5rem",
                },
                "&:last-of-type": {
                  borderTopRightRadius: "0.5rem",
                  borderBottomRightRadius: "0.5rem",
                },
              }}
              disabled={disabled}
              accept={item._qualifiers.fileExtensions
                .map((ext: string) => `.${ext}`)
                .join(",")}
              handleFileChange={handleFileChange}
            />
          )}
          {item?._qualifiers?.downloadModes?.length > 0 && job.status == 1 && (
            <InputFileFetch
              sx={{
                my: 1,
                borderRadius: "0",
                "&:first-of-type": {
                  borderTopLeftRadius: "0.5rem",
                  borderBottomLeftRadius: "0.5rem",
                },
                "&:last-of-type": {
                  borderTopRightRadius: "0.5rem",
                  borderBottomRightRadius: "0.5rem",
                },
              }}
              disabled={disabled}
              accept={item._qualifiers.fileExtensions
                .map((ext: string) => `.${ext}`)
                .join(",")}
              handleFileChange={handleFileChange}
              item={item}
            />
          )}
          {value && value != nullFile && (
            <>
              <Button
                disabled={false}
                component="label"
                role={undefined}
                variant="outlined"
                tabIndex={-1}
                size="small"
                startIcon={<Menu fontSize="small" />}
                sx={{
                  my: 1,
                  borderRadius: "0",
                  "&:first-of-type": {
                    borderTopLeftRadius: "0.5rem",
                    borderBottomLeftRadius: "0.5rem",
                  },
                  "&:last-of-type": {
                    borderTopRightRadius: "0.5rem",
                    borderBottomRightRadius: "0.5rem",
                  },
                }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  ev.preventDefault();
                  setFileMenuAnchorEl(ev.currentTarget);
                  setFile(value);
                }}
              ></Button>
            </>
          )}
        </Stack>
        <ErrorTrigger {...{ item, job }} />
      </Stack>
    )
  );
};
