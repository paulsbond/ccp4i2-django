import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Autocomplete,
  AutocompleteChangeReason,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useApi } from "../../../api";
import { Job } from "../../../models";
import { CCP4i2CSimpleElementProps } from "./csimple";

export const CSimpleAutocompleteElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const { job, type, sx, item, qualifiers } = props;
  const api = useApi();
  const { mutate } = api.container<any>(`jobs/${job.id}/container`);

  const [value, setValue] = useState<{
    id: string | number;
    label: string;
  } | null>(null);
  const [inFlight, setInFlight] = useState(false);
  const [validationAnchor, setValidationAnchor] = useState<HTMLElement | null>(
    null
  );
  const validationOpen = Boolean(validationAnchor);

  useEffect(() => {
    console.log({ value: item._value });
    setValue(item._value);
  }, [item]);

  const { objectPath } = useMemo<{
    objectPath: string | null;
  }>(() => {
    if (item) return { objectPath: item._objectPath };
    return { objectPath: null };
  }, [item]);

  const options: { id: string; label: string }[] | undefined = useMemo(() => {
    if (qualifiers?.enumerators) {
      const enumerators: string[] | null = qualifiers?.enumerators.map(
        (substring: string) => substring.trim()
      );
      let menuText: string[] | null = enumerators;
      if (
        qualifiers?.menuText &&
        qualifiers?.enumerators &&
        qualifiers.menuText.length == qualifiers.enumerators.length
      ) {
        menuText = qualifiers?.menuText.map((substring: string) =>
          substring.trim()
        );
      }

      const options = enumerators?.map(
        (enumerator: string, iEnumerator: number) => {
          return {
            id: enumerator,
            label:
              menuText && menuText.length == enumerators.length
                ? menuText[iEnumerator]
                : enumerator,
          };
        }
      );
      return options;
    }
    return [];
  }, [qualifiers]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  useEffect(() => {
    if (item && item._value) {
      const orderedLabels = options?.map(
        (option: { id: string; label: string }) => option.label
      );
      const orderedIds = options?.map(
        (option: { id: string; label: string }) => option.id
      );
      let label: string | undefined = `${item._value}`;
      if (orderedIds?.includes(item._value)) {
        label = orderedLabels?.at(orderedIds.indexOf(item._value));
      }
      setValue({ id: item._value, label: label as string });
    }
  }, [props, options]);

  const handleSelect = useCallback(
    async (
      event: SyntheticEvent<Element, Event>,
      value: { id: string | number; label: string } | null,
      reason: AutocompleteChangeReason
    ) => {
      if (value) {
        setValue(value);
        const setParameterArg = {
          object_path: objectPath,
          value: value.id,
        };
        console.log({ setParameterArg });
        setInFlight(true);
        const result = await api.post<Job>(
          `jobs/${job.id}/set_parameter`,
          setParameterArg
        );
        console.log(result);
        mutate();
        setInFlight(false);
      }
    },
    [type]
  );

  return (
    <Stack direction="row">
      <Autocomplete
        disabled={job.status !== 1}
        sx={{ minWidth: "20rem", ...sx }}
        value={value}
        onChange={handleSelect}
        options={options || []}
        renderInput={(params) => <TextField {...params} label={guiLabel} />}
      />
      <CircularProgress
        sx={{ height: "2rem", width: "2rem", mt: "1.25rem" }}
        variant={inFlight ? "indeterminate" : "determinate"}
        value={100}
      />
      <Menu open={validationOpen} anchorEl={validationAnchor}>
        <MenuItem> </MenuItem>
      </Menu>
    </Stack>
  );
};
