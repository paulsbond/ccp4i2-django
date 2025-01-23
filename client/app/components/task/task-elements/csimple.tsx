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

interface CCP4i2CSimpleElementProps extends CCP4i2TaskElementProps {
  type: string;
}
export const CSimpleElement: React.FC<CCP4i2CSimpleElementProps> = (props) => {
  const { paramsXML, itemName, objectPath, job, mutate, type } = props;
  const api = useApi();
  const [value, setValue] = useState<Number | string | null>(null);

  useEffect(() => {
    if (paramsXML && itemName) {
      const valueNode = $(paramsXML).find(itemName);
      if (type === "number") {
        setValue(parseInt(valueNode.text()));
      } else if (type === "text") {
        setValue(valueNode.text());
      }
    }
  }, [props]);

  const handleChange: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = useCallback(
    (ev) => {
      if (type === "number") {
        setValue(parseInt(ev.target.value));
      } else if (type === "text") {
        setValue(ev.target.value);
      }
    },
    [type]
  );

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
      {type}
      {value && (
        <TextField
          type={type}
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
