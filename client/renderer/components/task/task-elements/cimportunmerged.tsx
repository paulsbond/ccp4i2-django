import { useCallback, useEffect, useMemo, useRef } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import {
  SetParameterArg,
  useAsyncEffect,
  useJob,
  usePrevious,
} from "../../../utils";
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
import { CDataFileElement } from "./cdatafile";
import { mutate } from "swr";
import { get } from "jquery";

export const CImportUnmergedElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job } = props;
  const {
    getTaskItem,
    getFileDigest,
    useFileDigest,
    getValidationColor,
    setParameterNoMutate,
    setParameter,
    mutateContainer,
  } = useJob(job.id);
  const { item } = getTaskItem(itemName);
  const { value: cell } = getTaskItem(`${itemName}.cell`);
  const { value: wavelength } = getTaskItem(`${itemName}.wavelength`);
  const { value: crystalName } = getTaskItem(`${itemName}.crystalName`);
  const { value: dataset } = getTaskItem(`${itemName}.dataset`);
  const fileObjectPath = useMemo<string | null>(() => {
    if (item) return `${item._objectPath}.file`;
    return null;
  }, [item]);

  const { data: fileDigest, mutate: mutateDigest } = useFileDigest(
    fileObjectPath || ""
  );

  const handleChange = useCallback(async () => {
    mutateDigest();
  }, [mutateDigest]);

  useAsyncEffect(async () => {
    if (!item || !setParameterNoMutate || !fileDigest) return;
    console.log("File digest", fileDigest);
    //Here if the file Digest has changed
    const newCell = fileDigest?.cell || null;
    let parametersUpdated = false;
    if (newCell && JSON.stringify(newCell) !== JSON.stringify(cell)) {
      await setParameterNoMutate({
        object_path: `${item._objectPath}.cell`,
        value: newCell,
      });
      parametersUpdated = true;
    }
    if (fileDigest?.wavelength && fileDigest?.wavelength !== wavelength) {
      await setParameterNoMutate({
        object_path: `${item._objectPath}.wavelength`,
        value: fileDigest.wavelength,
      });
      parametersUpdated = true;
    }
    if (fileDigest?.crystalName && fileDigest?.crystalName !== crystalName) {
      await setParameterNoMutate({
        object_path: `${item._objectPath}.crystalName`,
        value: fileDigest.crystalName,
      });
      parametersUpdated = true;
    }

    if (fileDigest?.datasetName && fileDigest?.datasetName !== dataset) {
      await setParameterNoMutate({
        object_path: `${item._objectPath}.dataset`,
        value: fileDigest.datasetName,
      });
      parametersUpdated = true;
    }

    //Mutate the file digest to update the UI immediately
    if (parametersUpdated) mutateContainer();
  }, [
    item,
    fileDigest,
    setParameterNoMutate,
    setParameter,
    cell,
    wavelength,
    crystalName,
    dataset,
    mutateContainer,
  ]);

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

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  const hasValidationError = useMemo(() => {
    if (!item) return false;
    const result = getValidationColor(item) === "error.light";
    return result;
  }, [getValidationColor, item]);

  return (
    inferredVisibility &&
    fileObjectPath && (
      <CSimpleDataFileElement
        {...props}
        hasValidationError={hasValidationError}
        itemName={fileObjectPath}
        onChange={async () => {
          await handleChange();
        }}
      >
        {cellObjectPath && item._value["cell"] && (
          <CCP4i2TaskElement
            {...props}
            itemName={cellObjectPath}
            qualifiers={{ guiLabel: "Cell" }}
          />
        )}
        {true && (
          <Grid2 container rowSpacing={0} sx={{ mt: 2 }}>
            <Grid2 size={{ xs: 4 }}>
              <CCP4i2TaskElement
                key="crystalName"
                {...props}
                sx={{ my: 0, py: 0, minWidth: "10rem" }}
                itemName={`${crystalNameObjectPath}`}
                qualifiers={{
                  ...props.qualifiers,
                  guiLabel: "Crystal name",
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <CCP4i2TaskElement
                key="datasetName"
                {...props}
                sx={{ my: 0, py: 0, minWidth: "10rem" }}
                itemName={`${datasetObjectPath}`}
                qualifiers={{
                  ...props.qualifiers,
                  guiLabel: "Dataset name",
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <CCP4i2TaskElement
                key="wavelength"
                {...props}
                sx={{ my: 0, py: 0, minWidth: "10rem" }}
                itemName={`${wavelengthObjectPath}`}
                qualifiers={{
                  ...props.qualifiers,
                  guiLabel: "Wavelength",
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 4 }}>
              <Typography variant="body1">Batches in file</Typography>
            </Grid2>{" "}
            <Grid2 size={{ xs: 8 }}>
              <Typography variant="body1">
                {true &&
                  fileDigest &&
                  fileDigest?.batchs &&
                  JSON.stringify(fileDigest.batchs)}
              </Typography>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <CCP4i2TaskElement
                key="selected batch string"
                {...props}
                sx={{ mt: 1, mb: 0, py: 0, minWidth: "30rem" }}
                itemName={`${itemName}.excludeSelection`}
                qualifiers={{
                  ...props.qualifiers,
                  guiLabel: "Batch range(s) to exclude",
                  guiMode: "multiLine",
                }}
              />
            </Grid2>
          </Grid2>
        )}
      </CSimpleDataFileElement>
    )
  );
};
