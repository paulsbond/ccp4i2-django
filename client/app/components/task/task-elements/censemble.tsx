import { useApi } from "../../../api";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useTaskItem, useValidation, validationColor } from "../task-utils";
import { Button, Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { Info } from "@mui/icons-material";
import { ErrorInfo } from "./error-info";

export const CEnsembleElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const api = useApi();
  const { job, itemName } = props;
  const { data: container } = api.container<any>(`jobs/${job.id}/container`);
  const useItem = useTaskItem(container);
  const item = useItem(itemName);
  const { getErrors } = useValidation(job.id);

  const fieldErrors = getErrors(item._objectPath);

  return (
    <Card
      sx={{ border: "3px solid", borderColor: validationColor(fieldErrors) }}
    >
      <CardHeader
        title={item._qualifiers.guiLabel}
        sx={{ backgroundColor: validationColor(fieldErrors) }}
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
                  ...useItem(`${item._objectPath}.number`)._qualifiers,
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
                  ...useItem(`${item._objectPath}.use`)._qualifiers,
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
            ...useItem(`${item._objectPath}.pdbItemList`)._qualifiers,
            guiLabel: "pdbItemList",
          }}
        />
      </CardContent>
    </Card>
  );
};
