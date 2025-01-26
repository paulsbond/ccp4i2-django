import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo } from "react";

export const CObsDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  return (
    <Stack direction="column">
      <CDataFileElement {...props} />
    </Stack>
  );
};
