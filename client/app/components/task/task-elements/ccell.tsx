import { useApi } from "../../../api";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useTaskItem, useValidation, validationColor } from "../task-utils";
import { Button, Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { Info } from "@mui/icons-material";

export const CCellElement: React.FC<CCP4i2TaskElementProps> = (props) => {
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
        action={
          <Button>
            <Info />
          </Button>
        }
      />
      <CardContent sx={{ my: 0, py: 0 }}>
        {item && (
          <Grid2 container rowSpacing={0} sx={{ my: 0, py: 0 }}>
            {Object.keys(item._value).map((objectKey: string) => (
              <Grid2 key={objectKey} size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  sx={{ my: 0, py: 0, minWidth: "10rem" }}
                  key={objectKey}
                  itemName={`${item._objectPath}.${objectKey}`}
                  qualifiers={{
                    ...useItem(`${item._objectPath}.${objectKey}`)._qualifiers,
                    guiLabel: objectKey,
                  }}
                />
              </Grid2>
            ))}
          </Grid2>
        )}
      </CardContent>
    </Card>
  );
};
