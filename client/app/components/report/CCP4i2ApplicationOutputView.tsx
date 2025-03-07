import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { parseXML, Plot, PlotLine } from "./Parser";
import {
  Chart as ChartJS,
  ChartOptions,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
  ChartData,
} from "chart.js";
import { Chart, ChartProps, Line, Scatter } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import { parse } from "path";
import { Autocomplete, Paper, TextField, Typography } from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface CCP4i2ApplicationOutputViewProps {
  output: Element;
}

const colours = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
];
export const CCP4i2ApplicationOutputView: React.FC<
  CCP4i2ApplicationOutputViewProps
> = ({ output }) => {
  const [graph, setGraph] = useState<any | null>(null);
  const [parsedOutput, setParsedOutput] = useState<any | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  useEffect(() => {
    const asyncEffect = async () => {
      const serializedOutput = new XMLSerializer().serializeToString(output);
      try {
        const parsedOutput = await parseXML(serializedOutput);
        setParsedOutput(parsedOutput);
        const graph = parsedOutput.CCP4Table;
        setGraph(graph);
        //@ts-ignore
        setSelectedPlot(Array.isArray(graph.plot) ? graph.plot[0] : graph.plot);
      } catch (err) {
        console.log(err);
      }
    };
    asyncEffect();
  }, [output]);

  const parsedDataBlocks = useMemo<any | null>(() => {
    if (graph) {
      let dataBlocks: any = {};
      if (Array.isArray(graph.data)) {
        dataBlocks = graph.data;
      } else {
        dataBlocks = [graph.data];
      }
      let parsedDataBlocks: any = {};

      dataBlocks.forEach((dataBlock: any) => {
        let actualRows: string = dataBlock;
        let dataBlockId: string = "_";
        if (typeof dataBlock === "object") {
          actualRows = dataBlock["_"];
          if (dataBlock.id) {
            dataBlockId = dataBlock.id;
          }
        }
        const data = actualRows.replace(/^\n/, ""); // Remove leading newline;
        const blockRows = data.split("\n");
        const parsedBlockRows: any[][] = blockRows.map((row: string) =>
          row.split(/\s+/).filter((item: string) => item.trim().length > 0)
        );
        parsedDataBlocks[dataBlockId] = parsedBlockRows;
      });
      return parsedDataBlocks;
    }
    return null;
  }, [graph]);

  const allPlots = useMemo<Plot[] | null>(() => {
    if (!graph) return null;
    if (Array.isArray(graph.plot)) return graph.plot;
    else return [graph.plot];
  }, [graph]);

  const allHeaders = useMemo<string[] | null>(() => {
    if (!graph) return null;
    let headers: string[];
    if (typeof graph.headers === "string" || graph.headers instanceof String) {
      headers = graph.headers.split(" ");
    } else {
      console.log("Non string headers: ", graph.headers);
      let separator = graph.headers.separator;
      if (!separator) separator = /\s+/;
      headers = graph.headers["_"]
        .split(separator)
        .map((header: string) => header.trim())
        .filter((header: string) => header.length > 0);
    }
    console.log("Headers is", { headers });
    return headers;
  }, [graph]);

  const plotData = useMemo<any | null>(() => {
    if (!selectedPlot || !parsedDataBlocks || !allHeaders) return null;

    if (
      !selectedPlot.plotline ||
      (Array.isArray(selectedPlot.plotline) &&
        selectedPlot.plotline.length == 0)
    )
      return null;

    const plotlineList = Array.isArray(selectedPlot.plotline)
      ? selectedPlot.plotline
      : [selectedPlot.plotline];

    const datasets = plotlineList.map(
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

        const dataset: any = {
          label: allHeaders[plotline.ycol - 1],
          labels: dataAsGrid.map(
            (row: any) => row[parseInt(`${plotline.xcol}`) - 1]
          ),
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
        return dataset;
      }
    );

    const result: any = {
      datasets: datasets,
    };
    console.log({ result });

    return result;
  }, [parsedDataBlocks, selectedPlot, allHeaders]);

  const options = useMemo<ChartOptions<"scatter">>(() => {
    if (!selectedPlot) return null;
    const result: ChartOptions<"scatter"> = {
      type: "scatter",
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: parsedOutput ? graph.title : "",
        },
      },
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title: {
            display: true,
            text: selectedPlot?.xlabel ? selectedPlot.xlabel : "",
          },
        },
        yAxisLeft: {
          axis: "y",
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: selectedPlot?.ylabel ? selectedPlot.ylabel : "",
          },
        },
        yAxisRight: {
          axis: "y",
          type: "linear",
          position: "right",
          grid: { display: false },
          title: {
            display: true,
            text: selectedPlot?.rylabel ? selectedPlot.rylabel : "",
          },
        },
      },
    };

    if (selectedPlot?.showlegend === "false") {
      result.plugins.legend = {
        display: false,
      };
    }

    if (selectedPlot.polygon) {
      result.plugins.annotation = {
        annotations: {
          polygon: {
            type: "box",
            xMax: Math.max(
              ...selectedPlot.polygon["_"]
                .split(" ")
                .filter((item: string, iItem: number) => !(iItem % 2))
                .map((item: string) => parseFloat(item))
            ),
            xMin: Math.min(
              ...selectedPlot.polygon["_"]
                .split(" ")
                .filter((item: string, iItem: number) => !(iItem % 2))
                .map((item: string) => parseFloat(item))
            ),
            yMax: Math.max(
              ...selectedPlot.polygon["_"]
                .split(" ")
                .filter((item: string, iItem: number) => iItem % 2)
                .map((item: string) => parseFloat(item))
            ),
            yMin: Math.min(
              ...selectedPlot.polygon["_"]
                .split(" ")
                .filter((item: string, iItem: number) => iItem % 2)
                .map((item: string) => parseFloat(item))
            ),
            drawTime: "beforeDatasetsDraw",
            backgroundColor: selectedPlot.polygon.fillcolour,
            strokeColor: selectedPlot.polygon.linecolour,
          },
        },
      };
    }

    if (selectedPlot?.text) {
      const textObject = {
        type: "label",
        xValue: parseFloat(selectedPlot.text.xpos), // X position (match a data point)
        yValue: parseFloat(selectedPlot.text.ypos), // Y position
        backgroundColor: "rgba(0,0,0, 0.2)",
        content: selectedPlot.text["_"],
        color: selectedPlot.text.colour,
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

      result.plugins.annotation.annotations.text = textObject;
    }

    if (selectedPlot?.xscale === "oneoversqrt") {
      result.plugins.tooltip = {
        callbacks: {
          label: (tooltipItem) =>
            `Res: ${(1 / Math.sqrt(tooltipItem.raw.x)).toPrecision(3)}, ${
              tooltipItem.dataset.label
            }: ${tooltipItem.raw.y}`,
        },
      };
    }

    //Custom tick scenarios
    if (selectedPlot.xintegral && selectedPlot.xintegral === "true") {
      //@ts-ignore
      result.scales.x.ticks = {
        stepSize: 1, // Force integer steps
        callback: (value: any) => (Number.isInteger(value) ? value : null), // Hide non-integer labels
      };
    } else if (selectedPlot?.xscale === "oneoversqrt") {
      //@ts-ignore
      result.scales.x.ticks = {
        callback: (value: any, index: number) =>
          (1 / Math.sqrt(value)).toPrecision(3), // Hide non-integer labels
      };
    } else if (selectedPlot?.customXLabels) {
      //@ts-ignore
      result.scales.x.ticks = {
        callback: (value: any, index: number) =>
          selectedPlot.customXLabels.split(",")[index], // Hide non-integer labels
      };
    }

    if (
      (selectedPlot?.xlabel === "Phi" && selectedPlot?.ylabel === "Psi") ||
      selectedPlot?.fixaspectratio === "true"
    ) {
      result.maintainAspectRatio = true;
      result.aspectRatio = 1;
    }

    if (selectedPlot?.xrange?.min) {
      result.scales.x.min = selectedPlot.xrange.min;
    }
    if (selectedPlot?.xrange?.max) {
      result.scales.x.max = selectedPlot.xrange.max;
    }
    if (selectedPlot?.yrange?.min) {
      result.scales.yAxisLeft.min = parseFloat(selectedPlot.yrange.min);
    }
    if (selectedPlot?.yrange?.max) {
      result.scales.yAxisLeft.max = parseFloat(selectedPlot.yrange.max);
    }
    console.log({ options: result });
    return result;
  }, [graph, selectedPlot]);

  return (
    <Paper sx={{ maxHeight: 400 }}>
      {allPlots && selectedPlot && allPlots.length > 1 && (
        <Autocomplete
          sx={{ mt: 1, mb: 1, px: 0, py: 0 }}
          options={allPlots}
          getOptionKey={(option) => allPlots.indexOf(option)}
          getOptionLabel={(option) => option.title || "Unnamed plot"}
          onChange={(event, newValue) => {
            console.log({ newValue });
            setSelectedPlot(newValue);
          }}
          value={selectedPlot}
          renderInput={(params) => (
            <TextField {...params} size="small" label="Plot" />
          )}
        />
      )}
      {options && plotData && (
        <Scatter options={options} width="400" height="400" data={plotData} />
      )}
      {false && (
        <Editor
          height="calc(100vh - 15rem)"
          value={JSON.stringify(parsedOutput, null, 2)}
          language="json"
        />
      )}
    </Paper>
  );
};

function colorNameToRGBA(colorName: string, alpha: number = 0.5): string {
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

function hexToRGBA(hex: string, alpha: number = 0.5): string {
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
