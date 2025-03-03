import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { CContainerElement } from "./ccontainer";
import { Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { useApi } from "../../../api";
import { useJob } from "../../../utils";
import { ErrorInfo } from "./error-info";

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
  } = useJob(job.id);
  const item = getTaskItem(itemName);

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
                    ...getTaskItem(`${item._objectPath}.${key}`)._qualifiers,
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
                    ...getTaskItem(`${item._objectPath}.${key}`)._qualifiers,
                    guiLabel: key,
                  }}
                />
              </Grid2>
            ))}
          {["description", "sequence"].map((key) => (
            <Grid2 key={key} size={{ xs: 12 }}>
              <CCP4i2TaskElement
                {...props}
                sx={{ my: 0, py: 0, minWidth: "100%", mr: 2 }}
                itemName={`${item._objectPath}.${key}`}
                qualifiers={{
                  ...getTaskItem(`${item._objectPath}.${key}`)._qualifiers,
                  guiLabel: key,
                  multiLine: true,
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
                  ...getTaskItem(`${item._objectPath}.${key}`)._qualifiers,
                  guiLabel: key,
                  multiLine: true,
                  mimeTypeName: "application/CCP4-seq",
                }}
              />
            </Grid2>
          ))}
        </Grid2>
      </CardContent>
    </Card>
  );
};
