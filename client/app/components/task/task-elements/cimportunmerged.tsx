import { useMemo, useState } from "react";
import { useApi } from "../../../api";
import {
  CCP4i2TaskElement,
  CCP4i2TaskElementProps,
  errorsInValidation,
} from "./task-element";
import { CDataFileElement } from "./cdatafile";
import { useJob, useValidation } from "../task-utils";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  ClickAwayListener,
  Grid2,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import { CContainerElement } from "./ccontainer";
import { CCellElement } from "./ccell";
import { Info } from "@mui/icons-material";
import { ErrorInfo } from "./error-info";

export const CImportUnmergedElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job } = props;
  const { getTaskItem, getValidationColor } = useJob(job);
  const item = getTaskItem(itemName);
  const { getErrors } = useValidation(job.id);
  const fileObjectPath = useMemo<string | null>(() => {
    if (item) return `${item._objectPath}.file`;
    return null;
  }, [item]);
  const fileItem = getTaskItem(fileObjectPath ? fileObjectPath : "__NO_FILE__");

  const crystalNameObjectPath = useMemo<string | null>(() => {
    if (item) return `${item._objectPath}.crystalName`;
    return null;
  }, [item]);

  const datasetObjectPath = useMemo<string | null>(() => {
    if (item) return `${item._objectPath}.dataset`;
    return null;
  }, [item]);

  const wavelengthObjectPath = useMemo<string | null>(() => {
    if (item) return `${item._objectPath}.wavelength`;
    return null;
  }, [item]);

  const cellObjectPath = useMemo<string | null>(() => {
    if (item) return `${item._objectPath}.cell`;
    return null;
  }, [item]);

  const fieldErrors = getErrors(item._objectPath);

  return (
    <Card
      sx={{
        border: "3px solid",
        borderColor: getValidationColor(itemName),
        borderRadius: "0.5rem",
      }}
    >
      <CardHeader
        title={item._qualifiers.guLabel}
        action={<ErrorInfo {...props} />}
      />
      <CardContent>
        {fileObjectPath && (
          <CDataFileElement {...props} itemName={fileObjectPath} />
        )}
        {cellObjectPath && (
          <CCellElement {...props} itemName={cellObjectPath} />
        )}
        <Grid2 container rowSpacing={0} sx={{ mt: 2 }}>
          <Grid2 size={{ xs: 4 }}>
            <CCP4i2TaskElement
              key="crystalName"
              {...props}
              sx={{ my: 0, py: 0, minWidth: "10rem" }}
              itemName={`${crystalNameObjectPath}`}
              qualifiers={{ ...props.qualifiers, guiLabel: "Crystal name" }}
            />
          </Grid2>
          <Grid2 size={{ xs: 4 }}>
            <CCP4i2TaskElement
              key="datasetName"
              {...props}
              sx={{ my: 0, py: 0, minWidth: "10rem" }}
              itemName={`${datasetObjectPath}`}
              qualifiers={{ ...props.qualifiers, guiLabel: "Dataset name" }}
            />
          </Grid2>
          <Grid2 size={{ xs: 4 }}>
            <CCP4i2TaskElement
              key="wavelength"
              {...props}
              sx={{ my: 0, py: 0, minWidth: "10rem" }}
              itemName={`${wavelengthObjectPath}`}
              qualifiers={{ ...props.qualifiers, guiLabel: "Wavelength" }}
            />
          </Grid2>
        </Grid2>
      </CardContent>
    </Card>
  );
};
