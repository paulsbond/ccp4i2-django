import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TextField } from "@mui/material";
import { useApi } from "../../../api";
import { Job } from "../../../models";
import { CCP4i2CSimpleElementProps } from "./csimple";

export const CSimpleTextFieldElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const { job, type, sx, item } = props;
  const api = useApi();
  const { mutate } = api.container<any>(`jobs/${job.id}/container`);

  const [value, setValue] = useState<number | string | null>(null);

  useEffect(() => {
    setValue(item._value);
  }, [item]);

  const { objectPath, qualifiers } = useMemo<{
    objectPath: string | null;
    qualifiers: any | null;
  }>(() => {
    if (item)
      return { objectPath: item._objectPath, qualifiers: item._qualifiers };
    return { objectPath: null, qualifiers: null };
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
      }
    },
    [type]
  );

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = async (ev) => {
    if (ev.key === "Enter") {
      const setParameterArg = {
        object_path: objectPath,
        value: value,
      };
      console.log({ setParameterArg });
      const result = await api.post<Job>(
        `jobs/${job.id}/set_parameter`,
        setParameterArg
      );
      console.log(result);
      mutate();
    }
  };

  return (
    value && (
      <TextField
        disabled={job.status !== 1}
        sx={sx}
        type={type}
        value={value}
        label={
          qualifiers?.guiLabel
            ? qualifiers.guiLabel
            : objectPath?.split(".").at(-1)
        }
        title={qualifiers?.toolTip ? qualifiers?.toolTip : objectPath}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    )
  );
};
