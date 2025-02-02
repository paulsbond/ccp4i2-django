import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo } from "react";
import { useApi } from "../../../api";
import { useTaskItem } from "../task-utils";

export const CPdbDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName } = props;
  const api = useApi();
  const { data: container } = api.container<any>(`jobs/${job.id}/container`);
  const useItem = useTaskItem(container);
  const item = useItem(itemName);
  const selectionItemName = useMemo(() => {
    const result = `${item._objectPath}.selection.text`;
    return result;
  }, [item]);

  const { data: fileDigest } = api.digest<any>(
    `jobs/${props.job.id}/digest?object_path=${item._objectPath}`
  );

  const infoContent = useMemo(
    () => <Typography>{JSON.stringify(fileDigest)}</Typography>,
    [fileDigest]
  );

  return (
    <Stack direction="column">
      <CDataFileElement {...props} infoContent={infoContent} />
      <CCP4i2TaskElement
        {...props}
        itemName={selectionItemName}
        qualifiers={{ ...props.qualifiers, guiLabel: "Selection string" }}
      />
    </Stack>
  );
};
