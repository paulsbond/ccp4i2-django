import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo } from "react";

export const CPdbDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const selectionItemName = useMemo(() => {
    const result = `${props.item?._objectPath}.selection.text`;
    console.log({ sel: result });
    return result;
  }, [props.item]);
  return (
    <Stack direction="column">
      <CDataFileElement {...props} />
      <Typography sx={{ my: 0, py: 0 }} variant="body1">
        Selection
      </Typography>
      <CCP4i2TaskElement
        {...props}
        sx={{ ...props.sx, maxWidth: "20rem" }}
        itemName={selectionItemName}
        qualifiers={{ ...props.qualifiers, guiLabel: "Selection string" }}
      />
    </Stack>
  );
};
