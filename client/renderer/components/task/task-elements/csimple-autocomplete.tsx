import {
  SyntheticEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
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
import { useJob } from "../../../utils";
import { ErrorTrigger } from "./error-info";
import { TaskInterfaceContext } from "../../../providers/task-container";
import { get } from "jquery";
import { on } from "events";
import { usePopcorn } from "../../../providers/popcorn-provider";

export const CSimpleAutocompleteElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const { itemName, job, type, sx, qualifiers, onParameterChangeSuccess } =
    props;
  const { getTaskItem, getValidationColor } = useJob(job.id);
  const { item } = getTaskItem(itemName);
  //return <Typography>"{itemName}",</Typography>;
  const [value, setValue] = useState<string | number>(item._value);
  const { setMessage } = usePopcorn();
  const { inFlight, setInFlight } = useContext(TaskInterfaceContext);
  const [validationAnchor, setValidationAnchor] = useState<HTMLElement | null>(
    null
  );
  const validationOpen = Boolean(validationAnchor);

  const { objectPath } = useMemo<{
    objectPath: string | null;
  }>(() => {
    if (item) return { objectPath: item._objectPath };
    return { objectPath: null };
  }, [item]);

  const { setParameter, setParameterNoMutate } = useJob(job.id);

  const enumerators = useMemo<(string | number)[]>(() => {
    const result = qualifiers?.enumerators?.map((element: any) => {
      if (typeof element === "string" || element instanceof String)
        return element.trim();
      return element;
    });
    if (item?.value && result && !result.includes(item.value)) {
      result.push(item._value);
    }
    return result ? result : [];
  }, [item, qualifiers]);

  const labels = useMemo<string[]>(() => {
    let menuText: string[] = enumerators.map((item) => `${item}`);
    if (
      qualifiers?.menuText &&
      qualifiers.menuText.length == enumerators.length
    ) {
      menuText = qualifiers?.menuText.map((substring: string) =>
        substring.trim()
      );
    }
    return menuText;
  }, [qualifiers, enumerators]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  const handleSelect = useCallback(
    async (
      event: SyntheticEvent<Element, Event>,
      value: number | string | null,
      reason: AutocompleteChangeReason
    ) => {
      if (value) {
        setValue(value);
        const setParameterArg = {
          object_path: item._objectPath,
          value: value,
        };
        console.log({ setParameterArg });
        setInFlight(true);
        try {
          const result: any = props.suppressMutations
            ? await setParameterNoMutate(setParameterArg)
            : await setParameter(setParameterArg);
          if (result?.status === "Failed") {
            setMessage("Unacceptable new value provided");
            setValue(item._value);
          } else if (onParameterChangeSuccess) {
            await onParameterChangeSuccess(result.updated_item);
          }
        } catch (err) {
          setMessage(err);
          alert(err);
        } finally {
          setInFlight(false);
        }
      }
    },
    [type, onParameterChangeSuccess]
  );

  const handleSelectRadio = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      if (value) {
        setValue(value);
        const setParameterArg = {
          object_path: item._objectPath,
          value: value,
        };
        console.log({ setParameterArg });
        setInFlight(true);
        try {
          const result: any = await setParameter(setParameterArg);
          if (result?.status === "Failed") {
            setValue(item._value);
          } else if (onParameterChangeSuccess) {
            await onParameterChangeSuccess(result.updated_item);
          }
        } catch (err) {
          alert(err);
        } finally {
          setInFlight(false);
        }
      }
    },
    [type]
  );

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  const disabled = useMemo(() => {
    if (typeof props.disabled === "undefined")
      return inFlight || job.status !== 1;
    if (typeof props.disabled === "function") {
      return props.disabled() || inFlight || job.status !== 1;
    }
    return props.disabled || inFlight || job.status !== 1;
  }, [props.disabled, inFlight, job]);

  const calculatedSx = useMemo(() => {
    return { minWidth: "20rem", ...sx };
  }, [sx]);

  const getOptionLabel = useCallback(
    (option: string | number) => {
      const result = labels[enumerators.indexOf(option)];
      if (!result) console.log("Failed finding label", item);
      return labels[enumerators.indexOf(option)];
    },
    [enumerators, labels]
  );

  return inferredVisibility && enumerators && labels ? (
    <Stack direction="row" sx={{ mb: 2 }}>
      {qualifiers?.guiMode === "multiLineRadio" ||
      qualifiers?.guiMode === "radio" ? (
        <RadioGroup
          row={qualifiers?.guiMode === "radio"}
          value={value}
          onChange={handleSelectRadio}
          sx={calculatedSx}
        >
          <FormControlLabel
            control={<></>}
            label={guiLabel}
            sx={{ marginRight: 2 }}
          />
          {enumerators.map((enumerator: string, index: number) => (
            <FormControlLabel
              key={index}
              value={enumerator}
              control={<Radio size="small" disabled={disabled} />}
              label={getOptionLabel(enumerator)}
            />
          ))}
        </RadioGroup>
      ) : (
        <Autocomplete
          disabled={disabled}
          sx={calculatedSx}
          value={value}
          onChange={handleSelect}
          getOptionLabel={getOptionLabel}
          options={enumerators}
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              error={getValidationColor(item) === "error.light"}
              label={guiLabel}
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                  disableAnimation: true,
                },
              }}
            />
          )}
        />
      )}
      <ErrorTrigger {...{ item, job }} />
    </Stack>
  ) : null;
};
