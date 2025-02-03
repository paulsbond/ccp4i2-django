import { Card, CardContent, CardHeader } from "@mui/material";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useApi } from "../../../api";
import { itemsForName, useTaskItem } from "../task-utils";
import { ErrorInfo } from "./error-info";

interface CContainerElementProps extends CCP4i2TaskElementProps {
  containerHint?: "FolderLevel" | "BlockLevel";
}
export const CContainerElement: React.FC<
  PropsWithChildren<CContainerElementProps>
> = (props) => {
  const api = useApi();
  const {
    job,
    itemName,
    children,
    containerHint = "FolderLevel",
    visibility,
    qualifiers,
  } = props;
  const { data: container } = api.container<any>(`jobs/${job.id}/container`);
  const useItem = useTaskItem(container);
  const item = useItem(itemName);
  const [visibilityPrompt, setVisibilityPrompt] = useState<number>(0);
  const visibilityPromptRef = useRef<number>(0);

  const inferredVisibility = useMemo(() => {
    if (!visibility) return true;
    if (typeof visibility === "function") {
      return visibility();
    }
    return visibility;
  }, [visibility]);

  const childNames = useMemo(() => {
    if (item) {
      if (
        Array.isArray(item?._CONTENT_ORDER) &&
        item._CONTENTS_ORDER.length > 0
      ) {
        return item._CONTENTS_ORDER;
      } else if (item._value && item._value.constructor == Object) {
        return Object.keys(item._value);
      }
      return [];
    }
  }, [item]);

  return containerHint === "FolderLevel" || containerHint === "BlockLevel"
    ? inferredVisibility && (
        <Card sx={{ mb: 1 }}>
          {qualifiers.guiLabel && (
            <CardHeader
              title={qualifiers.guiLabel}
              sx={{ my: 0 }}
              titleTypographyProps={{ variant: "h6", my: 0, py: 0 }}
              action={<ErrorInfo {...props} />}
            />
          )}
          <CardContent>
            {children}
            {childNames.map((childName: string) => (
              <CCP4i2TaskElement
                key={`${item._objectPath}.${childName}`}
                {...props}
                itemName={`${item._objectPath}.${childName}`}
                qualifiers={{ ...props, guiLabel: childName }}
              />
            ))}
          </CardContent>
        </Card>
      )
    : inferredVisibility && <div>{children} </div>;
};
