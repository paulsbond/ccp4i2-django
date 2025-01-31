import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo } from "react";
import { useApi } from "../../../api";

export const CPdbDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const selectionItemName = useMemo(() => {
    const result = `${props.item?._objectPath}.selection.text`;
    return result;
  }, [props.item]);

  const { data: fileDigest } = api.digest<any>(
    `jobs/${props.job.id}/digest?object_path=${props.item._objectPath}`
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
