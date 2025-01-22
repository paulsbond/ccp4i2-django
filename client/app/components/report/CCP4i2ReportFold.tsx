import React, { useEffect, useState } from "react";
import $ from "jquery";
import { Collapse, Grid2, Toolbar, Typography } from "@mui/material";
import { MyExpandMore } from "../expand-more";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  CCP4i2ReportElement,
  CCP4i2ReportElementProps,
} from "./CCP4i2ReportElement";

export const CCP4i2ReportFold: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [foldContent, setFoldContent] = useState<React.ReactNode[]>([]);
  const [nFloatingChildren, setNFloatingChildren] = useState(1);
  const [expanded, setExpanded] = useState(
    $(props.item).attr("initiallyOpen") === "True"
  );

  useEffect(() => {
    if (props.item) {
      let nFloatingChildren = 0;
      for (var child of $(props.item).children()) {
        try {
          if ($(child).attr("style") === undefined) {
            continue;
          }
          const styleString: string = $(child).attr("style") as string;
          var childCssDict = cssToDict(styleString);
          if (Object.keys(childCssDict).includes("float")) {
            const oldStyle = styleString;
            const fixedStyle = oldStyle
              .replace("float:left;", "")
              .replace("float:right;", "");
            //console.log({ oldStyle, fixedStyle });
            $(child).attr("style", fixedStyle);
            nFloatingChildren += 1;
          }
        } catch (err) {}
      }
      setNFloatingChildren(nFloatingChildren);
    }
  }, [props.item]);

  useEffect(() => {
    try {
      let newContent: React.ReactNode[] = $(props.item)
        .children()
        .toArray()
        .map((child, iChild) => (
          <CCP4i2ReportElement
            key={`${iChild}`}
            iItem={iChild}
            item={child}
            job={props.job}
          />
        ));
      setFoldContent(newContent);
    } catch (err) {
      console.log(err);
    }
  }, [props.item]);

  return (
    <>
      <Toolbar
        variant="dense"
        sx={{ backgroundColor: "primary.main", color: "primary.contrastText" }}
        key={$(props.item).attr("key")}
        onClick={(ev) => {
          ev.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        <MyExpandMore
          expand={expanded}
          onClick={(ev) => {
            ev.stopPropagation();
            setExpanded(!expanded);
          }}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </MyExpandMore>
        {$(props.item).attr("label")}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1 }}
        ></Typography>
      </Toolbar>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {nFloatingChildren > 0 ? (
          <Grid2 container>
            {foldContent.map((iItem, item) => (
              <Grid2 size={{ xs: 12 / nFloatingChildren }}>{item}</Grid2>
            ))}
          </Grid2>
        ) : (
          foldContent
        )}
      </Collapse>
    </>
  );
};

function cssToDict(cssText: string) {
  const regex = /([\w-]*)\s*:\s*([^;]*)/g;
  var match,
    properties: any = {};

  while ((match = regex.exec(cssText))) {
    const camelCase = match[1]
      .trim()
      .replace(/-(.)/g, (m, p) => p.toUpperCase());
    properties[camelCase] = match[2];
  }
  return properties;
}
