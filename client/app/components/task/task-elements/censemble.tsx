import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../../../utils";
import { Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { ErrorInfo } from "./error-info";
import { useMemo } from "react";

export const CEnsembleElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { job, itemName } = props;
  const { getTaskItem, getValidationColor } = useJob(job.id);
  const item = getTaskItem(itemName);

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  return (
    inferredVisibility && (
      <Card sx={{ border: "3px solid", borderColor: getValidationColor(item) }}>
        <CardHeader
          title={item._qualifiers.guiLabel}
          sx={{ backgroundColor: getValidationColor(item) }}
          action={<ErrorInfo {...props} />}
        />
        <CardContent sx={{ my: 0, py: 0 }}>
          {item && (
            <Grid2 container rowSpacing={0} sx={{ my: 0, py: 0 }}>
              <Grid2 key={"number"} size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  sx={{ my: 0, py: 0, minWidth: "10rem" }}
                  itemName={`${item._objectPath}.number`}
                  qualifiers={{
                    ...getTaskItem(`${item._objectPath}.number`)._qualifiers,
                    guiLabel: "copies",
                  }}
                />
              </Grid2>
              <Grid2 key={"label"} size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  sx={{ my: 0, py: 0, minWidth: "10rem" }}
                  itemName={`${item._objectPath}.label`}
                  qualifiers={{ ...props.qualifiers, guiLabel: "label" }}
                />
              </Grid2>
              <Grid2 key={"use"} size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  sx={{ my: 0, py: 0, minWidth: "10rem" }}
                  itemName={`${item._objectPath}.use`}
                  qualifiers={{
                    ...getTaskItem(`${item._objectPath}.use`)._qualifiers,
                    guiLabel: "use",
                  }}
                />
              </Grid2>
            </Grid2>
          )}
          <CCP4i2TaskElement
            {...props}
            sx={{ my: 0, py: 0, minWidth: "10rem" }}
            itemName={`${item._objectPath}.pdbItemList`}
            qualifiers={{
              ...getTaskItem(`${item._objectPath}.pdbItemList`)._qualifiers,
              guiLabel: "pdbItemList",
            }}
          />
        </CardContent>
      </Card>
    )
  );
};
