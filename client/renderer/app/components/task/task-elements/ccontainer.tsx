import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Grid2,
  GridSize,
  Paper,
  Stack,
  SxProps,
  Typography,
} from "@mui/material";
import React, {
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../../../utils";
import { ErrorInfo } from "./error-info";
import { MyExpandMore } from "../../expand-more";
import { ExpandMore } from "@mui/icons-material";

interface SizeProps {
  xs?: GridSize | null;
  sm?: GridSize | null;
  md?: GridSize | null;
  lg?: GridSize | null;
  xl?: GridSize | null;
}
interface CContainerElementProps extends CCP4i2TaskElementProps {
  size?: SizeProps;
  initiallyOpen?: boolean;
  containerHint?: "FolderLevel" | "BlockLevel" | "RowLevel";
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
    initiallyOpen = true,
    visibility,
    qualifiers,
    size = { xl: 12 },
    elementSx,
  } = props;
  const { getTaskItem } = useJob(job.id);
  const { item } = getTaskItem(itemName);
  const [visibilityPrompt, setVisibilityPrompt] = useState<number>(0);
  const visibilityPromptRef = useRef<number>(0);
  const [open, setOpen] = useState(initiallyOpen);

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
    return item ? (
      <Grid2 container spacing={0} key={item._objectPath}>
        {childNames.map((childName: string) => {
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
        })}
      </Grid2>
    ) : null;
  }, [item, elementSx, childNames]);

  const griddedChildren = useMemo(() => {
    if (children) {
      return (
        <Grid2 container spacing={0} sx={{ mt: 1 }}>
          {React.Children.map(children, (child) => {
            return <Grid2 size={size}>{child}</Grid2>;
          })}
        </Grid2>
      );
    }
    return null;
  }, [children]);

  return containerHint === "FolderLevel" ? (
    inferredVisibility ? (
      <Card>
        <CardHeader
          variant="primary"
          title={qualifiers.guiLabel}
          onClick={(ev) => {
            ev.stopPropagation();
            setOpen(!open);
          }}
          action={
            <Stack direction="row">
              <MyExpandMore
                expand={open}
                aria-expanded={open}
                aria-label="show more"
              >
                <ExpandMore sx={{ color: "primary.contrastText" }} />
              </MyExpandMore>
              {item && <ErrorInfo {...props} />}
            </Stack>
          }
        />
        <CardContent>
          <Collapse in={open} timeout="auto" unmountOnExit>
            {calculatedContent}
            {griddedChildren}
          </Collapse>
        </CardContent>
      </Card>
    ) : null
  ) : containerHint === "BlockLevel" ? (
    inferredVisibility ? (
      <Paper>
        <Typography variant="h6" noWrap component="div">
          {qualifiers.guiLabel}
        </Typography>
        {calculatedContent} {griddedChildren}
      </Paper>
    ) : null
  ) : containerHint == "RowLevel" ? (
    inferredVisibility ? (
      <Stack direction="row">
        {calculatedContent}
        {griddedChildren}
      </Stack>
    ) : null
  ) : inferredVisibility ? (
    <div>
      {calculatedContent}
      {griddedChildren}
    </div>
  ) : null;
};
