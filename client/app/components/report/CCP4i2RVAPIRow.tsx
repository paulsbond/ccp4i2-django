import React, { useEffect, useState } from "react";
import $ from "jquery";
import { Grid } from "@mui/material";
import CCP4i2ReportFlotWidget from "./CCP4i2ReportFlotWidget";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";

export const CCP4i2RVAPIRow: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [content, setContent] = useState<
    JQuery<React.JSX.Element> | undefined
  >();

  useEffect(() => {
    let newContent = $(props.item)
      .find("td")
      .map((iCol, col) => {
        if ($(col).find("div[data-renderer]").length > 0) {
          return (
            <Grid item key={iCol}>
              <CCP4i2ReportFlotWidget
                //Might the following line be because col is found bysearching from dt element
                //@ts-ignore
                item={$(col)}
                iItem={iCol}
                uniqueId={$(col).find("div[data-renderer]").data("data")}
              />
            </Grid>
          );
        } else {
          return (
            <Grid
              item
              key={iCol}
              dangerouslySetInnerHTML={{ __html: col.innerHTML }}
            />
          );
        }
      });
    setContent(newContent);
  }, [props.job, props.item]);

  return <Grid container>{content}</Grid>;
};
