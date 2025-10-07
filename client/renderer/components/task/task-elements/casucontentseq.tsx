import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { CCP4i2ContainerElement } from "./ccontainer";
import { Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { makeApiUrl, useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { ErrorInfo } from "./error-info";
import { apiGet } from "../../../api-fetch";
import { useCallback, useEffect } from "react";

export const CAsuContentSeqElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job } = props;
  const { useTaskItem, getValidationColor, mutateContainer, mutateValidation } =
    useJob(job.id);

  const { item } = useTaskItem(itemName);
  const { update: setPolymerType } = useTaskItem(
    `${item._objectPath}.polymerType`
  );
  const { update: setName } = useTaskItem(`${item._objectPath}.name`);
  const { update: setSequence } = useTaskItem(`${item._objectPath}.sequence`);
  const { update: setDescription } = useTaskItem(
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
        !seqinDigest ||
        job?.status != 1
      )
        return;
      if (seqinDigest?.moleculeType) {
        console.log("Seqin digest was a sequence file");
        const { name, moleculeType, sequence } = seqinDigest || {};
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
        await setPolymerType(moleculeType);
        await setName(sanitizedName);
        await setSequence(sequence);
        await setDescription(annotation);
        await mutateContainer();
        await mutateValidation();
        props.onChange?.({ name, moleculeType, sequence });
      } else if (seqinDigest?.composition) {
        console.log("Seqin digest was a coordinate file");
        const { name, moleculeType, sequence } = {
          name: `Chain_${seqinDigest.composition.peptides[0]}`,
          moleculeType: "PROTEIN",
          sequence:
            seqinDigest.sequences[seqinDigest.composition.peptides[0]] || "",
        };
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
        await setPolymerType(moleculeType);
        await setName(sanitizedName);
        await setSequence(sequence);
        await setDescription(annotation);
        await mutateContainer();
        await mutateValidation();
        props.onChange?.({ name, moleculeType, sequence });
      }
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
                  suppressMutations={true}
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
                  suppressMutations={true}
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
                suppressMutations={true}
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
                  downloadModes: ["uniprotFasta", "ebiPdb"],
                }}
                onChange={async (updatedItem: any) => {
                  console.log("Fetch file for param", updatedItem);
                  const { dbFileId, annotation } = valueOfItem(updatedItem);
                  const digest = await apiGet(
                    makeApiUrl(`files/${dbFileId}/digest_by_uuid/`)
                  );
                  console.log({ digest, annotation });
                  setSEQUENCEFromSEQIN(digest, annotation);
                }}
                suppressMutations={true}
              />
            </Grid2>
          ))}
        </Grid2>
      </CardContent>
    </Card>
  );
};
