import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import CCP4GraphPlot from "./CCP4i2Pimple";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";
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
  selected?: boolean;
}

export const CCP4i2ReportFlotWidget: React.FC<CCP4i2ReportFlotWidgetProps> = ({
  item,
  uniqueId,
  selected = true,
}) => {
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
    if (uniqueId) return CSS.escape(uniqueId).replace(/[^a-zA-Z0-9]/g, "_");
    return "UNNAMED_GRAPHPLOT";
  }, [uniqueId]);

  useEffect(() => {
    if (isVisible && selected) {
      //console.log('In mount', graphPlot.current)
      if (graphPlot.current !== null) {
        graphPlot.current.destroy();
        graphPlot.current = null;
      }
      graphPlot.current = new CCP4GraphPlot(sluggifiedName, false);
      var tables = $(item).find("ccp4_data").toArray();
      if (tables.length == 0) {
        tables = $(item).find("ccp4\\:ccp4_data").toArray();
      }
      if (tables.length == 0) {
        tables = $(item).find("ns0\\:ccp4_data").toArray();
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
  }, [isVisible, item, uniqueId]);

  return (
    <div
      id={sluggifiedName}
      ref={divRef}
      style={{ width: 300, height: 300, float: "left" }}
    />
  );
};

export default CCP4i2ReportFlotWidget;
