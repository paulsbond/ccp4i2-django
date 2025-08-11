import { useCallback, useMemo } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../../../utils";
import { Grid2, Typography } from "@mui/material";
import { CSimpleDataFileElement } from "./csimpledatafile";

export const CImportUnmergedElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { itemName, job } = props;
  const {
    getTaskItem,
    useFileDigest,
    getValidationColor,
    setParameterNoMutate,
    mutateContainer,
    mutateValidation,
    mutateParams_xml,
  } = useJob(job.id);

  const { item } = getTaskItem(itemName);
  const { value: cell } = getTaskItem(`${itemName}.cell`);
  const { value: wavelength } = getTaskItem(`${itemName}.wavelength`);
  const { value: crystalName } = getTaskItem(`${itemName}.crystalName`);
  const { value: dataset } = getTaskItem(`${itemName}.dataset`);

  const fileObjectPath = item?._objectPath ? `${item._objectPath}.file` : null;
  const { data: fileDigest } = useFileDigest(fileObjectPath || "");

  // Parameter update mappings
  const parameterMappings = [
    { key: "cell", digestValue: fileDigest?.cell, currentValue: cell },
    {
      key: "wavelength",
      digestValue: fileDigest?.wavelength,
      currentValue: wavelength,
    },
    {
      key: "crystalName",
      digestValue: fileDigest?.crystalName,
      currentValue: crystalName,
    },
    {
      key: "dataset",
      digestValue: fileDigest?.datasetName,
      currentValue: dataset,
    },
  ];

  const handleChange = useCallback(async () => {
    if (!item || !setParameterNoMutate || !fileDigest) return;

    const updates = parameterMappings
      .filter(
        ({ digestValue, currentValue }) =>
          digestValue &&
          JSON.stringify(digestValue) !== JSON.stringify(currentValue)
      )
      .map(({ key, digestValue }) =>
        setParameterNoMutate({
          object_path: `${item._objectPath}.${key}`,
          value: digestValue,
        })
      );

    if (updates.length > 0) {
      await Promise.all(updates);
      await Promise.all([
        mutateContainer(),
        mutateValidation(),
        mutateParams_xml(),
      ]);
    }
  }, [
    item,
    fileDigest,
    setParameterNoMutate,
    cell,
    wavelength,
    crystalName,
    dataset,
    mutateContainer,
  ]);

  // Helper function for object paths
  const getObjectPath = (field: string) =>
    item ? `${item._objectPath}.${field}` : null;

  // Grid items configuration
  const gridItems = [
    { path: getObjectPath("crystalName"), label: "Crystal name" },
    { path: getObjectPath("dataset"), label: "Dataset name" },
    { path: getObjectPath("wavelength"), label: "Wavelength" },
  ];

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    return typeof props.visibility === "function"
      ? props.visibility()
      : props.visibility;
  }, [props.visibility]);

  const hasValidationError = useMemo(
    () => (item ? getValidationColor(item) === "error.light" : false),
    [getValidationColor, item]
  );

  if (!inferredVisibility || !fileObjectPath) return null;

  return (
    <CSimpleDataFileElement
      {...props}
      hasValidationError={hasValidationError}
      itemName={fileObjectPath}
      onChange={handleChange}
    >
      {getObjectPath("cell") && item._value["cell"] && (
        <CCP4i2TaskElement
          {...props}
          itemName={getObjectPath("cell")!}
          qualifiers={{ guiLabel: "Cell" }}
        />
      )}

      <Grid2 container rowSpacing={0} sx={{ mt: 2 }}>
        {gridItems.map(({ path, label }) => (
          <Grid2 key={label} size={{ xs: 4 }}>
            <CCP4i2TaskElement
              {...props}
              sx={{ my: 0, py: 0, minWidth: "10rem" }}
              itemName={path!}
              qualifiers={{
                ...props.qualifiers,
                guiLabel: label,
              }}
            />
          </Grid2>
        ))}

        <Grid2 size={{ xs: 4 }}>
          <Typography variant="body1">Batches in file</Typography>
        </Grid2>
        <Grid2 size={{ xs: 8 }}>
          <Typography variant="body1">
            {fileDigest?.batchs && JSON.stringify(fileDigest.batchs)}
          </Typography>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <CCP4i2TaskElement
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
    </CSimpleDataFileElement>
  );
};
