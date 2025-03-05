import React from "react";
import { Line, Scatter } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation"; // Import annotation plugin

// Register necessary Chart.js components
ChartJS.register(...registerables, annotationPlugin);

// Define types for chart data and options
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
  }[];
}

interface ChartOptions {
  responsive: boolean;
  plugins: {
    annotation: {
      annotations: {
        polygon: {
          type: string;
          xMin: string;
          xMax: string;
          yMin: number;
          yMax: number;
          backgroundColor: string;
          borderColor: string;
          borderWidth: number;
        };
      };
    };
  };
  scales: {
    x: { beginAtZero: boolean };
    y: { beginAtZero: boolean };
  };
}

export const MyChart: React.FC = () => {
  // Data for the chart
  const data: ChartData = {
    labels: ["A", "B", "C", "D", "E"],
    datasets: [
      {
        label: "My Dataset",
        data: [5, 10, 8, 15, 12], // Example data points
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  // Chart options with polygon annotation
  const options: ChartOptions = {
    responsive: true,
    plugins: {
      annotation: {
        annotations: {
          polygon: {
            type: "box",
            xMin: "A",
            xMax: "C",
            yMin: 0,
            yMax: 80,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h2>Chart with Polygon</h2>
      <Line data={data} options={options} />
    </div>
  );
};

export default MyChart;
