import { useApi } from "../../../api";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../../../utils";
import { Button, Card, CardContent, CardHeader, Grid2 } from "@mui/material";
import { ErrorInfo } from "./error-info";
import { useState } from "react";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

export const CCellElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { job, itemName } = props;
  const { getTaskItem, getValidationColor } = useJob(job.id);
  const item = getTaskItem(itemName);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ border: "3px solid", borderColor: getValidationColor(item) }}>
      <CardHeader
        title={item?._qualifiers?.guiLabel}
        sx={{ backgroundColor: getValidationColor(item) }}
        action={
          <>
            <ErrorInfo {...props} />
            <Button
              onClick={() => {
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </Button>
          </>
        }
      />
      <CardContent sx={{ my: 0, py: 0 }}>
        {item && expanded && (
          <Grid2 container rowSpacing={0} sx={{ my: 0, py: 0 }}>
            {Object.keys(item._value).map((objectKey: string) => (
              <Grid2 key={objectKey} size={{ xs: 4 }}>
                <CCP4i2TaskElement
                  {...props}
                  sx={{ my: 0, py: 0, minWidth: "5rem" }}
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
