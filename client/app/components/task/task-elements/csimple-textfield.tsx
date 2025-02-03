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
import { useJob } from "../task-utils";
import { ErrorInfo } from "./error-info";

export const CSimpleTextFieldElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job, type, sx, qualifiers } = props;
  const { getTaskItem } = useJob(job);
  const item = getTaskItem(itemName);

  const inputRef = useRef<HTMLElement | null>(null);
  const [inFlight, setInFlight] = useState<boolean>(false);

  const [value, setValue] = useState<number | string | boolean | null>(null);

  const { mutate: mutateParams } = api.get<any>(`jobs/${job.id}/container`);

  const { data: validation, mutate: mutateValidation } = api.container<any>(
    `jobs/${props.job.id}/validation`
  );

  const { setParameter } = useJob(job);

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
        sendValue();
      }
    },
    [value]
  );

  const sendValue = useCallback(async () => {
    setInFlight(true);
    const setParameterArg = {
      object_path: item._objectPath,
      value: value,
    };
    try {
      const result: any = await setParameter(setParameterArg);
      if (result.status === "Failed") {
        setValue(item._value);
      }
    } catch (err) {
      console.log("Here's an", err);
    }
    setInFlight(false);
  }, [objectPath, value]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  return (
    <Stack direction="row" sx={{ mb: 2 }}>
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
        onBlur={(ev) => {
          if (value !== item._value) sendValue();
        }}
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
  );
};
