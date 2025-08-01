import React, {
  SyntheticEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  Autocomplete,
  AutocompleteChangeReason,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";

import { CCP4i2CSimpleElementProps } from "./csimple";
import { useJob, SetParameterResponse } from "../../../utils";
import { ErrorTrigger } from "./error-info";
import { TaskInterfaceContext } from "../../../providers/task-container";
import { usePopcorn } from "../../../providers/popcorn-provider";

// Types
type OptionValue = string | number;
type GuiMode = "multiLineRadio" | "radio" | "autocomplete";

interface ProcessedItem {
  objectPath: string | null;
  value: OptionValue;
  validationColor: string;
}

interface EnumeratorConfig {
  enumerators: OptionValue[];
  labels: string[];
  guiLabel: string;
  guiMode: GuiMode;
}

// Constants
const DEFAULT_MIN_WIDTH = "20rem";
const GUI_MODES = {
  MULTI_LINE_RADIO: "multiLineRadio",
  RADIO: "radio",
  AUTOCOMPLETE: "autocomplete",
} as const;

// Custom hooks
const useProcessedItem = (item: any, qualifiers: any) => {
  return useMemo<ProcessedItem>(() => {
    const objectPath = item?._objectPath || null;
    const value = item?._value || "";

    return {
      objectPath,
      value,
      validationColor: "", // Will be set by validation hook
    };
  }, [item]);
};

const useEnumeratorConfig = (
  item: any,
  qualifiers: any,
  objectPath: string | null
): EnumeratorConfig & { onlyEnumerators: boolean } => {
  return useMemo(() => {
    // Process enumerators
    const rawEnumerators =
      qualifiers?.enumerators?.map((element: any) => {
        if (typeof element === "string" || element instanceof String) {
          return element.trim();
        }
        return element;
      }) || [];

    // Include current value if not in enumerators
    const enumerators = [...rawEnumerators];
    if (item?.value && !enumerators.includes(item._value)) {
      enumerators.push(item._value);
    }

    // Process labels
    let labels = enumerators.map((item) => `${item}`);
    if (
      qualifiers?.menuText &&
      qualifiers.menuText.length === enumerators.length
    ) {
      labels = qualifiers.menuText.map((text: string) => text.trim());
    }

    // Process GUI label
    const guiLabel =
      qualifiers?.guiLabel || objectPath?.split(".").at(-1) || "Select option";

    // Determine GUI mode
    const guiMode = qualifiers?.guiMode || GUI_MODES.AUTOCOMPLETE;

    // Check onlyEnumerators setting
    const onlyEnumerators = qualifiers?.onlyEnumerators === true;

    return {
      enumerators,
      labels,
      guiLabel,
      guiMode,
      onlyEnumerators,
    };
  }, [item, qualifiers, objectPath]);
};

const useFormState = (initialValue: OptionValue) => {
  const [value, setValue] = useState<OptionValue>(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    setValue,
    isSubmitting,
    setIsSubmitting,
  };
};

// Main component
export const CSimpleAutocompleteElement: React.FC<
  CCP4i2CSimpleElementProps
> = ({
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
  const {
    getTaskItem,
    getValidationColor,
    setParameter,
    setParameterNoMutate,
  } = useJob(job.id);
  const { item } = getTaskItem(itemName);
  const { setMessage } = usePopcorn();
  const { inFlight, setInFlight } = useContext(TaskInterfaceContext);

  // Process item data
  const processedItem = useProcessedItem(item, qualifiers);
  const config = useEnumeratorConfig(
    item,
    qualifiers,
    processedItem.objectPath
  );
  const { value, setValue, isSubmitting, setIsSubmitting } = useFormState(
    processedItem.value
  );

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

  const isRadioMode = useMemo(
    () =>
      config.guiMode === GUI_MODES.MULTI_LINE_RADIO ||
      config.guiMode === GUI_MODES.RADIO,
    [config.guiMode]
  );

  // Event handlers
  const handleParameterUpdate = useCallback(
    async (newValue: OptionValue) => {
      if (!item?._objectPath) {
        console.error("No object path available for parameter update");
        return;
      }

      const setParameterArg = {
        object_path: item._objectPath,
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
          setValue(item._value); // Revert to original value
        } else if (result?.status === "Success" && onChange) {
          await onChange(result.updated_item);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setMessage(`Error updating parameter: ${errorMessage}`);
        console.error("Parameter update failed:", error);
        setValue(item._value); // Revert to original value
      } finally {
        setInFlight(false);
        setIsSubmitting(false);
      }
    },
    [
      item,
      suppressMutations,
      setParameterNoMutate,
      setParameter,
      setInFlight,
      setIsSubmitting,
      setMessage,
      onChange,
    ]
  );

  const handleAutocompleteChange = useCallback(
    async (
      event: SyntheticEvent<Element, Event>,
      newValue: OptionValue | null,
      reason: AutocompleteChangeReason
    ) => {
      if (newValue !== null && newValue !== value) {
        setValue(newValue);
        await handleParameterUpdate(newValue);
      }
    },
    [value, handleParameterUpdate]
  );

  const handleRadioChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.value;
      if (newValue && newValue !== value) {
        setValue(newValue);
        await handleParameterUpdate(newValue);
      }
    },
    [value, handleParameterUpdate]
  );

  const getOptionLabel = useCallback(
    (option: OptionValue): string => {
      const index = config.enumerators.indexOf(option);
      const label = config.labels[index];

      if (!label) {
        console.warn(`No label found for option: ${option}`, { item, config });
        return String(option);
      }

      return label;
    },
    [config.enumerators, config.labels, item]
  );

  // Early returns
  if (!isVisible || !config.enumerators.length || !config.labels.length) {
    return null;
  }

  // Render helpers
  const renderRadioGroup = () => (
    <RadioGroup
      row={config.guiMode === GUI_MODES.RADIO}
      value={value}
      onChange={handleRadioChange}
      sx={calculatedSx}
      name={`radio-group-${itemName}`}
    >
      <FormControlLabel
        control={<></>}
        label={config.guiLabel}
        sx={{ mr: 2 }}
      />
      {config.enumerators.map((enumerator, index) => (
        <FormControlLabel
          key={`${enumerator}-${index}`}
          value={enumerator}
          control={
            <Radio
              size="small"
              disabled={isDisabled}
              inputProps={{ "aria-label": getOptionLabel(enumerator) }}
            />
          }
          label={getOptionLabel(enumerator)}
        />
      ))}
    </RadioGroup>
  );

  const renderAutocomplete = () => (
    <Autocomplete
      disabled={isDisabled}
      sx={calculatedSx}
      value={value}
      onChange={handleAutocompleteChange}
      onInputChange={(event, newInputValue, reason) => {
        // Handle free text input only if not restricted to enumerators
        if (
          reason === "input" &&
          newInputValue !== value &&
          !config.onlyEnumerators
        ) {
          setValue(newInputValue);
        }
      }}
      onBlur={async () => {
        // Update parameter when user finishes typing (only for freeSolo mode)
        if (!config.onlyEnumerators && value !== processedItem.value) {
          await handleParameterUpdate(value);
        }
      }}
      getOptionLabel={getOptionLabel}
      options={config.enumerators}
      size="small"
      freeSolo={!config.onlyEnumerators} // Enable free text input only when onlyEnumerators is false
      disableClearable={config.onlyEnumerators} // Remove clear button when onlyEnumerators is true
      isOptionEqualToValue={(option, value) => option === value}
      renderInput={(params) => (
        <TextField
          {...params}
          error={validationColor === "error.light"}
          label={config.guiLabel}
          size="small"
          slotProps={{
            inputLabel: {
              shrink: true,
              disableAnimation: true,
            },
          }}
          inputProps={{
            ...params.inputProps,
            "aria-label": config.guiLabel,
          }}
        />
      )}
    />
  );

  return (
    <Stack
      direction="row"
      sx={{ mt: 1 }}
      role="group"
      aria-label={`${config.guiLabel} selection`}
    >
      {isRadioMode ? renderRadioGroup() : renderAutocomplete()}
      <ErrorTrigger item={item} job={job} />
    </Stack>
  );
};
