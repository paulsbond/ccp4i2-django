import { Card, CardContent, CardHeader } from "@mui/material";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { useApi } from "../../../api";
import { itemsForName } from "../task-utils";

interface CCP4i2ContainerProps extends CCP4i2TaskElementProps {
  containerHint?: "FolderLevel" | "BlockLevel";
}
export const CCP4i2Container: React.FC<
  PropsWithChildren<CCP4i2ContainerProps>
> = ({ job, itemName, children, containerHint, visibility, qualifiers }) => {
  const api = useApi();
  const [visibilityPrompt, setVisibilityPrompt] = useState<number>(0);
  const visibilityPromptRef = useRef<number>(0);

  const { data: container } = api.container<any>(`jobs/${job.id}/container`);

  const inferredVisibility = useMemo(() => {
    if (!visibility) return true;
    if (typeof visibility === "function") {
      return visibility();
    }
    return visibility;
  }, [visibility]);

  const item = useMemo<any | null>(() => {
    if (container && itemName) {
      const matches = itemsForName(itemName, container);
      console.log(itemName, matches[0]);
      return matches[0];
    }
    return null;
  }, [itemName, container]);

  return containerHint === "FolderLevel" || containerHint === "BlockLevel"
    ? inferredVisibility && (
        <Card sx={{ mb: 1 }}>
          {qualifiers.guiLabel && (
            <CardHeader
              title={qualifiers.guiLabel}
              sx={{ my: 0 }}
              titleTypographyProps={{ variant: "h6", my: 0, py: 0 }}
            />
          )}
          <CardContent>{children}</CardContent>
        </Card>
      )
    : inferredVisibility && <div>{children} </div>;
};
