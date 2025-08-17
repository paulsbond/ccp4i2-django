import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Stack, TextField } from "@mui/material";

import { CCP4i2CSimpleElementProps } from "./csimple";
import { useJob, SetParameterResponse } from "../../../utils";
import { ErrorTrigger } from "./error-info";
import { useTaskInterface } from "../../../providers/task-provider";
import { usePopcorn } from "../../../providers/popcorn-provider";

// Types
type InputValue = string | number | boolean;
type InputType = "text" | "int" | "float" | "checkbox";

interface ProcessedItem {
  objectPath: string | null;
  value: InputValue;
  guiLabel: string;
  isMultiLine: boolean;
  tooltipText: string;
}

// Constants
const DEFAULT_MIN_WIDTH = "15rem";
const DEBOUNCE_DELAY = 500;
const INPUT_TYPES = {
  TEXT: "text",
  INT: "int",
  FLOAT: "float",
  CHECKBOX: "checkbox",
} as const;

// Custom hooks
const useProcessedItem = (
  item: any,
  qualifiers: any,
  objectPath: string | null
): ProcessedItem => {
  return useMemo(() => {
    const guiLabel =
      qualifiers?.guiLabel || objectPath?.split(".").at(-1) || "";
    const isMultiLine = qualifiers?.guiMode === "multiLine";
    const tooltipText = qualifiers?.toolTip || objectPath || "";

    return {
      objectPath,
      value: item?._value || "",
      guiLabel,
      isMultiLine,
      tooltipText,
    };
  }, [item, qualifiers, objectPath]);
};

const useFormState = (initialValue: InputValue, type: InputType) => {
  const [value, setValue] = useState<InputValue>(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with prop changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const setDebouncedValue = useCallback(
    (newValue: InputValue, callback: (value: InputValue) => void) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        callback(newValue);
        debounceRef.current = null;
      }, DEBOUNCE_DELAY);
    },
    []
  );

  return {
    value,
    setValue,
    isSubmitting,
    setIsSubmitting,
    setDebouncedValue,
  };
};

// Utility functions
const parseValueByType = (inputValue: string, type: InputType): InputValue => {
  switch (type) {
    case INPUT_TYPES.INT:
      return parseInt(inputValue, 10);
    case INPUT_TYPES.FLOAT:
      return parseFloat(inputValue);
    case INPUT_TYPES.TEXT:
    default:
      return inputValue;
  }
};

const isValueValid = (value: InputValue, type: InputType): boolean => {
  if (type === INPUT_TYPES.INT || type === INPUT_TYPES.FLOAT) {
    return !Number.isNaN(value);
  }
  return true;
};

// Main component
export const CSimpleTextFieldElement: React.FC<CCP4i2CSimpleElementProps> = ({
  itemName,
  job,
  type,
  sx,
  qualifiers,
  onChange,
  visibility,
  disabled: disabledProp,
  suppressMutations = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    useTaskItem,
    getValidationColor,
    setParameter,
    setParameterNoMutate,
  } = useJob(job.id);
  const { item } = useTaskItem(itemName);
  const { inFlight, setInFlight } = useTaskInterface();
  const { setMessage } = usePopcorn();

  // Process item data
  const objectPath = useMemo(() => item?._objectPath || null, [item]);
  const processedItem = useProcessedItem(item, qualifiers, objectPath);
  const { value, setValue, isSubmitting, setIsSubmitting, setDebouncedValue } =
    useFormState(processedItem.value, type as InputType);

  // Computed properties
  const isVisible = useMemo(() => {
    if (typeof visibility === "function") return visibility();
    return visibility !== false;
  }, [visibility]);

  const isDisabled = useMemo(() => {
    if (typeof disabledProp === "function") {
      return disabledProp() || inFlight || isSubmitting || job.status !== 1;
    }
    return disabledProp || inFlight || isSubmitting || job.status !== 1;
  }, [disabledProp, inFlight, isSubmitting, job.status]);

  const calculatedSx = useMemo(
    () => ({
      minWidth: DEFAULT_MIN_WIDTH,
      ml: 2,
      ...sx,
    }),
    [sx]
  );

  const validationColor = useMemo(
    () => getValidationColor(item),
    [getValidationColor, item]
  );

  const hasError = useMemo(
    () =>
      validationColor === "error.light" ||
      !isValueValid(value, type as InputType),
    [validationColor, value, type]
  );

  const slotProps = useMemo(() => {
    const baseProps = {
      inputLabel: {
        shrink: true,
        disableAnimation: true,
      },
    };

    if (type === INPUT_TYPES.CHECKBOX) {
      return {
        ...baseProps,
        htmlInput: {
          checked: Boolean(value),
          sx: { my: 1 },
          "aria-label": processedItem.guiLabel,
        },
      };
    }

    return baseProps;
  }, [type, value, processedItem.guiLabel]);

  // Event handlers
  const handleParameterUpdate = useCallback(
    async (newValue: InputValue) => {
      if (!objectPath) {
        console.error("No object path available for parameter update");
        return;
      }

      const setParameterArg = {
        object_path: objectPath,
        value: newValue,
      };

      setInFlight(true);
      setIsSubmitting(true);

      try {
        const updateFn = suppressMutations
          ? setParameterNoMutate
          : setParameter;
        const result: SetParameterResponse | undefined = await updateFn(
          setParameterArg
        );

        if (result?.status === "Failed") {
          setMessage(`Unacceptable value provided: "${newValue}"`);
          setValue(item?._value || ""); // Revert to original value
        } else if (result?.status === "Success" && onChange) {
          await onChange(result.updated_item);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setMessage(`Error updating parameter: ${errorMessage}`);
        console.error("Parameter update failed:", error);
        setValue(item?._value || ""); // Revert to original value
      } finally {
        setInFlight(false);
        setIsSubmitting(false);
      }
    },
    [
      objectPath,
      suppressMutations,
      setParameterNoMutate,
      setParameter,
      setInFlight,
      setIsSubmitting,
      setMessage,
      onChange,
      item,
    ]
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (type === INPUT_TYPES.CHECKBOX) {
        const newValue = (event.target as HTMLInputElement).checked;
        setValue(newValue);
        // Immediately update checkbox values
        handleParameterUpdate(newValue);
      } else {
        const inputValue = event.target.value;
        const parsedValue = parseValueByType(inputValue, type as InputType);
        setValue(parsedValue);

        // Debounce updates for text inputs
        setDebouncedValue(parsedValue, handleParameterUpdate);
      }
    },
    [type, handleParameterUpdate, setDebouncedValue]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" && value !== item?._value) {
        handleParameterUpdate(value);
      }
    },
    [value, item, handleParameterUpdate]
  );

  const handleBlur = useCallback(() => {
    if (value !== item?._value) {
      handleParameterUpdate(value);
    }
  }, [value, item, handleParameterUpdate]);

  // Sync checkbox state with ref
  useEffect(() => {
    if (type === INPUT_TYPES.CHECKBOX && inputRef.current) {
      inputRef.current.checked = Boolean(item?._value);
    }
  }, [type, item]);

  // Early return for invisible components
  if (!isVisible) {
    return null;
  }

  return (
    <Stack
      direction="row"
      sx={{ mt: 2 }}
      role="group"
      aria-label={`${processedItem.guiLabel} input`}
    >
      <TextField
        inputRef={inputRef}
        disabled={isDisabled}
        multiline={processedItem.isMultiLine}
        size="small"
        sx={calculatedSx}
        slotProps={slotProps}
        type={type === INPUT_TYPES.CHECKBOX ? "checkbox" : "text"}
        value={type === INPUT_TYPES.CHECKBOX ? undefined : value}
        label={processedItem.guiLabel}
        title={processedItem.tooltipText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        error={hasError}
        inputProps={{
          "aria-describedby": hasError ? `${itemName}-error` : undefined,
          "aria-invalid": hasError,
        }}
      />
      <ErrorTrigger item={item} job={job} />
    </Stack>
  );
};
