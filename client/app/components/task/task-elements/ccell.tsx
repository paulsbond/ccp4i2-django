import { useApi } from "../../../api";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../task-utils";
import { Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { ErrorInfo } from "./error-info";

export const CCellElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { job, itemName } = props;
  const { getTaskItem, getValidationColor } = useJob(job);
  const item = getTaskItem(itemName);

  return (
    <Card
      sx={{ border: "3px solid", borderColor: getValidationColor(itemName) }}
    >
      <CardHeader
        title={item._qualifiers.guiLabel}
        sx={{ backgroundColor: getValidationColor(itemName) }}
        action={<ErrorInfo {...props} />}
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
                    ...getTaskItem(`${item._objectPath}.${objectKey}`)
                      ._qualifiers,
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
