export const CCP4i2ReportChart: React.FC<> = (props) => {
  const [selectedPlotOption, setSelectedPlotOption] = useState(0);
  const [plotOptions, setPlotOptions] = useState([]);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [calculatedChart, setCalculatedChart] = useState([]);

  useEffect(() => {
    setWidth(props.width);
    setHeight(props.height);
    var newOptions = props.chart.plots.map((plot, iItem) => {
      return { value: iItem, label: plot.title };
    });
    setPlotOptions(newOptions);

    var newCalculatedChart = [];
    props.chart.plots.map((plot, iPlot) => {
      var newCalculatedPlot = {};
      var newScatters = [];
      var newBarCharts = [];

      plot.plotLines.map((plotLine, iPlotLine) => {
        if (plotLine.type === "plotline") {
          let params = {
            key: `Scatter_${iPlotLine}`,
            name: plotLine.label
              ? plotLine.label
              : props.chart.headers[parseInt(plotLine.ycol) - 1],
            line:
              plotLine.linestyle === "."
                ? false
                : { stroke: plotLine.color, strokeWidth: 2 },
            fill: plotLine.color,
            xAxisId: plotLine.xAxisId,
            yAxisId: plotLine.yAxisId,
            dataKey: plotLine.ycol,
            isAnimationActive: false,
            shape: <MyCircle r={plotLine.symbolsize} />,
            data: props.chart.datas[plotLine.dataid].filter(
              (item) =>
                !(item[plotLine.xcol] === "-" || item[plotLine.ycol] === "-")
            ),
          };
          if (plotLine.linestyle === ".") {
            delete params.dataKey;
          } else {
            delete params.data;
          }
          newScatters.push(<Scatter {...params} />);
        } else {
          let params = {
            key: `Bar_${iPlotLine}`,
            yAxisId: plotLine.yAxisId,
            xAxisId: plotLine.xAxisId,
            name: props.chart.headers[plotLine.xcol],
            dataKey: plotLine.ycol,
            isAnimationActive: false,
            fill: plotLine.color,
            fillOpacity: 0.5,
            stroke: plotLine.color,
            strokeWidth: 2,
          };
          newBarCharts.push(<Bar {...params} />);
        }
        newCalculatedPlot.scatters = newScatters;
        newCalculatedPlot.barCharts = newBarCharts;

        newCalculatedPlot.xAxes = Object.keys(plot.xAxes).map(
          (axisId, iAxis) => {
            var axis = plot.xAxes[axisId];
            return (
              <XAxis
                label={<Label position={axis.position}>{plot.xLabel}</Label>}
                key={`XAxis_${axisId}`}
                {...axis}
                type="number"
                hide={iAxis != 0}
              />
            );
          }
        );

        newCalculatedPlot.leftYAxes = Object.keys(plot.leftYAxes).map(
          (axisId, iAxis) => {
            var axis = plot.yAxes[axisId];
            delete axis.angle;
            return (
              <YAxis
                label={
                  <Label position={axis.position} angle={-90}>
                    {axis.orientation === "left" ? plot.yLabel : plot.ryLabel}
                  </Label>
                }
                key={`LeftYAxis_${axisId}`}
                {...axis}
                type="number"
                hide={iAxis != 0}
              />
            );
          }
        );
        newCalculatedPlot.rightYAxes = Object.keys(plot.rightYAxes).map(
          (axisId, iAxis) => {
            var axis = plot.yAxes[axisId];
            delete axis.angle;
            return (
              <YAxis
                label={
                  <Label position={axis.position} angle={-90}>
                    {axis.orientation === "left" ? plot.yLabel : plot.ryLabel}
                  </Label>
                }
                key={`RightYAxis_${axisId}`}
                {...axis}
                type="number"
                hide={iAxis != 0}
              />
            );
          }
        );
        /*
                              newCalculatedPlot.polygons = plot.polygons.map((polygon, iPolygon) => {
                                  return <polygon key={iPolygon} points={transformPoints(polygon.points, plot).join(",")} fill={polygon.fill} stroke={polygon.stroke} fill-opacity={polygon.fillOpacity} />
                              })
              */
        newCalculatedPlot.polygons = plot.polygons.map((polygon, iPolygon) => {
          var xMin = Math.min(
            ...polygon.points.filter((item, iItem) => {
              return iItem % 2 == 0;
            })
          );
          var xMax = Math.max(
            ...polygon.points.filter((item, iItem) => {
              return iItem % 2 == 0;
            })
          );
          var yMin = Math.min(
            ...polygon.points.filter((item, iItem) => {
              return iItem % 2 == 1;
            })
          );
          var yMax = Math.max(
            ...polygon.points.filter((item, iItem) => {
              return iItem % 2 == 1;
            })
          );
          var result = (
            <ReferenceArea
              x1={xMin}
              y1={yMin}
              x2={xMax}
              y2={yMax}
              stroke={polygon.stroke}
              fill={polygon.fill}
              fillOpacity={polygon.fillOpacity}
              xAxisId={plot.xAxes[Object.keys(plot.xAxes)[0]].xAxisId}
              yAxisId={plot.leftYAxes[Object.keys(plot.leftYAxes)[0]].yAxisId}
              ifOverflow="extendDomain"
              shape={<ReferenceRectangle />}
            />
          );
          return result;
        });

        newCalculatedPlot.circles = plot.circles.map((circle, iCircle) => {
          var xMin = parseFloat(circle.cx) - parseFloat(circle.r);
          var xMax = parseFloat(circle.cx) + parseFloat(circle.r);
          var yMin = parseFloat(circle.cy) - parseFloat(circle.r);
          var yMax = parseFloat(circle.cy) + parseFloat(circle.r);
          var result = (
            <ReferenceArea
              x1={xMin}
              y1={yMin}
              x2={xMax}
              y2={yMax}
              stroke={circle.stroke}
              xAxisId={plot.xAxes[Object.keys(plot.xAxes)[0]].xAxisId}
              yAxisId={plot.leftYAxes[Object.keys(plot.leftYAxes)[0]].yAxisId}
              ifOverflow="extendDomain"
              shape={<ReferenceCircle />}
            />
          );
          return result;
        });

        newCalculatedPlot.lines = plot.lines.map((line, iLine) => {
          var result = (
            <ReferenceArea
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.stroke}
              xAxisId={plot.xAxes[Object.keys(plot.xAxes)[0]].xAxisId}
              yAxisId={plot.leftYAxes[Object.keys(plot.leftYAxes)[0]].yAxisId}
              ifOverflow="extendDomain"
              shape={<ReferenceLine />}
            />
          );
          return result;
        });
      });
      newCalculatedChart.push(newCalculatedPlot);
    });
    setCalculatedChart(newCalculatedChart);
  }, []);

  const transformPoints = (points, plot) => {
    var margins = [70 + Object.keys(plot.rightYAxes).length > 0 ? 62 : 0, 62];
    var offset = [65, 5];
    var transformedPoints = points.map((coord, iCoord) => {
      if (iCoord % 2 === 0) {
        var domain = plot.xAxes[Object.keys(plot.xAxes)[0]].domain;
        return (
          offset[0] +
          (coord - domain[0]) *
            ((props.width - margins[0]) / (domain[1] - domain[0]))
        );
      } else {
        var domain = plot.yAxes[Object.keys(plot.yAxes)[0]].domain;
        return (
          offset[1] +
          (props.height - margins[1]) -
          (coord - domain[0]) *
            ((props.height - margins[1]) / (domain[1] - domain[0]))
        );
      }
    });
    return transformedPoints;
  };

  const MyCircle = (arg) => {
    return (
      <circle cx={arg.cx} cy={arg.cy} r={arg.r} stroke={arg.fill} fill="none" />
    );
  };

  const ReferenceCircle = (props) => {
    return (
      <circle
        stroke={props.stroke}
        fill={props.fill}
        fillOpacity={0.2}
        cx={props.x + props.width / 2}
        cy={props.y + props.height / 2}
        r={props.width / 2}
      />
    );
  };

  const ReferenceLine = (props) => {
    return (
      <line
        stroke={props.stroke}
        x1={props.x}
        x2={props.x + props.width}
        y1={props.y + props.height}
        y2={props.y}
      />
    );
  };

  const ReferenceRectangle = (props) => {
    return (
      <polygon
        stroke={props.stroke}
        fill={props.fill}
        fillOpacity={props.fillOpacity}
        points={[
          props.x,
          props.y,
          props.x + props.width,
          props.y,
          props.x + props.width,
          props.y + props.height,
          props.x,
          props.y + props.height,
          props.x,
          props.y,
        ].join(",")}
      />
    );
  };

  return (
    <Card
      size="small"
      title={
        plotOptions.length > 1 ? (
          <Fragment>
            Select plot:{" "}
            <Select
              value={selectedPlotOption}
              options={plotOptions}
              onSelect={(value) => {
                setSelectedPlotOption(value);
                if (plotOptions[selectedPlotOption].fixaspectratio) {
                  setHeight(props.width);
                } else {
                  setHeight(props.height);
                }
              }}
            />
          </Fragment>
        ) : (
          <Fragment>
            <h1>
              Plot title: {plotOptions.length > 0 && plotOptions[0].label}
            </h1>
          </Fragment>
        )
      }
      extra={props.extra}
    >
      {calculatedChart.map((plot, iPlot) => {
        return (
          iPlot === selectedPlotOption && (
            <ComposedChart
              width={width}
              height={height}
              data={props.chart.datas[Object.keys(props.chart.datas)[0]]}
              key={`Plot_${iPlot}`}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              {plot.xAxes.map((item) => item)}
              {plot.leftYAxes.map((item) => item)}
              {plot.rightYAxes.map((item) => item)}
              {plot.scatters.map((item) => item)}
              {plot.barCharts.map((item) => item)}
              {plot.polygons.map((item) => item)}
              {plot.circles.map((item) => item)}
              {plot.lines.map((item) => item)}
            </ComposedChart>
          )
        );
      })}
    </Card>
  );
};
CCP4i2ReportChart.defaultProps = { extra: [] };

export default CCP4i2ReportFlotWidget;
