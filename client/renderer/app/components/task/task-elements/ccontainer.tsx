import {
  Card,
  CardContent,
  CardHeader,
  Grid2,
  GridSize,
  SxProps,
  Typography,
} from "@mui/material";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../../../utils";
import { ErrorInfo } from "./error-info";

interface SizeProps {
  xs?: GridSize | null;
  sm?: GridSize | null;
  md?: GridSize | null;
  lg?: GridSize | null;
  xl?: GridSize | null;
}
interface CContainerElementProps extends CCP4i2TaskElementProps {
  size?: SizeProps;
  containerHint?: "FolderLevel" | "BlockLevel";
  elementSx?: SxProps;
}
export const CContainerElement: React.FC<
  PropsWithChildren<CContainerElementProps>
> = (props) => {
  const {
    job,
    itemName,
    children,
    containerHint = "FolderLevel",
    visibility,
    qualifiers,
    size = { xs: 12 },
    elementSx,
  } = props;
  const { getTaskItem } = useJob(job.id);
  const { item } = getTaskItem(itemName);
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
        Array.isArray(item?._CONTENTS_ORDER) &&
        item._CONTENTS_ORDER.length > 0
      ) {
        return item._CONTENTS_ORDER;
      } else if (item._value && item._value.constructor == Object) {
        return Object.keys(item._value);
      }
      return [];
    }
    return [];
  }, [item]);

  const calculatedContent = useMemo(() => {
    return childNames.map((childName: string) => {
      const childObjectPath = `${item._objectPath}.${childName}`;
      const { item: childItem } = getTaskItem(childObjectPath);
      return (
        <Grid2 key={childObjectPath} size={size}>
          <CCP4i2TaskElement
            key={childObjectPath}
            {...props}
            sx={elementSx}
            itemName={childObjectPath}
            qualifiers={{ ...childItem._qualifiers }}
          />
        </Grid2>
      );
    });
  }, [item, elementSx, childNames]);

  return containerHint === "FolderLevel" || containerHint === "BlockLevel"
    ? inferredVisibility && (
        <Card sx={{ mb: 1, p: 1 }}>
          {qualifiers.guiLabel && (
            <CardHeader
              title={qualifiers.guiLabel}
              sx={{ my: 0, py: 0 }}
              slotProps={{ title: { variant: "h6", my: 0, py: 0 } }}
              action={item && <ErrorInfo {...props} />}
            />
          )}
          <CardContent sx={{ py: 0.5, px: 1 }}>
            {children}
            <Grid2 container spacing={0.5}>
              {calculatedContent}
            </Grid2>
          </CardContent>
        </Card>
      )
    : inferredVisibility && <div>{children} </div>;
};
