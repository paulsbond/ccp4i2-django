import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import {
  Autocomplete,
  AutocompleteChangeReason,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CCP4i2CSimpleElementProps } from "./csimple";
import { useJob } from "../../../utils";
import { ErrorInfo } from "./error-info";

export const CSimpleAutocompleteElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const { itemName, job, type, sx, qualifiers } = props;
  const { getTaskItem, getValidationColor } = useJob(job.id);
  const item = getTaskItem(itemName);
  //return <Typography>"{itemName}",</Typography>;
  const [value, setValue] = useState<string | number>(item._value);

  const [inFlight, setInFlight] = useState(false);
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

  const { setParameter } = useJob(job.id);

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
          const result: any = await setParameter(setParameterArg);
          if (result.status === "Failed") {
            setValue(item._value);
          }
        } catch (err) {
          alert(err);
        }
        setInFlight(false);
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

  const isDisabled = useMemo(() => job.status !== 1, [job]);

  const calculatedSx = useMemo(() => {
    return { minWidth: "20rem", py: 0, mb: 1, ...sx };
  }, [sx]);

  const getOptionLabel = useCallback(
    (option: string | number) => {
      const result = labels[enumerators.indexOf(option)];
      if (!result) console.log("Failed finding label", item);
      return labels[enumerators.indexOf(option)];
    },
    [enumerators, labels]
  );

  return (
    inferredVisibility &&
    enumerators &&
    labels && (
      <Stack direction="row" sx={{ mb: 2 }}>
        <Autocomplete
          disabled={isDisabled}
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
            />
          )}
        />
        <Stack direction="column">
          <ErrorInfo {...props} />
          <LinearProgress
            sx={{ height: "0.5rem", width: "2rem" }}
            variant={inFlight ? "indeterminate" : "determinate"}
            value={0}
          />
        </Stack>
      </Stack>
    )
  );
};
