import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addCircles,
  addLines,
  addPolygons,
  addTexts,
  extractDatasets,
  handleCustomXLabels,
  handleOneOverSqrt,
  handleRangeSpecifiers,
  handleXIntegral,
  parseXML,
  Plot,
  PlotLine,
} from "./ChartLib";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Chart, Bar, Scatter } from "react-chartjs-2";

import annotationPlugin from "chartjs-plugin-annotation";
import { parse } from "path";
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Preview } from "@mui/icons-material";

// Register components for both Scatter and Bar charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
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
  const [showJson, setShowJson] = useState(false);
  const chartRef = useRef(null);

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
    const datasets = extractDatasets(
      selectedPlot,
      parsedDataBlocks,
      allHeaders
    );
    if (!datasets) return null;
    const result: any = {
      datasets: datasets,
    };
    return result;
  }, [parsedDataBlocks, selectedPlot, allHeaders]);

  const isBarChart = useMemo(() => {
    return Boolean(selectedPlot?.barchart);
  }, [selectedPlot]);

  const options = useMemo<ChartOptions>(() => {
    if (!selectedPlot) return null;
    const result: ChartOptions = {
      type: isBarChart ? "bar" : "scatter",
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
          axis: "x",
          type: "linear",
          position: "bottom",
          title: {
            display: true,
            text: selectedPlot?.xlabel ? selectedPlot.xlabel : "",
          },
          ticks: {
            callback: (value: string | number, index: number) => {
              if (typeof value === "string") {
                return value;
              } else if (Number.isInteger(value)) {
                return value;
              }
              return value.toPrecision(3);
            },
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
          ticks: {
            callback: (value: string | number, index: number) => {
              if (typeof value === "string") {
                return value;
              } else if (Number.isInteger(value)) {
                return value;
              }
              return value.toPrecision(3);
            },
          },
        },
      },
    };

    handleRangeSpecifiers(selectedPlot, result);

    const plotlines = Array.isArray(selectedPlot.plotline)
      ? selectedPlot.plotline
      : selectedPlot.plotline
      ? [selectedPlot.plotline]
      : [];
    if (
      plotlines.filter((plotline: PlotLine) => plotline.showlegend === "false")
        .length > 0
    ) {
      if (!result.plugins) result.plugins = {};
      result.plugins.legend = {
        display: false,
      };
    } else {
      if (!result.plugins) result.plugins = {};
      result.plugins.legend = {
        display: true,
        position: "chartArea",
        customLegend: {
          id: "customLegend",
          afterDraw(chart) {
            const ctx: CanvasRenderingContext2D = chart.ctx;
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)"; // Semi-transparent background
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; // Semi-transparent background
            ctx.fillRect(
              chart.chartArea.left + 20,
              chart.chartArea.top + 10,
              120,
              30
            ); // Positioning
          },
        },
      };
    }

    if (selectedPlot.polygon) {
      addPolygons(selectedPlot, result);
    }

    if (selectedPlot.circle) {
      addCircles(selectedPlot, result);
    }

    if (selectedPlot.line) {
      addLines(selectedPlot, result);
    }

    if (selectedPlot?.text) {
      addTexts(selectedPlot, result);
    }

    if (selectedPlot?.xscale === "oneoversqrt") {
      handleOneOverSqrt(selectedPlot, result);
    }

    //Custom tick scenarios
    if (selectedPlot?.xintegral) {
      handleXIntegral(selectedPlot, result);
    }

    if (selectedPlot?.customXLabels) {
      handleCustomXLabels(selectedPlot, result);
    }

    if (
      (selectedPlot?.xlabel === "Phi" && selectedPlot?.ylabel === "Psi") ||
      selectedPlot?.fixaspectratio === "true"
    ) {
      result.maintainAspectRatio = true;
      result.aspectRatio = 1;
    }

    console.log({ options: result });
    return result;
  }, [graph, selectedPlot]);

  return (
    <>
      <Card>
        <CardHeader
          title={
            allPlots &&
            selectedPlot &&
            allPlots.length > 0 && (
              <Autocomplete
                sx={{ mt: 1, mb: 1, px: 0, py: 0 }}
                options={allPlots}
                getOptionKey={(option) => allPlots.indexOf(option)}
                getOptionLabel={(option) => option.title || "Unnamed plot"}
                onChange={(event, newValue) => {
                  setSelectedPlot(newValue);
                }}
                disabled={allPlots.length === 1}
                value={selectedPlot}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Plot" />
                )}
              />
            )
          }
          action={
            <Button
              onClick={() => {
                setShowJson(true);
              }}
            >
              <Preview />
            </Button>
          }
        />
        <CardContent sx={{ height: "400px" }}>
          {options && plotData && selectedPlot?.plotline ? (
            <Scatter options={options} data={plotData} />
          ) : options && plotData && selectedPlot?.barchart ? (
            <Bar options={options} data={plotData} />
          ) : null}
        </CardContent>
      </Card>
      <Dialog
        fullWidth
        maxWidth="xl"
        open={showJson}
        onClose={() => {
          setShowJson(false);
        }}
      >
        <DialogContent>
          <Typography variant="h6">JSON</Typography>
          <Editor
            height="200px"
            defaultLanguage="json"
            defaultValue={JSON.stringify(selectedPlot, null, 2)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
