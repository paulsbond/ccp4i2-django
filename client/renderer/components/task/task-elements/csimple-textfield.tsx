import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Stack, TextField } from "@mui/material";
import { CCP4i2CSimpleElementProps } from "./csimple";
import { useJob } from "../../../utils";
import { ErrorTrigger } from "./error-info";
import { TaskInterfaceContext } from "../../../providers/task-container";

export const CSimpleTextFieldElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const { itemName, job, type, sx, qualifiers } = props;
  const { inFlight, setInFlight } = useContext(TaskInterfaceContext);
  const { getTaskItem, getValidationColor } = useJob(job.id);
  const { item } = getTaskItem(itemName);
  //return <Typography>"{itemName}",</Typography>;

  const inputRef = useRef<HTMLElement | null>(null);

  const [value, setValue] = useState<number | string | boolean>(
    item._value || ""
  );

  const { setParameter } = useJob(job.id);

  const changeCountdown = useRef<any | null>(null);

  useEffect(() => {
    return () => {
      if (changeCountdown.current) {
        clearTimeout(changeCountdown.current);
        changeCountdown.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setValue(item._value || "");
    if (type === "checkbox" && inputRef.current)
      //@ts-ignore
      inputRef.current.checked = item._value;
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
        setCountdown(parseInt(ev.target.value));
      } else if (type === "float") {
        setValue(parseFloat(ev.target.value));
        setCountdown(parseFloat(ev.target.value));
      } else if (type === "text") {
        setValue(ev.target.value);
        setCountdown(ev.target.value);
      } else if (type === "checkbox") {
        //@ts-ignore
        const newValue = ev.currentTarget.checked;
        setValue(newValue);
        console.log(`Sending ${newValue}`);
        sendExplicitValue(newValue);
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

  const handleBlur = useCallback(() => {
    if (value !== item._value) sendValue();
  }, [item, value]);

  const sendValue = useCallback(async () => {
    sendExplicitValue(value);
  }, [objectPath, value]);

  const setCountdown = useCallback(
    (valueToSend: any) => {
      if (changeCountdown.current) {
        clearTimeout(changeCountdown.current);
        changeCountdown.current = null;
      }
      changeCountdown.current = setTimeout((valueToSend: any) => {
        sendExplicitValue(valueToSend);
        changeCountdown.current = null;
      }, 500);
    },
    [sendValue]
  );

  const sendExplicitValue = useCallback(
    async (explicitValue: any) => {
      //This method to allow sending of state *and non-state* values.  For example, a
      //checkbox willtry to update and send the value, so the state value might lag
      setInFlight(true);
      const setParameterArg = {
        object_path: item._objectPath,
        value: explicitValue,
      };
      try {
        const result: any = await setParameter(setParameterArg);
        if (result.status === "Failed") {
          setValue(item._value);
        } else if (props.onParameterChangeSuccess) {
          await props.onParameterChangeSuccess(result.updated_item);
        }
      } catch (err) {
        console.log("Here's an", err);
      } finally {
        setInFlight(false);
      }
    },
    [objectPath, value]
  );

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  const multiLine = useMemo<boolean>(() => {
    return Boolean(qualifiers?.guiMode === "multiLine");
  }, [qualifiers]);

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  const compositedSx = useMemo(() => {
    return { minWidth: "20rem", ...sx };
  }, [sx]);

  const calculatedTitle = useMemo(
    () => (qualifiers?.toolTip ? qualifiers.toolTip : objectPath),
    [qualifiers, objectPath]
  );

  const calculatedSlotProps = useMemo(
    () =>
      type === "checkbox"
        ? {
            inputLabel: {
              shrink: true,
              disableAnimation: true,
            },
            htmlInput: { checked: value, sx: { my: 1 } },
          }
        : {
            inputLabel: {
              shrink: true,
              disableAnimation: true,
            },
          },
    [type, value]
  );

  const disabled = useMemo(() => {
    if (typeof props.disabled === "undefined")
      return inFlight || job.status != 1;
    if (typeof props.disabled === "function") {
      return props.disabled() || inFlight || job.status != 1;
    }
    return props.disabled || inFlight || job.status != 1;
  }, [props.disabled, inFlight, job]);

  return inferredVisibility ? (
    <Stack direction="row" sx={{ mb: 2 }}>
      <TextField
        multiline={multiLine}
        inputRef={inputRef}
        disabled={disabled}
        size="small"
        sx={compositedSx}
        slotProps={calculatedSlotProps}
        type={type}
        value={value}
        label={guiLabel}
        title={calculatedTitle}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur} // This handles when the element loses focus
        error={
          getValidationColor(item) === "error.light" || Number.isNaN(value)
        }
      />
      <ErrorTrigger {...{ item, job }} />
    </Stack>
  ) : null;
};
