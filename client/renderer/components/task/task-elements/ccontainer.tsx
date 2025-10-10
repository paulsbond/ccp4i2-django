import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Grid2,
  GridSize,
  Stack,
  SxProps,
  Typography,
} from "@mui/material";
import React, { PropsWithChildren, useMemo, useRef, useState } from "react";
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

interface CCP4i2ContainerElementProps extends CCP4i2TaskElementProps {
  size?: SizeProps;
  initiallyOpen?: boolean;
  containerHint?: "FolderLevel" | "BlockLevel" | "RowLevel";
  elementSx?: SxProps;
  excludeItems?: string[];
}

export const CCP4i2ContainerElement: React.FC<
  PropsWithChildren<CCP4i2ContainerElementProps>
> = (props) => {
  const {
    job,
    itemName,
    children,
    containerHint = "FolderLevel",
    initiallyOpen = true,
    visibility,
    qualifiers,
    size = { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
    elementSx,
  } = props;

  const { useTaskItem, getValidationColor } = useJob(job.id);
  const { item } = useTaskItem(itemName);
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

  // Get validation color for border when itemName is provided
  const validationBorderColor = useMemo(() => {
    if (itemName && item) {
      return getValidationColor(item);
    }
    return "divider"; // Default border color
  }, [itemName, item, getValidationColor]);

  const childNames = useMemo(() => {
    if (item) {
      let names: string[] = [];

      if (
        Array.isArray(item?._CONTENTS_ORDER) &&
        item._CONTENTS_ORDER.length > 0
      ) {
        names = item._CONTENTS_ORDER;
      } else if (item._value && item._value.constructor == Object) {
        names = Object.keys(item._value);
      }

      // Filter out excluded items if excludeItems prop is provided
      if (props.excludeItems && props.excludeItems.length > 0) {
        names = names.filter((name) => !props.excludeItems?.includes(name));
      }

      return names;
    }
    return [];
  }, [item, props.excludeItems]);

  // Helper function to determine if an item should be full width
  const shouldBeFullWidth = useMemo(() => {
    return (childItem: any): boolean => {
      const itemClass = childItem?._class;
      const baseClass = childItem?._baseClass;

      return (
        itemClass === "CList" ||
        itemClass === "CUnmergedDataFileList" ||
        baseClass === "CDataFile"
      );
    };
  }, []);

  const calculatedContent = useMemo(() => {
    return item ? (
      <Grid2 container spacing={0} key={item._objectPath}>
        {childNames.map((childName: string) => {
          const childObjectPath = `${item._objectPath}.${childName}`;
          const { item: childItem } = useTaskItem(childObjectPath);

          // Determine grid size based on item class/baseClass
          const gridSize = shouldBeFullWidth(childItem)
            ? { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } // Full width for all breakpoints
            : size;

          console.log(
            childItem._objectPath,
            childItem._baseClass,
            gridSize,
            size,
            elementSx
          );

          return (
            <Grid2 key={childObjectPath} size={gridSize}>
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
  }, [
    item,
    elementSx,
    childNames,
    useTaskItem,
    props,
    size,
    shouldBeFullWidth,
  ]);

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
  }, [children, size]);

  // Subtle border container styling with validation color
  const subtleBorderContainerSx = useMemo(
    () => ({
      mx: 2,
      px: 2,
      py: 1.5,
      border: 2, // Slightly thicker border to make validation colors more visible
      borderColor: validationBorderColor,
      borderRadius: 1,
      backgroundColor: "background.paper",
      "&:hover": {
        borderColor:
          validationBorderColor === "divider"
            ? "primary.light"
            : validationBorderColor,
      },
    }),
    [validationBorderColor]
  );

  // Card styling with validation color
  const cardSx = useMemo(
    () => ({
      mx: 2,
      px: 0,
      border: 2,
      borderColor: validationBorderColor,
    }),
    [validationBorderColor]
  );

  // Stack styling with validation color for RowLevel
  const stackSx = useMemo(
    () => ({
      mx: 2,
      px: 2,
      py: 1,
      pb: 3,
      border: 2,
      borderColor: validationBorderColor,
      borderRadius: 1,
    }),
    [itemName, validationBorderColor]
  );

  return containerHint === "FolderLevel" ? (
    inferredVisibility ? (
      <Card sx={cardSx}>
        <CardHeader
          sx={{ py: 1 }}
          title={qualifiers.guiLabel}
          onClick={(ev) => {
            ev.stopPropagation();
            setOpen(!open);
          }}
          variant="lightGrey"
          action={
            <Stack direction="row">
              <MyExpandMore
                expand={open}
                aria-expanded={open}
                aria-label="show more"
              >
                <ExpandMore sx={{ color: "text.primary" }} />{" "}
                {/* Change icon color to black */}
              </MyExpandMore>
              {item && <ErrorInfo {...props} />}
            </Stack>
          }
        />
        <CardContent sx={{ px: 0, pt: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            {calculatedContent}
            {griddedChildren}
          </Collapse>
        </CardContent>
      </Card>
    ) : null
  ) : containerHint === "BlockLevel" ? (
    inferredVisibility ? (
      <Box sx={subtleBorderContainerSx}>
        <Typography
          variant="body1"
          component="div"
          sx={{
            mb: 1,
            fontWeight: 500,
            color: "text.primary",
          }}
        >
          {qualifiers.guiLabel}
        </Typography>
        {calculatedContent}
        {griddedChildren}
      </Box>
    ) : null
  ) : containerHint == "RowLevel" ? (
    inferredVisibility ? (
      <Stack direction="row" sx={stackSx}>
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
