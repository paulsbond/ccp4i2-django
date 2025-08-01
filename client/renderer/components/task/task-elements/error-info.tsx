import React, {
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  ClickAwayListener,
  Collapse,
  LinearProgress,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Info,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";

import { CCP4i2TaskElementProps } from "./task-element";
import { useJob, ValidationError, valueOfItem } from "../../../utils";
import { TaskInterfaceContext } from "../../../providers/task-container";
import { Job } from "../../../types/models";
import { SimpleObjectTable } from "../../simple-object-table";

// Types
interface ErrorTriggerProps {
  item: any;
  job: Job;
}

interface ErrorPopperProps {
  job: Job;
}

interface ValidationMessage {
  path: string;
  messages: string[];
  severity: number;
}

interface ProcessedErrorInfo {
  hasErrors: boolean;
  hasWarnings: boolean;
  messages: ValidationMessage[];
  backgroundColor: string;
  icon: React.ReactNode;
}

// Constants
const VALIDATION_COLORS = {
  SUCCESS: "success.light",
  WARNING: "warning.light",
  ERROR: "error.light",
} as const;

const POPPER_STYLES = {
  zIndex: 1000,
  maxWidth: "40rem",
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  boxShadow: 3,
} as const;

const ERROR_CONTAINER_STYLES = {
  p: 2,
  borderRadius: 1,
  mb: 2,
} as const;

// Custom hooks
const useValidationIcon = (validationColor: string) => {
  return useMemo(() => {
    switch (validationColor) {
      case VALIDATION_COLORS.SUCCESS:
        return <CheckCircle fontSize="small" />;
      case VALIDATION_COLORS.WARNING:
        return <Warning fontSize="small" />;
      case VALIDATION_COLORS.ERROR:
        return <ErrorIcon fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  }, [validationColor]);
};

const useProcessedErrorInfo = (
  item: any,
  fieldErrors: ValidationError[],
  validationColor: string
): ProcessedErrorInfo => {
  return useMemo(() => {
    if (!item || !fieldErrors || fieldErrors.length === 0) {
      return {
        hasErrors: false,
        hasWarnings: false,
        messages: [],
        backgroundColor: VALIDATION_COLORS.SUCCESS,
        icon: <CheckCircle fontSize="small" color="success" />,
      };
    }

    // Process the ValidationError array to extract messages
    const messages: ValidationMessage[] = fieldErrors.map(
      (validationError) => ({
        path: validationError.path,
        messages: validationError.error?.messages || [],
        severity: validationError.error?.maxSeverity || 0,
      })
    );

    const hasErrors = messages.some((msg) => msg.severity >= 2);
    const hasWarnings = messages.some((msg) => msg.severity === 1);

    console.log("Processed validation:", {
      fieldErrors,
      messages,
      hasErrors,
      hasWarnings,
    });

    let backgroundColor: string = VALIDATION_COLORS.SUCCESS;
    let icon = <CheckCircle fontSize="small" color="success" />;

    if (hasErrors) {
      backgroundColor = VALIDATION_COLORS.ERROR;
      icon = <ErrorIcon fontSize="small" color="error" />;
    } else if (hasWarnings) {
      backgroundColor = VALIDATION_COLORS.WARNING;
      icon = <Warning fontSize="small" color="warning" />;
    }

    return {
      hasErrors,
      hasWarnings,
      messages,
      backgroundColor,
      icon,
    };
  }, [item, fieldErrors, validationColor]);
};

const useItemValue = (item: any) => {
  return useMemo(() => {
    if (!item) return null;

    const result = valueOfItem(item);

    if (result === null || result === undefined) {
      return null;
    }

    if (typeof result === "boolean") {
      return { value: result ? "true" : "false" };
    }

    if (typeof result === "object") {
      return result;
    }

    return { value: String(result) };
  }, [item]);
};

const useCollapsibleState = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    toggle,
    close,
    open,
  };
};

// Utility functions
const formatObjectPath = (objectPath: string): string => {
  return objectPath?.split(".").pop() || objectPath || "Unknown item";
};

const getValidationSummary = (messages: ValidationMessage[]): string => {
  const errorCount = messages.filter((msg) => msg.severity >= 2).length;
  const warningCount = messages.filter((msg) => msg.severity === 1).length;

  if (errorCount > 0 && warningCount > 0) {
    return `${errorCount} error(s) and ${warningCount} warning(s)`;
  }

  if (errorCount > 0) {
    return `${errorCount} error(s)`;
  }

  if (warningCount > 0) {
    return `${warningCount} warning(s)`;
  }

  return "No issues";
};

// Component implementations
export const ErrorTrigger: React.FC<ErrorTriggerProps> = ({ item, job }) => {
  const { setErrorInfoAnchor, setErrorInfoItem } =
    useContext(TaskInterfaceContext);
  const { getValidationColor } = useJob(job.id);

  const validationColor = useMemo(
    () => getValidationColor(item),
    [getValidationColor, item]
  );
  const icon = useValidationIcon(validationColor);

  const handleClick = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation();
      event.preventDefault();

      setErrorInfoAnchor(event.currentTarget);
      setErrorInfoItem(item);
    },
    [setErrorInfoAnchor, setErrorInfoItem, item]
  );

  return (
    <Button
      size="small"
      variant="text"
      onClick={handleClick}
      sx={{
        minWidth: "auto",
        p: 0.5,
        color: validationColor,
        "&:hover": {
          backgroundColor: `${validationColor}20`, // 20% opacity
        },
      }}
      aria-label={`Show validation information for ${formatObjectPath(
        item?._objectPath
      )}`}
    >
      {icon}
    </Button>
  );
};

export const ErrorPopper: React.FC<ErrorPopperProps> = ({ job }) => {
  const {
    setErrorInfoAnchor,
    errorInfoAnchor,
    setErrorInfoItem,
    errorInfoItem,
  } = useContext(TaskInterfaceContext);

  const { getValidationColor, getErrors } = useJob(job.id);

  const fieldErrors = useMemo(
    () => (errorInfoItem ? getErrors(errorInfoItem) : null),
    [errorInfoItem, getErrors]
  );

  const validationColor = useMemo(
    () => (errorInfoItem ? getValidationColor(errorInfoItem) : ""),
    [errorInfoItem, getValidationColor]
  );

  const qualifiersState = useCollapsibleState(false);
  const valueState = useCollapsibleState(false);

  const processedErrorInfo = useProcessedErrorInfo(
    errorInfoItem,
    fieldErrors,
    validationColor
  );
  const itemValue = useItemValue(errorInfoItem);

  const handleClickAway = useCallback(
    (event: MouseEvent | TouchEvent) => {
      event.stopPropagation();
      setErrorInfoAnchor(null);
      setErrorInfoItem(null);
    },
    [setErrorInfoAnchor, setErrorInfoItem]
  );

  // Debug logging with useEffect
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("ErrorPopper state:", {
        errorInfoItem: errorInfoItem?._objectPath,
        hasAnchor: Boolean(errorInfoAnchor),
        fieldErrors,
      });
    }
  }, [errorInfoItem, errorInfoAnchor, fieldErrors]);

  const renderValidationMessages = () => {
    if (!processedErrorInfo.hasErrors && !processedErrorInfo.hasWarnings) {
      return (
        <Box
          sx={{
            ...ERROR_CONTAINER_STYLES,
            bgcolor: processedErrorInfo.backgroundColor,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {processedErrorInfo.icon}
            <Typography variant="subtitle2">
              No validation issues for{" "}
              {formatObjectPath(errorInfoItem?._objectPath)}
            </Typography>
          </Stack>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          ...ERROR_CONTAINER_STYLES,
          bgcolor: processedErrorInfo.backgroundColor,
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {processedErrorInfo.icon}
            <Typography variant="subtitle2" fontWeight="medium">
              {getValidationSummary(processedErrorInfo.messages)} in{" "}
              {formatObjectPath(errorInfoItem?._objectPath)}
            </Typography>
          </Stack>

          {processedErrorInfo.messages.map((validationMessage, index) =>
            validationMessage.messages.map((message, messageIndex) => (
              <Typography
                key={`${validationMessage.path}_${index}_${messageIndex}`}
                variant="body2"
                sx={{
                  ml: 3,
                  wordWrap: "break-word",
                  maxWidth: "100%",
                }}
              >
                • {message}
              </Typography>
            ))
          )}
        </Stack>
      </Box>
    );
  };

  const renderQualifiersCard = () => {
    if (!errorInfoItem?._qualifiers) return null;

    return (
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardHeader
          avatar={qualifiersState.isOpen ? <ExpandLess /> : <ExpandMore />}
          title="Item Qualifiers"
          titleTypographyProps={{ variant: "subtitle2" }}
          onClick={qualifiersState.toggle}
          sx={{
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        />
        <Collapse in={qualifiersState.isOpen} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0 }}>
            <SimpleObjectTable object={errorInfoItem._qualifiers} />
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  const renderValueCard = () => {
    if (!itemValue) return null;

    return (
      <Card variant="outlined">
        <CardHeader
          title="Item Value"
          titleTypographyProps={{ variant: "subtitle2" }}
        />
        <CardContent sx={{ pt: 0 }}>
          <SimpleObjectTable object={itemValue} />
        </CardContent>
      </Card>
    );
  };

  if (!errorInfoItem || !errorInfoAnchor) {
    return null;
  }

  return (
    <Popper
      anchorEl={errorInfoAnchor}
      placement="auto-end"
      open={Boolean(errorInfoAnchor)}
      sx={POPPER_STYLES}
      modifiers={[
        {
          name: "preventOverflow",
          options: {
            boundary: "viewport",
          },
        },
      ]}
    >
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {renderValidationMessages()}
            {renderQualifiersCard()}
            {renderValueCard()}
          </Stack>
        </Box>
      </ClickAwayListener>
    </Popper>
  );
};

export const ErrorInfo: React.FC<CCP4i2TaskElementProps> = () => {
  return (
    <LinearProgress
      variant="indeterminate"
      sx={{
        height: 2,
        borderRadius: 1,
      }}
    />
  );
};

// Set display names for debugging
ErrorTrigger.displayName = "ErrorTrigger";
ErrorPopper.displayName = "ErrorPopper";
ErrorInfo.displayName = "ErrorInfo";
