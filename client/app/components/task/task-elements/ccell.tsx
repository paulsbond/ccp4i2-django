import { useApi } from "../../../api";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../../../utils";
import { Button, Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { ErrorInfo } from "./error-info";
import { useMemo, useState } from "react";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { CContainerElement } from "./ccontainer";

export const CCellElement: React.FC<CCP4i2TaskElementProps> = (props) => (
  <CContainerElement
    {...props}
    qualifiers={props.qualifiers}
    size={{ xs: 4 }}
    elementSx={{ my: 0, py: 0, minWidth: "5rem" }}
  />
);
