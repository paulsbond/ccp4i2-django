import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import CCP4GraphPlot from "./CCP4i2Pimple";
window.jQuery = window.$ = $;

export const useOnScreen = (ref) => {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) =>
        setIntersecting(entry.isIntersecting)
      ),
    [ref]
  );

  useEffect(() => {
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [observer, ref]);

  return isIntersecting;
};

export const CCP4i2ReportFlotWidget = (props) => {
  const divRef = useRef(null);
  const isVisible = useOnScreen(divRef);
  const graphPlot = useRef(null);

  useEffect(() => {
    return () => {
      //console.log('In dismount', graphPlot.current)
      if (graphPlot.current !== null) {
        graphPlot.current.destroy();
        graphPlot.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      //console.log('In mount', graphPlot.current)
      if (graphPlot.current !== null) {
        graphPlot.current.destroy();
        graphPlot.current = null;
      }
      graphPlot.current = new CCP4GraphPlot(props.uniqueId, false);
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
    <div id={props.uniqueId} ref={divRef} style={{ width: 300, height: 300 }} />
  );
};

const prettifyXml = (sourceXml) => {
  var theNode = sourceXml;
  if (theNode.nodeName == null) {
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
