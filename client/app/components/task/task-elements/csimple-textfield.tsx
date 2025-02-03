import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
} from "@mui/material";
import { useApi } from "../../../api";
import { Job } from "../../../models";
import { CCP4i2CSimpleElementProps } from "./csimple";
import { useTaskItem } from "../task-utils";

export const CSimpleTextFieldElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job, type, sx, qualifiers } = props;
  const { data: container } = api.container<any>(`jobs/${job.id}/container`);
  const useItem = useTaskItem(container);
  const item = useItem(itemName);

  const inputRef = useRef<HTMLElement | null>(null);
  const [inFlight, setInFlight] = useState<boolean>(false);

  const [value, setValue] = useState<number | string | boolean | null>(null);

  const { mutate: mutateParams } = api.get<any>(`jobs/${job.id}/container`);

  const { data: validation, mutate: mutateValidation } = api.container<any>(
    `jobs/${props.job.id}/validation`
  );

  useEffect(() => {
    setValue(item._value);
    //@ts-ignore
    //if (inputRef.current) inputRef.current.checked = item._value;
  }, [item]);

  const { objectPath } = useMemo<{
    objectPath: string | null;
  }>(() => {
    if (item) return { objectPath: item._objectPath };
    return { objectPath: null };
  }, [item]);

  const handleChange: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = useCallback(
    (ev) => {
      console.log(ev);
      if (type === "int") {
        setValue(parseInt(ev.target.value));
      } else if (type === "float") {
        setValue(parseFloat(ev.target.value));
      } else if (type === "text") {
        setValue(ev.target.value);
      } else if (type === "checkbox") {
        //@ts-ignore
        setValue(ev.target.checked);
        //@ts-ignore
        sendValue(ev.target.checked);
      }
    },
    [type]
  );

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    async (ev) => {
      if (ev.key === "Enter") {
        sendValue(value);
      }
    },
    [value]
  );

  const sendValue = useCallback(
    async (value: any) => {
      setInFlight(true);
      const setParameterArg = {
        object_path: objectPath,
        value: value,
      };
      const result = await api.post<Job>(
        `jobs/${job.id}/set_parameter`,
        setParameterArg
      );
      console.log(result);
      await mutateParams();
      await mutateValidation();
      setInFlight(false);
    },
    [objectPath]
  );

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  return (
    <Stack direction="row">
      <TextField
        inputRef={inputRef}
        disabled={job.status !== 1}
        size="small"
        sx={{ minWidth: "20rem", py: 0, my: 0, ...sx }}
        slotProps={
          type === "checkbox"
            ? {
                htmlInput: { checked: value, sx: { my: 1 } },
              }
            : {}
        }
        type={type}
        value={value || ""}
        label={guiLabel}
        title={qualifiers?.toolTip ? qualifiers.toolTip : objectPath}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocusCapture={(ev) => console.log(ev)}
      />
      <LinearProgress
        sx={{
          height: "2rem",
          width: "2rem",
        }}
        variant={inFlight ? "indeterminate" : "determinate"}
        value={0}
      />
    </Stack>
  );
};
