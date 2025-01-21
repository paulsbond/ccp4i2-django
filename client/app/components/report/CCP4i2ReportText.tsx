import React, { useEffect, useState } from "react";
import $ from "jquery";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";

export const CCP4i2ReportText: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [style, setStyle] = useState<any>({});
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    const possibleStyle = $(props.item).attr("style");
    if (possibleStyle) {
      setStyle(cssToDict(possibleStyle));
    }
    setInnerHTML(props.item.innerHTML);
  }, [props.item, props.job]);

  return <span style={style} dangerouslySetInnerHTML={{ __html: innerHTML }} />;
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
