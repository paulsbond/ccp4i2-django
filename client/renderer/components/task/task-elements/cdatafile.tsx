import React, {
  ChangeEvent,
  PropsWithChildren,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Autocomplete,
  AutocompleteChangeReason,
  Avatar,
  Button,
  Collapse,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useDndContext, useDroppable } from "@dnd-kit/core";

import { useApi } from "../../../api";
import { useJob } from "../../../utils";
import { CCP4i2TaskElementProps } from "./task-element";
import {
  File as CCP4i2File,
  Job,
  nullFile,
  Project,
} from "../../../types/models";
import { TaskInterfaceContext } from "../../../providers/task-container";
import { FileMenuContext } from "../../../providers/file-context-menu";
import { ErrorTrigger } from "./error-info";
import { InputFileFetch } from "./input-file-fetch";
import { InputFileUpload } from "./input-file-upload";

const BORDER_RADIUS_STYLES = {
  none: { borderRadius: 0 },
  left: {
    borderTopLeftRadius: "0.5rem",
    borderBottomLeftRadius: "0.5rem",
  },
  right: {
    borderTopRightRadius: "0.5rem",
    borderBottomRightRadius: "0.5rem",
  },
  full: { borderRadius: "0.5rem" },
} as const;

// Types
export interface CCP4i2DataFileElementProps
  extends CCP4i2TaskElementProps,
    PropsWithChildren {
  setFileContent?: (fileContent: ArrayBuffer | string | File | null) => void;
  setFiles?: (files: FileList | null) => void;
  infoContent?: ReactNode;
  onChange?: (updatedItem: any) => void;
  hasValidationError?: boolean; // Add this new optional prop
}

interface FileTypeConfig {
  allowedTypes: string[] | null;
  acceptedExtensions: string;
}

// Custom hooks
const useFileConfiguration = (item: any, qualifiers: any): FileTypeConfig => {
  return useMemo(() => {
    if (!qualifiers?.mimeTypeName) {
      return { allowedTypes: null, acceptedExtensions: "" };
    }

    const allowedTypes = Array.isArray(qualifiers.mimeTypeName)
      ? qualifiers.mimeTypeName
      : [qualifiers.mimeTypeName];

    const acceptedExtensions =
      qualifiers?.fileExtensions?.map((ext: string) => `.${ext}`).join(",") ||
      "";

    return { allowedTypes, acceptedExtensions };
  }, [qualifiers]);
};

const useFilteredFileOptions = (
  projectFiles: CCP4i2File[] | undefined,
  projectJobs: Job[] | undefined,
  allowedTypes: string[] | null
): CCP4i2File[] => {
  return useMemo(() => {
    if (!projectFiles || !allowedTypes) return [];

    return projectFiles
      .filter((file) => {
        const fileJob = projectJobs?.find((job) => job.id === file.job);
        const isValidType =
          allowedTypes.includes(file.type) || allowedTypes.includes("Unknown");
        const isNotParentJob = fileJob ? !fileJob.parent : true;

        return isValidType && isNotParentJob;
      })
      .sort((a, b) => b.job - a.job);
  }, [projectFiles, projectJobs, allowedTypes]);
};

const useCurrentValue = (
  item: any,
  fileOptions: CCP4i2File[],
  objectPath: string | null
): [CCP4i2File, React.Dispatch<React.SetStateAction<CCP4i2File>>] => {
  const [value, setValue] = useState<CCP4i2File>(nullFile);

  useEffect(() => {
    if (!objectPath || !fileOptions || !item) return;

    const dbFileId = item._value?.dbFileId?._value?.trim();
    if (!dbFileId) {
      setValue(nullFile);
      return;
    }

    const selectedFile = fileOptions.find((file) => {
      const normalizedFileUuid = file.uuid.replace(/-/g, "");
      const normalizedDbFileId = dbFileId.replace(/-/g, "");
      return normalizedFileUuid === normalizedDbFileId;
    });

    setValue(selectedFile || nullFile);
  }, [objectPath, fileOptions, item]);

  return [value, setValue];
};

const useCollapsibleState = (
  hasChildren: boolean,
  forceExpanded: boolean = false
) => {
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    // Don't allow collapsing if forceExpanded is true
    if (!forceExpanded) {
      setIsManuallyExpanded((prev) => !prev);
    }
  }, [forceExpanded]);

  // Reset when children disappear
  useEffect(() => {
    if (!hasChildren) {
      setIsManuallyExpanded(false);
    }
  }, [hasChildren]);

  // The actual expanded state is either forced or manually set
  const isExpanded = forceExpanded || isManuallyExpanded;

  return {
    isExpanded,
    handleToggle,
  };
};

// Main component
export const CDataFileElement: React.FC<CCP4i2DataFileElementProps> = ({
  job,
  sx,
  itemName,
  onChange,
  setFiles,
  children,
  visibility,
  disabled: disabledProp,
  qualifiers: propsQualifiers,
  hasValidationError: overrideValidationError, // Destructure the new prop
}) => {
  const api = useApi();
  const {
    getTaskItem,
    setParameter,
    getValidationColor,
    fileItemToParameterArg,
    mutateContainer,
  } = useJob(job.id);

  const { item } = getTaskItem(itemName);
  const { inFlight, setInFlight } = useContext(TaskInterfaceContext);
  const { setFileMenuAnchorEl, setFile } = useContext(FileMenuContext);

  // Merge qualifiers
  const qualifiers = useMemo(() => {
    return item?._qualifiers
      ? { ...item._qualifiers, ...propsQualifiers }
      : propsQualifiers || null;
  }, [item?._qualifiers, propsQualifiers]);

  // Data fetching
  const { data: projectFiles, mutate: mutateFiles } = api.get_endpoint<
    CCP4i2File[]
  >({
    type: "projects",
    id: job.project,
    endpoint: "files",
  });

  const { data: projectJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job.project,
    endpoint: "jobs",
  });

  const { data: projects } = api.get<Project[]>("projects");

  const { mutate: mutateDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item?._objectPath}`
  );

  // Configuration and options
  const { allowedTypes, acceptedExtensions } = useFileConfiguration(
    item,
    qualifiers
  );
  const fileOptions = useFilteredFileOptions(
    projectFiles,
    projectJobs,
    allowedTypes
  );
  const [value, setValue] = useCurrentValue(
    item,
    fileOptions,
    item?._objectPath || null
  );

  // Get validation color and determine if there's an error
  const borderColor = getValidationColor(item);
  const computedValidationError = useMemo(() => {
    const hasError = borderColor === "error.light";
    // Add some debugging
    console.log(`CDataFileElement ${itemName}:`, {
      borderColor,
      hasError,
      itemPath: item?._objectPath,
      overrideValidationError,
    });
    return hasError;
  }, [borderColor, itemName, item?._objectPath, overrideValidationError]);

  // Use override if provided, otherwise use computed value
  const hasValidationError = useMemo(() => {
    return overrideValidationError !== undefined
      ? overrideValidationError
      : computedValidationError;
  }, [overrideValidationError, computedValidationError]);

  // Children state - pass the validation error state
  const hasChildren = useMemo(() => {
    return React.Children.count(children) > 0;
  }, [children]);

  const { isExpanded, handleToggle } = useCollapsibleState(
    hasChildren,
    hasValidationError
  );

  // Add debugging for the collapsible state
  console.log(`CDataFileElement ${itemName} collapsible:`, {
    hasChildren,
    hasValidationError,
    overrideValidationError,
    computedValidationError,
    isExpanded,
  });

  // Drag and drop setup
  const { isOver, setNodeRef } = useDroppable({
    id: `job_${job.uuid}_${itemName}`,
    data: { job, item },
  });

  const { active } = useDndContext();

  // Computed values
  const isValidDrop = useMemo(() => {
    if (!active?.data?.current?.file || !item || job.status !== 1) return false;
    const activeFile = active.data.current.file as CCP4i2File;
    return allowedTypes?.includes(activeFile.type) || false;
  }, [active, item, job.status, allowedTypes]);

  const guiLabel = useMemo(() => {
    return qualifiers?.guiLabel || item?._objectPath?.split(".").at(-1) || "";
  }, [qualifiers?.guiLabel, item?._objectPath]);

  const isDisabled = useMemo(() => {
    if (typeof disabledProp === "function") {
      return disabledProp() || inFlight || job.status !== 1;
    }
    return disabledProp || inFlight || job.status !== 1;
  }, [disabledProp, inFlight, job.status]);

  const isVisible = useMemo(() => {
    if (typeof visibility === "function") return visibility();
    return visibility !== false;
  }, [visibility]);

  // Event handlers
  const handleFileSelect = useCallback(
    async (
      event: SyntheticEvent<Element, Event>,
      selectedFile: CCP4i2File | null,
      reason: AutocompleteChangeReason
    ) => {
      const objectPath = item?._objectPath;
      if (!objectPath || !projects) return;

      let parameterArg: any = {};

      if (reason === "clear" || selectedFile === nullFile) {
        parameterArg = { value: null, object_path: objectPath };
        setValue(nullFile);
      } else if (selectedFile) {
        setValue(selectedFile);
        parameterArg = fileItemToParameterArg(
          selectedFile,
          objectPath,
          projectJobs || [],
          projects
        );
      }

      setInFlight(true);
      try {
        const result = await setParameter(parameterArg);
        if (result?.status === "Success" && onChange) {
          onChange(result.updated_item);
        }
      } catch (error) {
        console.error("Error setting parameter:", error);
        alert(`Error: ${error}`);
      } finally {
        setInFlight(false);
        mutateDigest();
        mutateContainer();
      }
    },
    [
      item?._objectPath,
      projects,
      projectJobs,
      fileItemToParameterArg,
      setParameter,
      onChange,
      setInFlight,
      mutateDigest,
      mutateContainer,
    ]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFiles?.(event.currentTarget.files);
    },
    [setFiles]
  );

  const handleMenuClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
      setFileMenuAnchorEl(event.currentTarget);
      setFile(value);
    },
    [setFileMenuAnchorEl, setFile, value]
  );

  const getOptionLabel = useCallback(
    (option: CCP4i2File) => {
      const fileJob = projectJobs?.find((job) => job.id === option.job);
      return fileJob
        ? `${fileJob.number}: ${option.annotation}`
        : option.annotation;
    },
    [projectJobs]
  );

  const getOptionKey = useCallback((option: CCP4i2File) => option.uuid, []);

  // Loading state
  if (!projectFiles || !projectJobs) {
    return <LinearProgress />;
  }

  // Visibility check
  if (!isVisible) {
    return null;
  }

  const backgroundColor = isOver
    ? isValidDrop
      ? "success.light"
      : "error.light"
    : "background.paper";

  const showMenuButton = value && value !== nullFile;
  const canUpload = job.status === 1;
  const canFetch = qualifiers?.downloadModes?.length > 0 && job.status === 1;

  return (
    <Stack
      sx={{
        border: "3px solid",
        borderColor,
        backgroundColor,
        borderRadius: "0.5rem",
        mx: 2,
        my: 1,
      }}
      direction="column"
    >
      <Stack ref={setNodeRef} direction="row" alignItems="center">
        <Avatar
          src={`/api/proxy/djangostatic/qticons/${item?._class?.slice(1)}.png`}
          alt={item?._class || "File type"}
        />

        <Autocomplete
          disabled={isDisabled}
          sx={{ m: 1, width: "80rem", maxWidth: "80rem", ...sx }}
          size="small"
          value={value}
          onChange={handleFileSelect}
          options={[...fileOptions, nullFile]}
          getOptionLabel={getOptionLabel}
          getOptionKey={getOptionKey}
          freeSolo={false}
          renderInput={(params) => (
            <TextField
              {...params}
              error={borderColor === "error.light"}
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
          title={item?._objectPath || item?._className || "File selector"}
        />

        <Stack direction="row">
          {canUpload && (
            <InputFileUpload
              sx={{
                my: 2,
                ...BORDER_RADIUS_STYLES.none,
                "&:first-of-type": BORDER_RADIUS_STYLES.left,
                "&:last-of-type": BORDER_RADIUS_STYLES.right,
              }}
              disabled={isDisabled}
              accept={acceptedExtensions}
              handleFileChange={handleFileChange}
            />
          )}

          {canFetch && (
            <InputFileFetch
              sx={{
                my: 2,
                ...BORDER_RADIUS_STYLES.none,
                "&:first-of-type": BORDER_RADIUS_STYLES.left,
                "&:last-of-type": BORDER_RADIUS_STYLES.right,
              }}
              disabled={isDisabled}
              modes={qualifiers.downloadModes}
              handleFileChange={handleFileChange}
              onChange={onChange}
              item={item}
            />
          )}

          {showMenuButton && (
            <Button
              disabled={false}
              role="button"
              variant="outlined"
              tabIndex={-1}
              size="small"
              startIcon={<MenuIcon fontSize="small" />}
              sx={{
                my: 2,
                ...BORDER_RADIUS_STYLES.none,
                "&:first-of-type": BORDER_RADIUS_STYLES.left,
                "&:last-of-type": BORDER_RADIUS_STYLES.right,
              }}
              onClick={handleMenuClick}
              aria-label="Open file menu"
            />
          )}
        </Stack>

        {hasChildren && (
          <IconButton
            onClick={handleToggle}
            size="small"
            disabled={hasValidationError} // Disable toggle when there's an error
            sx={{
              ml: 1,
              transition: "transform 0.2s ease-in-out",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              opacity: hasValidationError ? 0.6 : 1, // Visual indication when disabled
            }}
            aria-label={
              hasValidationError
                ? "Options expanded due to validation error"
                : isExpanded
                ? "Collapse options"
                : "Expand options"
            }
          >
            {isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </IconButton>
        )}

        <ErrorTrigger item={item} job={job} />
      </Stack>

      {hasChildren && (
        <Collapse in={isExpanded} timeout={200}>
          <Stack
            sx={{
              px: 2,
              pb: 1,
              pt: 0,
              backgroundColor: hasValidationError ? "error.lighter" : "grey.50", // Different background for errors
              borderTop: "1px solid",
              borderTopColor: hasValidationError ? "error.light" : "divider",
              borderBottomLeftRadius: "0.4rem",
              borderBottomRightRadius: "0.4rem",
            }}
            spacing={0.5}
          >
            <Typography
              variant="caption"
              color={hasValidationError ? "error.main" : "text.secondary"}
              sx={{
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                mb: 0.5,
              }}
            >
              {hasValidationError
                ? "Required Options (Error)"
                : "Additional Options"}
            </Typography>
            {children}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
};
