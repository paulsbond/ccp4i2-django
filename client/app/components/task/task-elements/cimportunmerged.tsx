import { useEffect, useMemo, useRef } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { SetParameterArg, useJob, usePrevious } from "../../../utils";
import {
  Card,
  CardContent,
  CardHeader,
  Grid2,
  Typography,
} from "@mui/material";
import { CCellElement } from "./ccell";
import { ErrorInfo } from "./error-info";
import { CSimpleDataFileElement } from "./csimpledatafile";
import { useApi } from "../../../api";

export const CImportUnmergedElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job } = props;
  const {
    getTaskItem,

    getValidationColor,
    setParameter,
    container,
    useAsyncEffect,
  } = useJob(job.id);
  const item = getTaskItem(itemName);
  const fileObjectPath = useMemo<string | null>(() => {
    if (item) return `${item._objectPath}.file`;
    return null;
  }, [item]);

  const { data: fileDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item._objectPath}.file`
  );
  const oldFileDigest = usePrevious<any>(fileDigest);

  useAsyncEffect(async () => {
    if (
      fileDigest &&
      JSON.stringify(fileDigest) !== JSON.stringify(oldFileDigest) && // Only if change
      item && //Only if item is known
      setParameter //Only if setParameter hook in place
    ) {
      console.log({ fileDigest });
      //Here if the file Digest has changed
      if (fileDigest?.digest?.cell) {
        await setParameter({
          object_path: `${item._objectPath}.cell`,
          value: fileDigest.digest.cell,
        });
      }
      if (fileDigest?.digest?.wavelength) {
        await setParameter({
          object_path: `${item._objectPath}.wavelength`,
          value: fileDigest.digest.wavelength,
        });
      }
    }
  }, [fileDigest, item, setParameter]);

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

  return (
    <Card
      sx={{
        border: "3px solid",
        borderColor: getValidationColor(item),
        borderRadius: "0.5rem",
      }}
    >
      <CardHeader
        title={item._qualifiers.guLabel}
        action={<ErrorInfo {...props} />}
      />
      <CardContent>
        {fileObjectPath && (
          <CSimpleDataFileElement {...props} itemName={fileObjectPath} />
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
          <Grid2 size={{ xs: 6 }}>
            <Typography variant="body1">Batches in file</Typography>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            <Typography variant="body1">
              {fileDigest && fileDigest?.digest?.batchs}
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 4 }}>
            <CCP4i2TaskElement
              key="selected batch string"
              {...props}
              sx={{ my: 0, py: 0, minWidth: "30rem" }}
              itemName={`${itemName}.excludeSelection`}
              qualifiers={{
                ...props.qualifiers,
                guiLabel: "Batch range(s) to exclude",
                multiLine: true,
              }}
            />
          </Grid2>
        </Grid2>
      </CardContent>
    </Card>
  );
};
