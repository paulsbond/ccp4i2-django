import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import CCP4GraphPlot from "./CCP4i2Pimple";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElements";
//window.jQuery = window.$ = $;

export const useOnScreen = (ref: React.RefObject<HTMLElement>) => {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) =>
        setIntersecting(entry.isIntersecting)
      ),
    [ref]
  );

  useEffect(() => {
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [observer, ref]);

  return isIntersecting;
};

interface CCP4i2ReportFlotWidgetProps extends CCP4i2ReportElementProps {
  uniqueId?: string;
}

export const CCP4i2ReportFlotWidget: React.FC<CCP4i2ReportFlotWidgetProps> = (
  props
) => {
  const divRef = useRef<HTMLDivElement | null>(null);
  const isVisible = useOnScreen(divRef);
  const graphPlot = useRef<any>(null);

  useEffect(() => {
    return () => {
      //console.log('In dismount', graphPlot.current)
      if (graphPlot.current !== null) {
        graphPlot.current.destroy();
        graphPlot.current = null;
      }
    };
  }, []);

  const sluggifiedName = useMemo(() => {
    if (props.uniqueId)
      return CSS.escape(props.uniqueId).replace(/[^a-zA-Z0-9]/g, "_");
    return "UNNAMED_GRAPHPLOT";
  }, [props.uniqueId]);

  useEffect(() => {
    if (isVisible) {
      //console.log('In mount', graphPlot.current)
      if (graphPlot.current !== null) {
        graphPlot.current.destroy();
        graphPlot.current = null;
      }
      graphPlot.current = new CCP4GraphPlot(sluggifiedName, false);
      var tables = $(props.item).find("ccp4_data").toArray();
      if (tables.length == 0) {
        tables = $(props.item).find("ccp4\\:ccp4_data").toArray();
      }
      if (tables.length == 0) {
        tables = $(props.item).find("ns0\\:ccp4_data").toArray();
      }
      //try {
      graphPlot.current.loadXML(graphPlot.current, null, tables);
      if (graphPlot.current.graphs.length > 0) {
        graphPlot.current.setCurrentData(0);
        graphPlot.current.replot();
      }
      //}
      //catch (err) {
      //    message.error(`Graph plotting error ${JSON.stringify(err)}`)
      //}
    } else {
      //console.log('Graph is hidden')
      if (graphPlot.current !== null) {
        //console.log('Tearing graph down')
        graphPlot.current.destroy();
        graphPlot.current = null;
      }
    }
  }, [isVisible, props.item, props.uniqueId]);

  return (
    <div
      id={sluggifiedName}
      ref={divRef}
      style={{ width: 300, height: 300, float: "left" }}
    />
  );
};

export const prettifyXml = (sourceXml: Document) => {
  let theNode = sourceXml;
  if (theNode.nodeName == null) {
    //@ts-ignore
    theNode = sourceXml.get(0);
    //console.log('theNode', theNode)
    //Possible explanation is that the is a jQuery node
  }
  var xsltDoc = new DOMParser().parseFromString(
    [
      // describes how we want to modify the XML - indent everything
      '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:strip-space elements="*"/>',
      '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
      '    <xsl:value-of select="normalize-space(.)"/>',
      "  </xsl:template>",
      '  <xsl:template match="node()|@*">',
      '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
      "  </xsl:template>",
      '  <xsl:output indent="yes"/>',
      "</xsl:stylesheet>",
    ].join("\n"),
    "application/xml"
  );
  var xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(xsltDoc);
  var resultDoc = xsltProcessor.transformToDocument(theNode);
  var resultXml = new XMLSerializer().serializeToString(resultDoc);
  return resultXml;
};

export default CCP4i2ReportFlotWidget;
