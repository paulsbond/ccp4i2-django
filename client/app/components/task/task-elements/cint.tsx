import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { Input, TextField } from "@mui/material";
import { useApi } from "../../../api";
import { Job } from "../../../models";

export const CIntElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { paramsXML, itemName, objectPath, job, mutate } = props;
  const api = useApi();
  const [value, setValue] = useState<Number | null>(null);

  useEffect(() => {
    if (paramsXML && itemName) {
      const valueNode = $(paramsXML).find(itemName);
      setValue(parseInt(valueNode.text()));
    }
  }, [props]);

  const handleChange: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (ev) => {
    setValue(parseInt(ev.target.value));
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = async (ev) => {
    if (ev.key === "Enter") {
      const result = await api.post<Job>(`jobs/${job.id}/set_parameter`, {
        object_path: objectPath,
        value: value,
      });
      mutate();
    }
  };

  return (
    <>
      {value && (
        <TextField
          type="number"
          value={value}
          label={
            props.qualifiers?.guiLabel
              ? props.qualifiers?.guiLabel
              : objectPath?.split(".").at(-1)
          }
          title={
            props.qualifiers?.toolTip ? props.qualifiers?.toolTip : objectPath
          }
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      )}
    </>
  );
};
