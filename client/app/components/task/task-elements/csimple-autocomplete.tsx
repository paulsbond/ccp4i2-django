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
  Stack,
  TextField,
} from "@mui/material";
import { useApi } from "../../../api";
import { Job } from "../../../models";
import { CCP4i2CSimpleElementProps } from "./csimple";

export const CSimpleAutocompleteElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const { paramsXML, itemName, objectPath, job, mutate, type, qualifiers, sx } =
    props;
  const api = useApi();
  const [value, setValue] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [inFlight, setInFlight] = useState(false);

  const { data: validation_report, mutate: mutateValidation } = api.get<Job>(
    `jobs/${job.id}/validation_report`
  );

  const options: { id: string; label: string }[] | undefined = useMemo(() => {
    const enumerators: string[] | null = qualifiers?.enumerators
      ?.split(",")
      .map((substring: string) => substring.trim());
    const menuText: string[] | null = qualifiers?.menuText
      ?.split(",")
      .map((substring: string) => substring.trim());
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
  }, [qualifiers]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  useEffect(() => {
    if (paramsXML && itemName) {
      const valueNode = $(paramsXML).find(itemName);
      const stringValue = valueNode.text().trim();
      const orderedLabels = options?.map(
        (option: { id: string; label: string }) => option.label
      );
      const orderedIds = options?.map(
        (option: { id: string; label: string }) => option.id
      );
      let label: string | undefined = stringValue;
      if (orderedIds?.includes(stringValue)) {
        label = orderedLabels?.at(orderedIds.indexOf(stringValue));
      }
      setValue({ id: stringValue, label: label as string });
    }
  }, [props, options]);

  const handleSelect = useCallback(
    async (
      event: SyntheticEvent<Element, Event>,
      value: { id: string; label: string } | null,
      reason: AutocompleteChangeReason
    ) => {
      if (value) {
        setValue(value);
        const setParameterArg = {
          object_path: objectPath,
          value:
            type === "int"
              ? parseInt(value.id)
              : type === "float"
              ? parseFloat(value.id)
              : value.id,
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
        sx={sx}
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
    </Stack>
  );
};
