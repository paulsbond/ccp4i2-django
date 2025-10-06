import { useCallback, useMemo } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob, valueOfItem } from "../../../utils";
import { apiGet } from "../../../api-fetch";
import { Grid2, Typography } from "@mui/material";
import { CSimpleDataFileElement } from "./csimpledatafile";

export const CImportUnmergedElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { itemName, job } = props;
  const {
    useTaskItem,
    useFileDigest,
    getValidationColor,
    setParameterNoMutate,
    mutateContainer,
    mutateValidation,
    mutateParams_xml,
  } = useJob(job.id);

  const { item } = useTaskItem(itemName);
  const { value: cell, update: updateCell } = useTaskItem(`${itemName}.cell`);
  const { value: wavelength, update: updateWavelength } = useTaskItem(
    `${itemName}.wavelength`
  );
  const { value: crystalName, update: updateCrystalName } = useTaskItem(
    `${itemName}.crystalName`
  );
  const { value: dataset, update: updateDataset } = useTaskItem(
    `${itemName}.dataset`
  );

  const fileObjectPath = useMemo(
    () => (item?._objectPath ? `${item._objectPath}.file` : null),
    [item]
  );
  const { data: fileDigest, mutate: mutateFileDigest } = useFileDigest(
    fileObjectPath || ""
  );

  const handleChange = useCallback(
    async (updated: any) => {
      if (!item || !setParameterNoMutate || !updated) return;
      const updatedValue = valueOfItem(updated);
      const fileDigest = await apiGet(
        `/api/proxy/files/${updatedValue.dbFileId}/digest_by_uuid/`
      );
      const updates: Promise<any>[] = [];
      if (
        fileDigest?.cell &&
        JSON.stringify(fileDigest?.cell) !== JSON.stringify(cell)
      ) {
        updates.push(updateCell(fileDigest?.cell));
      }
      if (
        fileDigest?.wavelength &&
        JSON.stringify(fileDigest?.wavelength) !== JSON.stringify(wavelength)
      ) {
        updates.push(updateWavelength(fileDigest?.wavelength));
      }
      if (
        fileDigest?.crystalName &&
        JSON.stringify(fileDigest?.crystalName) !== JSON.stringify(crystalName)
      ) {
        updates.push(updateCrystalName(fileDigest?.crystalName));
      }
      if (
        fileDigest?.crystalName &&
        JSON.stringify(fileDigest?.datasetName) !== JSON.stringify(dataset)
      ) {
        updates.push(updateDataset(fileDigest?.datasetName));
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        await Promise.all([
          mutateContainer(),
          mutateValidation(),
          mutateParams_xml(),
        ]);
      }
    },
    [
      item,
      fileDigest,
      setParameterNoMutate,
      cell,
      wavelength,
      crystalName,
      dataset,
      mutateContainer,
    ]
  );

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
