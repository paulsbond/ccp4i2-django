import React, { useMemo } from "react";
import $ from "jquery";
import { Typography } from "@mui/material";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";

export const CCP4i2ReportReference: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  const title = useMemo(() => {
    if (!props.item) return "";
    try {
      return $(props.item).attr("articleTitle");
    } catch (err) {
      return "";
    }
  }, [props.item]);

  const authors = useMemo(() => {
    if (!props.item) return "";
    try {
      return $(props.item).attr("authors");
    } catch (err) {
      return "";
    }
  }, [props.item]);

  const journal = useMemo(() => {
    if (!props.item) return "";
    try {
      return $(props.item).attr("journal");
    } catch (err) {
      return "";
    }
  }, [props.item]);

  const year = useMemo(() => {
    if (!props.item) return "";
    try {
      return $(props.item).attr("year");
    } catch (err) {
      return "";
    }
  }, [props.item]);

  return (
    <Typography variant="body2" component="p">
      {title && <strong>{title}</strong>}
      {authors && ` by ${authors}`}
      {journal && `, ${journal}`}
      {year && ` (${year})`}
    </Typography>
  );
};
