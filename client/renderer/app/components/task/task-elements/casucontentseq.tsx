import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { CContainerElement } from "./ccontainer";
import { Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { fullUrl, useApi } from "../../../api";
import { useJob, usePrevious } from "../../../utils";
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
  const { value: SEQIN } = getTaskItem(`${item._objectPath}.source`);
  const oldSEQIN = usePrevious(SEQIN);
  const { update: setPolymerType } = getTaskItem(
    `${item._objectPath}.polymerType`
  );
  const { update: setName } = getTaskItem(`${item._objectPath}.name`);
  const { value: SEQUENCETEXT, update: setSEQUENCETEXT } = getTaskItem(
    `${item._objectPath}.sequence`
  );
  const setSEQUENCEFromSEQIN = useCallback(async () => {
    console.log("in setSEQUENCEFromSEQIN", setSEQUENCETEXT);
    if (!setSEQUENCETEXT || !setName || !setPolymerType || !item) return;

    const seqinDigest = await fetch(
      fullUrl(`jobs/${job.id}/digest?object_path=${item._objectPath}.source`)
    ).then((response) => response.json());
    console.log({ seqinDigest });
    const newSequence = seqinDigest?.digest?.sequence || "";
    if (job?.status == 1 && newSequence !== SEQUENCETEXT) {
      console.log({
        setPolymerType: await setPolymerType(seqinDigest?.digest?.moleculeType),
      });
      const sanitizedName = seqinDigest?.digest?.name.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      console.log({ setName: await setName(sanitizedName) });
      await setSEQUENCETEXT(seqinDigest?.digest?.sequence);
      await mutateContainer();
      await mutateValidation();
    }
  }, [
    setSEQUENCETEXT,
    setName,
    setPolymerType,
    job,
    item,
    mutateContainer,
    SEQUENCETEXT,
  ]);

  //And here the useEffect which triggeers that callback*only( when SEQIN changes from one defined value to another)
  useEffect(() => {
    console.log("source changed");
    const asyncFunc = async () => {
      console.log(SEQIN, JSON.stringify(SEQIN), JSON.stringify(oldSEQIN));
      if (SEQIN && JSON.stringify(SEQIN) !== JSON.stringify(oldSEQIN)) {
        console.log({ oldSEQIN, SEQIN });
        await setSEQUENCEFromSEQIN();
        await mutateContainer();
      }
    };
    asyncFunc();
  }, [SEQIN]);

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
              />
            </Grid2>
          ))}
        </Grid2>
      </CardContent>
    </Card>
  );
};
