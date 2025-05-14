import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { CContainerElement } from "./ccontainer";
import { Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { fullUrl, useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { ErrorInfo } from "./error-info";
import { useCallback, useEffect } from "react";

export const CAsuContentSeqElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job } = props;
  const {
    getTaskItem,
    getFileDigest,
    getValidationColor,
    setParameter,
    container,
    useAsyncEffect,
    mutateContainer,
    mutateValidation,
  } = useJob(job.id);

  const { item } = getTaskItem(itemName);
  const { update: setPolymerType } = getTaskItem(
    `${item._objectPath}.polymerType`
  );
  const { update: setName } = getTaskItem(`${item._objectPath}.name`);
  const { update: setSequence } = getTaskItem(`${item._objectPath}.sequence`);
  const { update: setDescription } = getTaskItem(
    `${item._objectPath}.description`
  );
  const setSEQUENCEFromSEQIN = useCallback(
    async (seqinDigest: any, annotation: string) => {
      if (
        !setSequence ||
        !setName ||
        !setPolymerType ||
        !setDescription ||
        !item ||
        job?.status != 1
      )
        return;
      const { name, moleculeType, sequence } = seqinDigest || {};
      console.log("New values", { name, moleculeType, sequence });
      await setPolymerType(moleculeType);
      const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
      await setName(sanitizedName);
      await setSequence(sequence);
      await setDescription(annotation);
      await mutateContainer();
      await mutateValidation();
    },
    [
      setSequence,
      setName,
      setPolymerType,
      setDescription,
      job,
      item,
      mutateContainer,
    ]
  );

  return (
    <Card sx={{ border: "3px solid", borderColor: getValidationColor(item) }}>
      <CardHeader
        title={item._qualifiers.guiLabel}
        sx={{ backgroundColor: getValidationColor(item) }}
        action={<ErrorInfo {...props} />}
      />
      <CardContent sx={{ my: 0, py: 0, pt: 2 }}>
        <Grid2 container rowSpacing={0} sx={{ my: 0, py: 0 }}>
          {item &&
            ["nCopies"].map((key) => (
              <Grid2 key={key} size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  sx={{ my: 0, py: 0, minWidth: "10rem" }}
                  itemName={`${item._objectPath}.${key}`}
                  qualifiers={{
                    guiLabel: key,
                    onlyEnumerators: true,
                  }}
                />
              </Grid2>
            ))}
          {item &&
            ["polymerType", "name"].map((key) => (
              <Grid2 key={key} size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  sx={{ my: 0, py: 0, minWidth: "10rem" }}
                  itemName={`${item._objectPath}.${key}`}
                  qualifiers={{
                    guiLabel: key,
                  }}
                />
              </Grid2>
            ))}
          {["description", "sequence"].map((key) => (
            <Grid2 key={key} size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                sx={{ my: 0, py: 0, minWidth: "calc(100% - 4rem)", mr: 2 }}
                itemName={`${item._objectPath}.${key}`}
                qualifiers={{
                  guiLabel: key,
                  guiMode: "multiLine",
                }}
              />
            </Grid2>
          ))}
          {["source"].map((key) => (
            <Grid2 key={key} size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                sx={{ my: 0, py: 0 }}
                itemName={`${item._objectPath}.${key}`}
                qualifiers={{
                  guiLabel: key,
                  guiMode: "multiLine",
                  mimeTypeName: "application/CCP4-seq",
                  downloadModes: ["uniprotFasta"],
                }}
                onFileChangeSuccess={async (updatedItem: any) => {
                  alert("Hello");
                  const { dbFileId, annotation } = valueOfItem(updatedItem);
                  const digest = await fetch(
                    fullUrl(`files/${dbFileId}/digest_by_uuid/`)
                  ).then((response) => response.json());
                  setSEQUENCEFromSEQIN(digest, annotation);
                }}
              />
            </Grid2>
          ))}
        </Grid2>
      </CardContent>
    </Card>
  );
};
