import { ChartOptions } from "chart.js";
import { data } from "jquery";
import { parseStringPromise } from "xml2js";

const colours = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
];

export interface CCP4ApplicationOutput {
  CCP4Table?: CCP4Table[];
  Fonts?: Fonts;
  CCP4Surface?: Surface;
  title?: string;
}

export interface CCP4Table {
  headers?: Header[];
  data?: Data[];
  plot?: Plot[];
  title?: string;
}

export interface Header {
  _: string;
  separator?: string;
}

export interface Data {
  _: string;
  separator?: string;
  id?: string;
}

export interface Plot {
  title?: string;
  plotline?: PlotLine[] | PlotLine;
  histogram?: Histogram[];
  barchart?: BarChart[];
  xlabel?: string;
  ylabel?: string;
  rylabel?: string;
  description?: string;
  xintegral?: string;
  xrange?: { min?: number; max?: number };
  yrange?: { min?: number; max?: number };
  polygon?: any[] | any;
  circle?: any[] | any;
  line?: any[] | any;
  text?: any[] | any;
  xscale?: string;
  customXTicks?: string;
  customXLabels?: string;
  showlegend?: "true" | "false";
  fixaspectratio?: "true" | "false";
}

export interface PlotLine {
  xcol: number;
  ycol: number;
  dataid?: string;
  rightaxis?: string;
  colour?: string;
  linestyle?: string;
  showlegend?: "true" | "false";
}

export interface Histogram {
  col: number;
  colour?: string;
  nbins?: number;
  binwidth?: number;
}

export interface BarChart {
  col?: number;
  tcol?: number;
  colour?: string;
  width?: string;
  rightaxis?: string;
  dataid?: string;
}

export interface Fonts {
  titleFont?: FontLine;
  legendFont?: FontLine;
  axesTickerFont?: FontLine;
}

export interface FontLine {
  _: string;
  family?: string;
  size?: number;
  weight?: string;
  slant?: string;
}

export interface Surface {
  _: string;
  rows?: number;
  columns?: number;
  title?: string;
}

export const parseXML = async (xml: string): Promise<CCP4ApplicationOutput> => {
  const nsStripped = stripNamespaces(xml);
  const tablised = changeTagName(nsStripped, "ccp4_data", "CCP4Table");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(tablised, "application/xml");
  const oldElements = xmlDoc.getElementsByTagName("CCP4Table");
  const firstTable = oldElements[0];
  // Serialize back to string
  const serializer = new XMLSerializer();
  const firstTableString = serializer.serializeToString(firstTable);

  const result = await parseStringPromise(firstTableString, {
    explicitArray: false,
    mergeAttrs: true,
  });
  return result as CCP4ApplicationOutput;
};

function stripNamespaces(xmlString: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  function processNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Create a new element without namespace
      const newElement = xmlDoc.createElement(element.localName);

      // Copy attributes (without namespace)
      Array.from(element.attributes).forEach((attr) => {
        newElement.setAttribute(attr.name, attr.value);
      });

      // Move child nodes
      while (element.firstChild) {
        newElement.appendChild(element.firstChild);
      }

      // Replace the old element with the new one
      const parent = element.parentNode;
      if (parent) {
        parent.replaceChild(newElement, element);
        // Process child nodes
        newElement.childNodes.forEach(processNode);
      }
    }
  }

  processNode(xmlDoc);

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

function changeTagNameNS(
  xmlString: string,
  namespaceURI: string,
  oldTagName: string,
  newTagName: string
): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  console.log({ xmlDoc });
  // Get all elements with the old tag name in the namespace
  const oldElements = xmlDoc.getElementsByTagNameNS(namespaceURI, oldTagName);
  console.log({ oldElements });

  // Convert NodeList to array (since NodeList is live)
  const elementsArray: Element[] = Array.from(oldElements);

  elementsArray.forEach((oldElement) => {
    // Create a new element with the same namespace
    const newElement = xmlDoc.createElementNS(namespaceURI, newTagName);

    // Copy attributes
    Array.from(oldElement.attributes).forEach((attr) => {
      newElement.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
    });

    // Move child nodes to the new element
    while (oldElement.firstChild) {
      newElement.appendChild(oldElement.firstChild);
    }

    // Replace the old element with the new one
    const parent = oldElement.parentNode;
    if (parent) {
      parent.replaceChild(newElement, oldElement);
    }
  });

  // Serialize XML back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

function changeTagName(
  xmlString: string,
  oldTagName: string,
  newTagName: string,
  namespaceURI?: string
): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  console.log("In changeTagName", { xmlDoc });
  function processNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Check if the element matches the old tag name and optional namespace
      if (
        element.localName === oldTagName &&
        (!namespaceURI || element.namespaceURI === namespaceURI)
      ) {
        const newElement = namespaceURI
          ? xmlDoc.createElementNS(namespaceURI, newTagName) // Preserve namespace if provided
          : xmlDoc.createElement(newTagName); // Otherwise, create without namespace

        // Copy attributes
        Array.from(element.attributes).forEach((attr) => {
          newElement.setAttribute(attr.name, attr.value);
        });

        // Move child nodes
        while (element.firstChild) {
          newElement.appendChild(element.firstChild);
        }

        // Replace the old element with the new one
        const parent = element.parentNode;
        if (parent) {
          parent.replaceChild(newElement, element);
          processNode(newElement); // Recursive call to process children
        }
      }
    }

    // Process child nodes
    node.childNodes.forEach(processNode);
  }

  processNode(xmlDoc.documentElement);

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

export const addPlotLines = (selectedPlot: Plot, result: ChartOptions) => {
  if (!selectedPlot.plotline) return;
  const plotlineList: PlotLine[] = Array.isArray(selectedPlot?.plotline)
    ? (selectedPlot.plotline as PlotLine[])
    : [selectedPlot.plotline as PlotLine];
  const rightAxisPlotlines = plotlineList.filter(
    (plotline: PlotLine) => plotline.rightaxis === "true"
  );
  if (rightAxisPlotlines.length > 0) {
    if (!result.scales) result.scales = {};
    result.scales.yAxisRight = {
      axis: "y",
      type: "linear",
      position: "right",
      grid: { display: false },
      title: {
        display: true,
        text: selectedPlot?.rylabel ? selectedPlot.rylabel : "",
      },
    };
    result.scales.yAxisRight.ticks = {
      callback: (value: string | number, index: number) => {
        if (typeof value === "string") {
          return value;
        } else if (Number.isInteger(value)) {
          return value;
        }
        return value.toPrecision(3);
      },
    };
  }
};

export const extractDatasets = (
  selectedPlot: Plot,
  parsedDataBlocks: any,
  allHeaders: string[]
) => {
  if (!selectedPlot.plotline && !selectedPlot.barchart) return null;
  const nPlotlines: number = Array.isArray(selectedPlot.plotline)
    ? selectedPlot.plotline.length
    : selectedPlot.plotline
    ? 1
    : 0;
  const nBarcharts: number = Array.isArray(selectedPlot.barchart)
    ? selectedPlot.barchart.length
    : selectedPlot.barchart
    ? 1
    : 0;
  if (nPlotlines + nBarcharts === 0) return null;

  const plotlineList = Array.isArray(selectedPlot.plotline)
    ? selectedPlot.plotline
    : selectedPlot.plotline
    ? [selectedPlot.plotline]
    : [];

  const plotlineDatasets = plotlineList.map(
    (plotline: PlotLine, iPlotline: number) => {
      let dataAsGrid: any[][] = [];
      if (
        plotline.dataid &&
        Object.keys(parsedDataBlocks).includes(plotline.dataid)
      ) {
        dataAsGrid = parsedDataBlocks[plotline.dataid];
      } else if (Object.keys(parsedDataBlocks).includes("_")) {
        dataAsGrid = parsedDataBlocks["_"];
      } else return null;

      const dataset: any = extractPlotLineDataset(
        dataAsGrid,
        allHeaders,
        plotline,
        iPlotline
      );
      return dataset;
    }
  );

  const barChartList = Array.isArray(selectedPlot.barchart)
    ? selectedPlot.barchart
    : selectedPlot.barchart
    ? [selectedPlot.barchart]
    : [];
  const barChartDatasets = barChartList.map(
    (barChart: BarChart, iBarChart: number) => {
      let dataAsGrid: any[][] = [];
      if (
        barChart.dataid &&
        Object.keys(parsedDataBlocks).includes(barChart.dataid)
      ) {
        dataAsGrid = parsedDataBlocks[barChart.dataid];
      } else if (Object.keys(parsedDataBlocks).includes("_")) {
        dataAsGrid = parsedDataBlocks["_"];
      } else return null;

      const dataset: any = extractBarChartDataset(
        dataAsGrid,
        allHeaders,
        barChart,
        iBarChart
      );
      return dataset;
    }
  );

  return plotlineDatasets.concat(barChartDatasets);
};

export const extractPlotLineDataset = (
  dataAsGrid: any[][],
  allHeaders: string[],
  plotline: PlotLine,
  iPlotline: number
) => {
  const result = {
    label: allHeaders[plotline.ycol - 1],
    labels: dataAsGrid.map((row: any) => row[parseInt(`${plotline.xcol}`) - 1]),
    yAxisID: plotline.rightaxis
      ? plotline.rightaxis === "true"
        ? "yAxisRight"
        : "yAxisLeft"
      : "yAxisLeft",
    data: dataAsGrid.map((row) => ({
      x: row[parseInt(`${plotline.xcol}`) - 1],
      y: row[parseInt(`${plotline.ycol}`) - 1],
    })),
    backgroundColor: plotline.colour
      ? plotline.colour.startsWith("#")
        ? hexToRGBA(plotline.colour, 0.5)
        : colorNameToRGBA(plotline.colour, 0.5)
      : colorNameToRGBA(colours[iPlotline % colours.length], 0.5),
    borderColor: plotline.colour
      ? plotline.colour
      : colours[iPlotline % colours.length],
    showLine: plotline.linestyle !== ".",
  };
  return result;
};

export const extractBarChartDataset = (
  dataAsGrid: any[][],
  allHeaders: string[],
  barChart: BarChart,
  iBarChart: number
) => {
  const result = {
    label: allHeaders[barChart.tcol - 1],
    labels: dataAsGrid.map((row: any) => row[parseInt(`${barChart.col}`) - 1]),
    yAxisID: barChart.rightaxis
      ? barChart.rightaxis === "true"
        ? "yAxisRight"
        : "yAxisLeft"
      : "yAxisLeft",
    data: dataAsGrid.map((row) => ({
      x: row[parseInt(`${barChart.col}`) - 1],
      y: row[parseInt(`${barChart.tcol}`) - 1],
    })),
    backgroundColor: barChart.colour
      ? barChart.colour.startsWith("#")
        ? hexToRGBA(barChart.colour, 0.5)
        : colorNameToRGBA(barChart.colour, 0.5)
      : colorNameToRGBA(colours[iBarChart % colours.length], 0.5),
    borderColor: barChart.colour
      ? barChart.colour
      : colours[iBarChart % colours.length],
    showLine: true,
  };
  return result;
};

export const addLines = (selectedPlot: Plot, result: ChartOptions) => {
  if (!selectedPlot.line) return;
  let lines: any[] = [];
  if (Array.isArray(selectedPlot.line)) {
    lines = selectedPlot.line;
  } else {
    lines = [selectedPlot.line];
  }
  lines.forEach((line: any, iLine: number) => {
    if (!result.plugins) result.plugins = {};
    if (!result.plugins.annotation) result.plugins.annotation = {};
    if (!result.plugins.annotation.annotations)
      result.plugins.annotation.annotations = {};
    const lineObject = {
      type: "line",
      xMin: parseFloat(line.x1),
      yMin: parseFloat(line.y1),
      xMax: parseFloat(line.x2),
      yMax: parseFloat(line.y2),
      drawTime: "beforeDatasetsDraw",
      borderColor: line.linecolour
        ? line.alpha
          ? line.fillcolour.startsWith("#")
            ? hexToRGBA(line.fillcolour, parseFloat(line.alpha))
            : colorNameToRGBA(line.fillcolour, parseFloat(line.alpha))
          : line.fillcolour
        : "rgba(0,0,0,0)",
    };
    result.plugins.annotation.annotations[`line-${iLine}`] = lineObject;
  });
};

export const addPolygons = (selectedPlot: Plot, result: ChartOptions) => {
  let polygons: any[] = [];
  if (Array.isArray(selectedPlot.polygon)) {
    polygons = selectedPlot.polygon;
  } else {
    polygons = [selectedPlot.polygon];
  }
  polygons.forEach((polygon: any, iPolygon: number) => {
    if (!result.plugins) result.plugins = {};
    if (!result.plugins.annotation) result.plugins.annotation = {};
    if (!result.plugins.annotation.annotations)
      result.plugins.annotation.annotations = {};
    const boxObject = {
      type: "box",
      xMax: Math.max(
        ...polygon["_"]
          .split(" ")
          .filter((item: string, iItem: number) => !(iItem % 2))
          .map((item: string) => parseFloat(item))
      ),
      xMin: Math.min(
        ...polygon["_"]
          .split(" ")
          .filter((item: string, iItem: number) => !(iItem % 2))
          .map((item: string) => parseFloat(item))
      ),
      yMax: Math.max(
        ...polygon["_"]
          .split(" ")
          .filter((item: string, iItem: number) => iItem % 2)
          .map((item: string) => parseFloat(item))
      ),
      yMin: Math.min(
        ...polygon["_"]
          .split(" ")
          .filter((item: string, iItem: number) => iItem % 2)
          .map((item: string) => parseFloat(item))
      ),
      drawTime: "beforeDatasetsDraw",
      backgroundColor: polygon.fillcolour
        ? polygon.alpha
          ? polygon.fillcolour.startsWith("#")
            ? hexToRGBA(polygon.fillcolour, parseFloat(polygon.alpha))
            : colorNameToRGBA(polygon.fillcolour, parseFloat(polygon.alpha))
          : polygon.fillcolour
        : "rgba(0,0,0,0)",
      strokeColor: polygon.linecolour || "rgba(0,0,0,1)",
    };
    result.plugins.annotation.annotations[`polygon-${iPolygon}`] = boxObject;
  });
};

export const addCircles = (selectedPlot: Plot, result: ChartOptions) => {
  let circles: any[] = [];
  if (Array.isArray(selectedPlot.circle)) {
    circles = selectedPlot.circle;
  } else {
    circles = [selectedPlot.circle];
  }
  circles.forEach((circle: any, iCircle: number) => {
    if (!result.plugins) result.plugins = {};
    if (!result.plugins.annotation) result.plugins.annotation = {};
    if (!result.plugins.annotation.annotations)
      result.plugins.annotation.annotations = {};
    const circleObject = {
      type: "ellipse",
      xMax: parseFloat(circle.xpos) + parseFloat(circle.radius),
      xMin: parseFloat(circle.xpos) - parseFloat(circle.radius),
      yMax: parseFloat(circle.ypos) + parseFloat(circle.radius),
      yMin: parseFloat(circle.ypos) - parseFloat(circle.radius),
      drawTime: "beforeDatasetsDraw",
      backgroundColor: circle.fillcolour
        ? circle.alpha
          ? circle.fillcolour.startsWith("#")
            ? hexToRGBA(circle.fillcolour, parseFloat(circle.alpha))
            : colorNameToRGBA(circle.fillcolour, parseFloat(circle.alpha))
          : circle.fillcolour
        : "rgba(0,0,0,0)",
      strokeColor: circle.linecolour,
    };
    result.plugins.annotation.annotations[`circle-${iCircle}`] = circleObject;
  });
};

export const addTexts = (selectedPlot: Plot, result: ChartOptions) => {
  if (selectedPlot?.text) {
    let texts: any[] = [];
    if (Array.isArray(selectedPlot.text)) {
      texts = selectedPlot.text;
    } else {
      texts = [selectedPlot.text];
    }
    texts.forEach((text, iText) => {
      const textObject = {
        type: "label",
        xValue: parseFloat(text.xpos), // X position (match a data point)
        yValue: parseFloat(text.ypos), // Y position
        backgroundColor: "rgba(0,0,0, 0.0)",
        content: text["_"],
        color: text.colour,
        font: {
          size: 14,
          weight: "bold",
        },
        padding: 6,
        borderRadius: 4,
      };
      if (!result.plugins) result.plugins = {};
      if (!result.plugins.annotation) result.plugins.annotation = {};
      if (!result.plugins.annotation.annotations)
        result.plugins.annotation.annotations = {};
      result.plugins.annotation.annotations[`text-${iText}`] = textObject;
    });
  }
};

export const handleOneOverSqrt = (
  selectedPlot: Plot,
  result: ChartOptions<"scatter">
) => {
  if (!result.scales) result.scales = {};
  if (!result.scales.x) result.scales.x = {};
  result.scales.x.ticks = {
    callback: (value: any, index: number) =>
      (1 / Math.sqrt(value)).toPrecision(3), // Hide non-integer labels
  };
  if (!result.plugins) result.plugins = {};
  result.tooltip = {
    callbacks: {
      label: (tooltipItem: any) =>
        `Res: ${(1 / Math.sqrt(tooltipItem.raw.x)).toPrecision(3)}, ${
          tooltipItem.dataset.label
        }: ${tooltipItem.raw.y}`,
    },
  };
};

export const handleXIntegral = (
  selectedPlot: Plot,
  result: ChartOptions<"scatter">
) => {
  if (!result.scales) result.scales = {};
  if (!result.scales.x) result.scales.x = {};
  if (selectedPlot.xintegral && selectedPlot.xintegral === "true") {
    result.scales.x.ticks = {
      stepSize: 1, // Force integer steps
      callback: (value: any) => (Number.isInteger(value) ? value : null), // Hide non-integer labels
    };
  }
};

export const handleCustomXLabels = (
  selectedPlot: Plot,
  result: ChartOptions<"scatter">
) => {
  //@ts-ignore
  result.scales.x.ticks = {
    callback: (value: string | number, index: number) => {
      if (selectedPlot.customXLabels) {
        return selectedPlot.customXLabels.split(",")[index]; // Hide non-integer labels
      }
      return "";
    },
  };
};

export const handleRangeSpecifiers = (
  selectedPlot: Plot,
  result: ChartOptions<"scatter">
) => {
  if (selectedPlot?.xrange?.min) {
    if (!result?.scales) result.scales = {};
    if (!result?.scales.x) result.scales.x = {};
    result.scales.x.min = selectedPlot.xrange.min;
  }
  if (selectedPlot?.xrange?.max) {
    if (!result?.scales) result.scales = {};
    if (!result?.scales.x) result.scales.x = {};
    result.scales.x.max = selectedPlot.xrange.max;
  }
  if (selectedPlot?.yrange?.min) {
    if (!result?.scales) result.scales = {};
    if (!result?.scales.yAxisLeft) result.scales.yAxisLeft = {};
    result.scales.yAxisLeft.min = selectedPlot.yrange.min;
  }
  if (selectedPlot?.yrange?.max) {
    if (!result?.scales) result.scales = {};
    if (!result?.scales.yAxisLeft) result.scales.yAxisLeft = {};
    result.scales.yAxisLeft.max = selectedPlot.yrange.max;
  }
};

export function colorNameToRGBA(
  colorName: string,
  alpha: number = 0.5
): string {
  // Ensure alpha value is between 0 and 1
  if (alpha < 0 || alpha > 1) {
    throw new Error("Alpha value must be between 0 and 1");
  }

  // Create a temporary element to access the computed color value
  const tempElement = document.createElement("div");
  tempElement.style.color = colorName;
  document.body.appendChild(tempElement);

  // Get the computed RGB color
  const rgb = window.getComputedStyle(tempElement).color;

  // Remove the temporary element from the DOM
  document.body.removeChild(tempElement);

  // rgb will be in format "rgb(r, g, b)"
  const rgbValues = rgb.match(/\d+/g); // Extracts the numeric values

  if (!rgbValues) {
    throw new Error("Invalid color name");
  }

  // Convert the extracted values to an RGBA string
  return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${alpha})`;
}

export function hexToRGBA(hex: string, alpha: number = 0.5): string {
  // Ensure alpha value is between 0 and 1
  if (alpha < 0 || alpha > 1) {
    throw new Error("Alpha value must be between 0 and 1");
  }

  // Check if the hex is in the valid format (#RRGGBB or #RGB)
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexRegex.test(hex)) {
    throw new Error("Invalid hex color");
  }

  // If the hex is 3 characters, convert it to 6 characters (e.g. #FFF -> #FFFFFF)
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  // Extract RGB values from the hex color
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Return the RGBA string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
