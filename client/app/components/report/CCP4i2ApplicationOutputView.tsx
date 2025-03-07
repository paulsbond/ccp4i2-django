import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import {
  addCircles,
  addLines,
  addPolygons,
  addTexts,
  colorNameToRGBA,
  handleCustomXLabels,
  handleOneOverSqrt,
  handleRangeSpecifiers,
  handleXIntegral,
  hexToRGBA,
  parseXML,
  Plot,
  PlotLine,
} from "./ChartLib";
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
  Scale,
  CoreScaleOptions,
} from "chart.js";
import { Chart, ChartProps, Line, Scatter } from "react-chartjs-2";
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
  const [showJson, setShowJson] = useState(false);

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

    if (selectedPlot?.plotline?.showlegend === "false") {
      if (!result.plugins) result.plugins = {};
      result.plugins.legend = {
        display: false,
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
            allPlots.length > 1 && (
              <Autocomplete
                sx={{ mt: 1, mb: 1, px: 0, py: 0 }}
                options={allPlots}
                getOptionKey={(option) => allPlots.indexOf(option)}
                getOptionLabel={(option) => option.title || "Unnamed plot"}
                onChange={(event, newValue) => {
                  setSelectedPlot(newValue);
                }}
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
        <CardContent sx={{ height: "350px" }}>
          {options && plotData && <Scatter options={options} data={plotData} />}
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
