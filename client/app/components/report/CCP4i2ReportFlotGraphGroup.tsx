import React, { useState, useMemo, useEffect } from "react";
import $ from "jquery";
import CCP4i2ReportFlotWidget from "./CCP4i2ReportFlotWidget";
import { Autocomplete, TextField } from "@mui/material";

import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";
import { CCP4i2ApplicationOutputView } from "./CCP4i2ApplicationOutputView";

export const CCP4i2ReportFlotGraphGroup: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    console.log(props.item);
  }, [props.item]);

  const xmlGraphs = useMemo(() => {
    if (props.item && props.job) {
      const childGraphs = $(props.item).children().toArray();
      return childGraphs;
    }
    return [];
  }, [props.item, props.job]);

  const groupTitle = useMemo<string>(() => {
    const possibleTitle = $(props.item).attr("title");
    if (possibleTitle) return possibleTitle;
    return `Graph of ${xmlGraphs.length} graphs`;
  }, [props.item]);

  const graphTitles = useMemo<string[]>(() => {
    const graphTitles: string[] = [];

    xmlGraphs.forEach((childGraph, iGraph) => {
      const ccp4DataTitleNode = $(childGraph).find("ns0\\:ccp4_data")[0];
      let ccp4DataTitle = `Graph ${iGraph}`;
      try {
        const possibleTitle = $(ccp4DataTitleNode).attr("title");
        if (possibleTitle) {
          ccp4DataTitle = possibleTitle;
        } else {
          ccp4DataTitle = "Graph " + iGraph;
        }
      } catch (e) {
        console.log(e);
      }
      graphTitles.push(ccp4DataTitle);
    });
    return graphTitles;
  }, [xmlGraphs]);

  const graphs = useMemo(() => {
    if (xmlGraphs && props.job) {
      const result = xmlGraphs.map((child, iChild) => {
        const tableNode = $(child).find("ccp4_data, ns0\\:ccp4_data")[0];
        const result = (
          <CCP4i2ApplicationOutputView key={`${iChild}`} output={tableNode} />
        );
        /*<CCP4i2ReportFlotWidget
          key={`${iChild}`}
          iItem={iChild}
          item={child}
          job={props.job}
        />*/
        return result;
      });
      return result;
    }
    return [];
  }, [xmlGraphs, props.job]);

  const options = useMemo<{ label: string; id: number }[]>(() => {
    return graphs.map((item, iItem) => {
      return {
        label: graphTitles[iItem],
        id: iItem,
      };
    });
  }, [graphs]);

  const graphToDraw = useMemo(() => {
    return graphs.find((graph, iGraph) => iGraph === shown);
  }, [graphs, shown]);

  return (
    graphs.length > 0 &&
    xmlGraphs.length > 0 &&
    graphTitles.length > 0 && (
      <div style={{ height: "450px" }}>
        {$(props.item).attr("title")}
        {graphs && graphs.length > 1 && (
          <Autocomplete
            defaultValue={
              graphTitles && graphTitles.length > 0 ? graphTitles[0] : "0"
            }
            //@ts-ignore
            options={options}
            onChange={(ev, newValue) => {
              console.log(ev, newValue);
              //@ts-ignore
              setShown(newValue.id);
            }}
            renderInput={(params) => (
              <TextField {...params} size="small" label={groupTitle} />
            )}
          />
        )}
        {graphToDraw}
      </div>
    )
  );
};
