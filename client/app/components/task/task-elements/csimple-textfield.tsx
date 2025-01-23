import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { TextField } from "@mui/material";
import { useApi } from "../../../api";
import { Job } from "../../../models";
import { CCP4i2CSimpleElementProps } from "./csimple";

export const CSimpleTextFieldElement: React.FC<CCP4i2CSimpleElementProps> = (
  props
) => {
  const { paramsXML, itemName, objectPath, job, mutate, type, qualifiers, sx } =
    props;
  const api = useApi();
  const [value, setValue] = useState<number | string | null>(null);

  useEffect(() => {
    if (paramsXML && itemName) {
      const valueNode = $(paramsXML).find(itemName);
      if (type === "int") {
        setValue(parseInt(valueNode.text()));
      } else if (type === "float") {
        setValue(parseFloat(valueNode.text()));
      } else if (type === "text") {
        setValue(valueNode.text());
      }
    }
  }, [props]);

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

  const usingSelect = useMemo(() => {
    if (qualifiers) {
      return Object.keys(qualifiers).includes("onlyEnumerators");
    }
    return false;
  }, [qualifiers]);

  return (
    value && (
      <TextField
        sx={sx}
        type={type}
        value={value}
        label={
          qualifiers?.guiLabel
            ? qualifiers?.guiLabel
            : objectPath?.split(".").at(-1)
        }
        title={qualifiers?.toolTip ? qualifiers?.toolTip : objectPath}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    )
  );
};
