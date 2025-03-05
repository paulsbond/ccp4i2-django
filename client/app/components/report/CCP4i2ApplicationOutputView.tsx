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
  Legend
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

  const dataAsGrid = useMemo<any[][]>(() => {
    if (graph) {
      const data = graph.data.replace(/^\n/, ""); // Remove leading newline;
      const rows = data.split("\n");
      const result: any[][] = rows.map((row: string) =>
        row.split(/\s+/).filter((item: string) => item.trim().length > 0)
      );
      console.log({ datagrid: result });
      return result;
    }
    const result: any[][] = [];
    return result;
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
    if (!selectedPlot || dataAsGrid.length === 0 || !allHeaders) return null;
    if (
      !selectedPlot.plotline ||
      (Array.isArray(selectedPlot.plotline) &&
        selectedPlot.plotline.length == 0)
    )
      return null;

    const plotlineList = Array.isArray(selectedPlot.plotline)
      ? selectedPlot.plotline
      : [selectedPlot.plotline];

    const result: ChartData = {
      datasets: plotlineList.map((plotline: PlotLine, iPlotline: number) => {
        const dataset: ChartDataSet = {
          label: allHeaders[plotline.ycol - 1],
          labels: dataAsGrid.map(
            (row: any) => row[parseInt(`${plotline.xcol}`)]
          ),
          yAxisID: plotline.rightaxis
            ? plotline.rightaxis === "true"
              ? "right"
              : "left"
            : "left",
          data: dataAsGrid.map((row: any) => row[parseInt(`${plotline.ycol}`)]),
          backgroundColor: plotline.colour
            ? plotline.colour
            : colours[iPlotline % colours.length],
          showLine: true,
        };
        return dataset;
      }),
    };
    console.log({ result });

    return result;
  }, [dataAsGrid, selectedPlot, allHeaders]);

  const options = useMemo<ChartOptions<"scatter">>(() => {
    if (!selectedPlot) return null;
    const result: ChartOptions<"line"> = {
      type: "scatter",
      animation: false,
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: parsedOutput ? graph.title : "",
        },
      },
      scales: {
        xAxis: {
          type: "linear",
          position: "bottom",
          title: {
            display: true,
            text: selectedPlot ? selectedPlot.xlabel : "",
          },
        },
        yAxisLeft: {
          id: "left",
          type: "linear",
          position: "left",
        },
        yAxisRight: {
          id: "right",
          type: "linear",
          position: "right",
        },
      },
    };
    if (selectedPlot.xintegral && selectedPlot.xintegral === "true") {
      //@ts-ignore
      result.scales.xAxis.ticks = {
        stepSize: 1, // Force integer steps
        callback: (value: any) => (Number.isInteger(value) ? value : null), // Hide non-integer labels
      };
    }
    if (selectedPlot?.xrange?.min) {
      result.scales.xAxis.min = selectedPlot.xrange.min;
    }
    if (selectedPlot?.xrange?.max) {
      result.scales.xAxis.max = selectedPlot.xrange.max;
    }
    if (selectedPlot?.yrange?.min) {
      result.scales.yAxisLeft.min = selectedPlot.yrange.min;
    }
    if (selectedPlot?.yrange?.max) {
      result.scales.yAxisLeft.max = selectedPlot.yrange.max;
    }
    return result;
  }, [graph, selectedPlot]);

  return (
    <Paper sx={{ maxHeight: "calc(100vh - 15rem)", overflow: "auto" }}>
      {allPlots && selectedPlot && (
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
      {options && plotData && <Scatter options={options} data={plotData} />}
      <Editor
        height="calc(100vh - 15rem)"
        value={JSON.stringify(parsedOutput, null, 2)}
        language="json"
      />
    </Paper>
  );
};
