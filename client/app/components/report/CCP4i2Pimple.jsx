import $ from "jquery";
//import Plotly from "plotly.js-dist-min";
const jQuery = (window.jQuery = window.$ = $);

export function reescape(s) {
  const h = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ];
  s = s.replace(/&nbsp;/g, " ").split("");
  s = s.map((k) => {
    const c = k.charCodeAt(0);
    switch (c) {
      case 60:
        return "&lt;";
      case 62:
        return "&gt;";
      case 34:
        return "&quot;";
      case 38:
        return "&amp;";
      default:
        if (c > 127) {
          const m = c % 16;
          const n = Math.floor(c / 16) % 16;
          const o = Math.floor(c / 256) % 16;
          const p = Math.floor(c / 4096) % 16;
          return `&#x${h[p]}${h[o]}${h[n]}${h[m]};`;
        } else {
          return k;
        }
    }
  });
  return s.join("");
}

const generateUUID = () => {
  let d = new Date().getTime();
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16;
    if (d > 0) {
      const value = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? value : (value & 0x3) | 0x8).toString(16);
    } else {
      const value = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
      return (c === "x" ? value : (value & 0x3) | 0x8).toString(16);
    }
  });
};

const arrayBufferToBinaryString = (buffer) => {
  const bytes = new Uint8Array(buffer);
  return String.fromCharCode(...bytes);
};

const onMenuSelect = (value) => {
  //console.log("onMenuSelect "+value);
};

function CCP4Graph(
  graphName,
  d,
  xbreaks,
  ybreaks,
  options,
  shapes,
  titles,
  background,
  customXTicks,
  customYTicks,
  usePlotly
) {
  this.graphID = graphName;
  this.graphData = d;
  this.xbreaks = xbreaks;
  this.ybreaks = ybreaks;
  this.options = options;
  this.shapes = shapes;
  this.titles = titles;
  this.background = background;
  this.customXTicks = customXTicks;
  this.customYTicks = customYTicks;
  this.usePlotly = usePlotly;
}

class CCP4GraphPlot {
  constructor(graphDivName_in, showInput) {
    const $graphDivOuter = $(`#${graphDivName_in}`);
    const graphDivOuter = $graphDivOuter.get(0);

    if (!graphDivOuter) {
      //console.log("Element "+graphDivName_in+" does not exist");
      this.graphDivName = null;
      return;
    }

    this.currentStoredGraph = -1;
    this.haveLaunchButton = false;
    this.currentGraph = null;
    this.toolTipDiv = null;
    this.dataInfoDiv = null;
    this.launchDataIDParam = null;
    this.launchJobIdParam = null;
    this.dataID = "";

    this.graphDivName_in = graphDivName_in;
    const N = 20;
    this.graphDivName = generateUUID();
    this.menuSelectName = `${generateUUID()}_menuSelect`;

    const parentWidth = parseInt($graphDivOuter.width());
    const parentHeight = parseInt($graphDivOuter.height());
    const w = `${parentWidth}px`;
    const h = `${parentHeight - 30}px`; //FIXME Hardwire should be (approx) 2 X max(menu font,input font) + 10.

    const $menuContainer = $("<div>").css("width", $graphDivOuter.css("width"));
    const $menuSelect = $("<select>")
      .addClass("graphSelect")
      .attr("id", this.menuSelectName)
      .attr("name", this.menuSelectName)
      .css("float", "left")
      .css("position", "relative")
      .css("width", "85%");
    $menuContainer.append($menuSelect);
    $graphDivOuter.append($menuContainer);

    const $pimpMain = $("<div>")
      .attr("id", this.graphDivName)
      .css("width", w)
      .css("height", h)
      .css("clear", "both");
    $graphDivOuter.append($pimpMain);

    this.graphs = [];
    const self = this;

    $menuSelect.on("change", function (e) {
      $(`#${self.menuSelectName} option:selected`).each(function () {
        const graphName = $(this)[0].value;
        const thisPlotDiv = document.getElementById(graphName);
        $(`#${self.graphDivName}`).children().hide();
        thisPlotDiv.setAttribute(
          "style",
          `width:${thisPlotDiv.style.width};height:${thisPlotDiv.style.height};display:block;`
        );
        $(`#${graphName}`).empty();
        self.currentGraph = self.getDataWithName(graphName);
        if (self.dataInfoDiv !== null) {
          self.dataInfoDiv.addClass("datainfo_hidden");
        }
        self.plot();
        const selectedIndex = $(`#${self.menuSelectName}`).prop(
          "selectedIndex"
        );
      });
    });
  }
}

CCP4GraphPlot.prototype.handleAbort = (e) => {
  //console.log("aborted");
};
CCP4GraphPlot.prototype.handleError = (e) => {
  //console.log("error");
};
CCP4GraphPlot.prototype.handleLoadStart = (e) => {
  //console.log("loadstart");
};
CCP4GraphPlot.prototype.handleLoadEnd = (e) => {
  //console.log("loadend");
};
CCP4GraphPlot.prototype.handleLoadProgress = (e) => {
  //console.log("progress");
};

CCP4GraphPlot.prototype.parseColourToRGBA = (col, alpha) => {
  const colorMap = {
    r: "#ff0000",
    red: "#ff0000",
    g: "#00ff00",
    green: "#00ff00",
    b: "#0000ff",
    blue: "#0000ff",
    c: "#00ffff",
    cyan: "#00ffff",
    m: "#ff00ff",
    magenta: "#ff00ff",
    y: "#ffff00",
    yellow: "#ffff00",
    w: "#ffffff",
    white: "#ffffff",
    k: "#000000",
    black: "#000000",
  };
  col = colorMap[col] || col;
  const r = parseInt(`0x${col.substring(1, 3)}`);
  const g = parseInt(`0x${col.substring(3, 5)}`);
  const b = parseInt(`0x${col.substring(5, 7)}`);
  return `rgba(${r},${g},${b},${alpha})`;
};

CCP4GraphPlot.prototype.handleLoad = (e) => {
  const txt = arrayBufferToBinaryString(e.target.result);
  let xmlDoc;
  if (window.DOMParser) {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(txt, "text/xml");
  }
  //console.log(xmlDoc);
  //console.log("read XML");
  const root = xmlDoc.getElementsByTagName("CCP4ApplicationOutput")[0];
  const tables = root.getElementsByTagName("CCP4Table");

  const graphObject = this.graphObject;
  graphObject.loadXML(graphObject, root, tables);
};

const getNodeText = (node) => {
  return Array.from(node.childNodes)
    .map((child) => child.nodeValue)
    .join("");
};

CCP4GraphPlot.prototype.drawDashedLine = function (
  ctx,
  posLeft_in,
  posTop_in,
  posLeft2,
  posTop2,
  lineStyle
) {
  //console.log(lineStyle)
  //console.log(lineStyle.length)
  let posLeft = 0 + posLeft_in;
  let posTop = 0 + posTop_in;
  const posLeft_orig = 0 + posLeft_in;
  const posTop_orig = 0 + posTop_in;

  let dashLength = 2;
  let gapLength = 2;

  if (lineStyle.length == 2) {
    dashLength = lineStyle[0];
    gapLength = lineStyle[1];
  }

  if (lineStyle.length == 4) {
    dashLength = lineStyle[0];
    gapLength = lineStyle[1] + lineStyle[2] + lineStyle[3];
  }

  ctx.moveTo(posLeft, posTop);

  const dX = posLeft2 - posLeft;
  const dY = posTop2 - posTop;
  const dashes = Math.floor(
    Math.sqrt(dX * dX + dY * dY) / (dashLength + gapLength)
  );
  const dashX = ((dX / dashes) * dashLength) / (dashLength + gapLength);
  const dashY = ((dY / dashes) * dashLength) / (dashLength + gapLength);
  const gapX = ((dX / dashes) * gapLength) / (dashLength + gapLength);
  const gapY = ((dY / dashes) * gapLength) / (dashLength + gapLength);
  //console.log(dashLength+" "+gapLength)

  for (let idash = 0; idash < dashes; idash++) {
    posLeft += dashX;
    posTop += dashY;
    ctx.lineTo(posLeft, posTop);
    posLeft += gapX;
    posTop += gapY;
    ctx.moveTo(posLeft, posTop);
  }

  if (lineStyle.length == 4) {
    posLeft = posLeft_orig;
    posTop = posTop_orig;
    ctx.moveTo(posLeft, posTop);
    const dashLength2 = lineStyle[2];
    const gapLength2 = lineStyle[1] + lineStyle[0] + lineStyle[3];
    const dX = posLeft2 - posLeft;
    const dY = posTop2 - posTop;
    const dashes = Math.floor(
      Math.sqrt(dX * dX + dY * dY) / (dashLength2 + gapLength2)
    );
    const dashX = ((dX / dashes) * dashLength2) / (dashLength2 + gapLength2);
    const dashY = ((dY / dashes) * dashLength2) / (dashLength2 + gapLength2);
    const gapX = ((dX / dashes) * gapLength2) / (dashLength2 + gapLength2);
    const gapY = ((dY / dashes) * gapLength2) / (dashLength2 + gapLength2);
    //console.log(dashLength2+" "+gapLength2)

    const moveX = lineStyle[0] + lineStyle[1];
    const dashesMove = Math.floor(Math.sqrt(dX * dX + dY * dY) / moveX);
    const dashMoveX = dX / dashesMove;
    const dashMoveY = dY / dashesMove;
    posLeft += dashMoveX;
    posTop += dashMoveY;
    ctx.moveTo(posLeft, posTop);

    for (let idash = 0; idash < dashes; idash++) {
      posLeft += dashX;
      posTop += dashY;
      ctx.lineTo(posLeft, posTop);
      posLeft += gapX;
      posTop += gapY;
      ctx.moveTo(posLeft, posTop);
    }
  }
};

CCP4GraphPlot.prototype.p2cNY = function (thePlot, pos, n) {
  const res = {};
  for (let i = 0; i < thePlot.getYAxes().length; ++i) {
    const axis = thePlot.getYAxes()[i];
    if (axis && axis.used) {
      let key = `y${axis.n}`;
      if (axis.n == n) key = "y";

      if (pos[key] != null) {
        res.top = axis.p2c(pos[key]);
        break;
      }
    }
  }
  return res;
};

CCP4GraphPlot.prototype.drawBackground = function (thePlot, divTop) {
  const background = this.currentGraph.background;
  if (background) {
    const graphName = this.currentGraph.graphID;
    const canvas = thePlot.getCanvas();
    const ctx = canvas.getContext("2d");
    const outer = document.getElementById(graphName);
    const offset = thePlot.getPlotOffset();
    const h =
      parseInt($(divTop).height()) - offset["left"] - offset["right"] + 9; //was +9
    const w = parseInt($(divTop).width()) - offset["top"] - offset["bottom"];
    if (canvas.getContext) {
      const drawing = new Image();
      drawing.src = background;
      drawing.onload = function () {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(drawing, offset["left"], offset["top"], w - 9, h);
        ctx.restore();
      };
    }
  }
};

CCP4GraphPlot.prototype.plotShapes = function (thePlot, yaxisOverride) {
  const shapes = this.currentGraph.shapes;
  const canvas = thePlot.getCanvas();
  const offset = thePlot.getPlotOffset();
  const ctx = canvas.getContext("2d");
  let haveDashedLines = true;
  if (!ctx.setLineDash) {
    ctx.setLineDash = function (dash) {
      if (!ctx.webkitLineDash) {
        if (!ctx.mozDash) {
          haveDashedLines = false;
        } else {
          ctx.mozDash = dash;
        }
      } else {
        ctx.webkitLineDash = dash;
      }
    };
  }

  for (let ishape = 0; ishape < shapes.length; ishape++) {
    const shape = shapes[ishape];
    if ("text" in shape) {
      this.drawText(ctx, thePlot, shape["text"], offset, yaxisOverride);
    } else if ("linestrip" in shape) {
      this.drawLineStrip(
        ctx,
        thePlot,
        shape["linestrip"],
        offset,
        yaxisOverride,
        haveDashedLines
      );
    } else if ("polygon" in shape) {
      this.drawPolygon(
        ctx,
        thePlot,
        shape["polygon"],
        offset,
        yaxisOverride,
        haveDashedLines
      );
    } else if ("circle" in shape) {
      this.drawCircle(ctx, thePlot, shape["circle"], offset, yaxisOverride);
    }
  }
};

CCP4GraphPlot.prototype.drawText = function (
  ctx,
  thePlot,
  text,
  offset,
  yaxisOverride
) {
  const font = text["font"];
  const fillColour = text["fillcolour"];
  if (ctx) {
    ctx.save();
    const canvasCoord = thePlot.p2c({ x: text["x"], y: text["y"] });
    const posLeft = canvasCoord["left"] + offset["left"];
    const posTop = canvasCoord["top"] + offset["top"];
    if (font !== "") {
      ctx.font = font;
    }
    ctx.fillStyle = fillColour;
    ctx.fillText(text["text"], posLeft, posTop);
    ctx.restore();
  }
};

CCP4GraphPlot.prototype.drawLineStrip = function (
  ctx,
  thePlot,
  linestrip,
  offset,
  yaxisOverride,
  haveDashedLines
) {
  const lineColour = linestrip["linecolour"];
  const lineSize = linestrip["linesize"];
  const lineStyle = linestrip["linestyle"];
  if (ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = lineColour;
    ctx.lineWidth = lineSize;
    if (lineStyle) ctx.setLineDash(lineStyle);
    let canvasCoord = thePlot.p2c({
      x: linestrip["data"][0][0],
      y: linestrip["data"][0][1],
    });
    if (yaxisOverride != 1) {
      const canvasCoordy = this.p2cNY(
        thePlot,
        { y: linestrip["data"][0][1] },
        yaxisOverride
      );
      canvasCoord["top"] = canvasCoordy["top"];
    }
    let posLeft = canvasCoord["left"] + offset["left"];
    let posTop = canvasCoord["top"] + offset["top"];
    ctx.moveTo(posLeft, posTop);
    for (let ip = 1; ip < linestrip["data"].length; ip++) {
      canvasCoord = thePlot.p2c({
        x: linestrip["data"][ip][0],
        y: linestrip["data"][ip][1],
      });
      if (yaxisOverride != 1) {
        const canvasCoordy = this.p2cNY(
          thePlot,
          { y: linestrip["data"][ip][1] },
          yaxisOverride
        );
        canvasCoord["top"] = canvasCoordy["top"];
      }
      const posLeft2 = canvasCoord["left"] + offset["left"];
      const posTop2 = canvasCoord["top"] + offset["top"];
      if (!lineStyle || (lineStyle && haveDashedLines)) {
        ctx.lineTo(posLeft2, posTop2);
      } else if (lineStyle && !haveDashedLines) {
        this.drawDashedLine(ctx, posLeft, posTop, posLeft2, posTop2, lineStyle);
        posLeft = posLeft2;
        posTop = posTop2;
      }
    }
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
};

CCP4GraphPlot.prototype.drawPolygon = function (
  ctx,
  thePlot,
  polygon,
  offset,
  yaxisOverride,
  haveDashedLines
) {
  const fillColour = polygon["fillcolour"];
  const lineColour = polygon["linecolour"];
  const lineSize = polygon["linesize"];
  const lineStyle = polygon["linestyle"];
  if (ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = lineColour;
    ctx.fillStyle = fillColour;
    ctx.lineWidth = lineSize;
    if (lineStyle) ctx.setLineDash(lineStyle);
    let canvasCoord = thePlot.p2c({
      x: polygon["data"][0][0],
      y: polygon["data"][0][1],
    });
    if (yaxisOverride != 1) {
      const canvasCoordy = this.p2cNY(
        thePlot,
        { y: polygon["data"][0][1] },
        yaxisOverride
      );
      canvasCoord["top"] = canvasCoordy["top"];
    }
    let posLeft = canvasCoord["left"] + offset["left"];
    let posTop = canvasCoord["top"] + offset["top"];
    const posLeft_orig = canvasCoord["left"] + offset["left"];
    const posTop_orig = canvasCoord["top"] + offset["top"];
    let posLeft2;
    let posTop2;
    ctx.moveTo(posLeft, posTop);
    for (let ip = 1; ip < polygon["data"].length; ip++) {
      canvasCoord = thePlot.p2c({
        x: polygon["data"][ip][0],
        y: polygon["data"][ip][1],
      });
      if (yaxisOverride != 1) {
        const canvasCoordy = this.p2cNY(
          thePlot,
          { y: polygon["data"][ip][1] },
          yaxisOverride
        );
        canvasCoord["top"] = canvasCoordy["top"];
      }
      posLeft2 = canvasCoord["left"] + offset["left"];
      posTop2 = canvasCoord["top"] + offset["top"];
      if (!lineStyle || (lineStyle && haveDashedLines)) {
        ctx.lineTo(posLeft2, posTop2);
      } else if (lineStyle && !haveDashedLines) {
        this.drawDashedLine(ctx, posLeft, posTop, posLeft2, posTop2, lineStyle);
        posLeft = posLeft2;
        posTop = posTop2;
      }
    }
    if (!lineStyle || (lineStyle && haveDashedLines)) {
      ctx.lineTo(posLeft, posTop);
    } else if (lineStyle && !haveDashedLines) {
      this.drawDashedLine(
        ctx,
        posLeft2,
        posTop2,
        posLeft_orig,
        posTop_orig,
        lineStyle
      );
      posLeft = posLeft2;
      posTop = posTop2;
    }
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    canvasCoord = thePlot.p2c({
      x: polygon["data"][0][0],
      y: polygon["data"][0][1],
    });
    if (yaxisOverride != 1) {
      const canvasCoordy = this.p2cNY(
        thePlot,
        { y: polygon["data"][0][1] },
        yaxisOverride
      );
      canvasCoord["top"] = canvasCoordy["top"];
    }
    posLeft = canvasCoord["left"] + offset["left"];
    posTop = canvasCoord["top"] + offset["top"];
    ctx.moveTo(posLeft, posTop);
    for (let ip = 1; ip < polygon["data"].length; ip++) {
      canvasCoord = thePlot.p2c({
        x: polygon["data"][ip][0],
        y: polygon["data"][ip][1],
      });
      if (yaxisOverride != 1) {
        const canvasCoordy = this.p2cNY(
          thePlot,
          { y: polygon["data"][ip][1] },
          yaxisOverride
        );
        canvasCoord["top"] = canvasCoordy["top"];
      }
      const posLeft2 = canvasCoord["left"] + offset["left"];
      const posTop2 = canvasCoord["top"] + offset["top"];
      ctx.lineTo(posLeft2, posTop2);
    }
    ctx.lineTo(posLeft, posTop);
    ctx.fill();
    ctx.restore();
  }
};

CCP4GraphPlot.prototype.drawCircle = function (
  ctx,
  thePlot,
  circle,
  offset,
  yaxisOverride
) {
  let canvasCoord = thePlot.p2c({ x: circle["x"], y: circle["y"] });
  if (yaxisOverride != 1) {
    const canvasCoordy = this.p2cNY(thePlot, { y: circle["y"] }, yaxisOverride);
    canvasCoord["top"] = canvasCoordy["top"];
  }
  const radius = parseInt(
    Math.floor(this.getXScale(thePlot) * circle["radius"])
  );
  const fillColour = circle["fillcolour"];
  const lineColour = circle["linecolour"];
  const lineSize = circle["linesize"];
  const lineStyle = circle["linestyle"];

  const posLeft = canvasCoord["left"] + offset["left"];
  const posTop = canvasCoord["top"] + offset["top"];
  if (ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = lineColour;
    ctx.lineWidth = lineSize;
    if (lineStyle) ctx.setLineDash(lineStyle);
    ctx.arc(posLeft, posTop, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColour;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(posLeft, posTop, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
};

CCP4GraphPlot.prototype.getXScale = function (thePlot) {
  const canvasCoordDum1 = thePlot.p2c({ x: 0, y: 0 });
  const canvasCoordDum2 = thePlot.p2c({ x: 100, y: 100 });
  return (
    (parseFloat(canvasCoordDum2["left"]) -
      parseFloat(canvasCoordDum1["left"])) *
    0.01
  );
};

CCP4GraphPlot.prototype.plotlyPlot = function (
  d,
  divTop,
  flotLayout,
  breakLocation,
  showRightAxisInPlotly
) {
  const self = this;
  const traces = [];
  const layout = {
    margin: {
      l: 30,
      r: 5,
      b: 20,
      t: 5,
      pad: 4,
    },
    xaxis: { showline: true, autorange: true },
    yaxis: { showline: true, autorange: true },
    showlegend: true,
    legend: { bgcolor: "rgba(1,1,1,0.1)", x: 0 },
  };

  if (breakLocation === "xmiddle" || breakLocation === "xright") {
    layout.yaxis = { showline: false, autorange: true, showticklabels: false };
  }
  if (breakLocation === "xmiddle") {
    layout.margin.l = 0;
    layout.margin.r = 0;
  } else if (breakLocation === "xleft") {
    layout.margin.r = 0;
  } else if (breakLocation === "xright") {
    layout.margin.l = 0;
  }

  if (typeof flotLayout !== "undefined") {
    //console.log(flotLayout);
    if (typeof flotLayout.legend !== "undefined") {
      if (typeof flotLayout.legend.show !== "undefined") {
        layout.showlegend = flotLayout.legend.show;
      }
    }
    if (typeof flotLayout.xaxis !== "undefined") {
      if (
        typeof flotLayout.xaxis.min !== "undefined" &&
        typeof flotLayout.xaxis.max !== "undefined"
      ) {
        layout.xaxis.range = [flotLayout.xaxis.min, flotLayout.xaxis.max];
      }
    }
    if (typeof flotLayout.xaxes !== "undefined") {
      for (let iXAxis = 0; iXAxis < flotLayout.xaxes.length; iXAxis++) {
        const flotXAxis = flotLayout.xaxes[iXAxis];
        let plotlyXAxis = layout.xaxis;
        if (iXAxis > 0) {
          if (typeof layout.xaxis2 !== "undefined") {
            plotlyXAxis = layout.xaxis2;
          } else {
            layout.xaxis2 = { showline: true };
            layout.margin.b = 30;
            plotlyXAxis = layout.Xaxis2;
          }
        }
        if (
          typeof flotXAxis.min !== "undefined" &&
          typeof flotXAxis.max !== "undefined"
        ) {
          plotlyXAxis.autorange = false;
          plotlyXAxis.range = [flotXAxis.min, flotXAxis.max];
        } else if (
          typeof flotXAxis.min !== "undefined" &&
          flotXAxis.min === 0
        ) {
          plotlyXAxis.rangemode = "nonnegative";
        }
      }
    }

    if (typeof flotLayout.yaxis !== "undefined") {
      if (
        typeof flotLayout.yaxis.min !== "undefined" &&
        typeof flotLayout.yaxis.max !== "undefined"
      ) {
        layout.yaxis.range = [flotLayout.yaxis.min, flotLayout.yaxis.max];
      }
    }
    if (
      typeof flotLayout.yaxes !== "undefined" &&
      ((breakLocation === "xright" && showRightAxisInPlotly) ||
        typeof breakLocation === "undefined")
    ) {
      for (let iYAxis = 0; iYAxis < flotLayout.yaxes.length; iYAxis++) {
        const flotYAxis = flotLayout.yaxes[iYAxis];
        let plotlyYAxis = layout.yaxis;
        if (iYAxis > 0) {
          if (typeof layout.yaxis2 !== "undefined") {
            plotlyYAxis = layout.yaxis2;
          } else {
            layout.yaxis2 = { showline: true };
            layout.margin.r = 30;
            plotlyYAxis = layout.yaxis2;
          }
        }
        if (
          typeof flotYAxis.min !== "undefined" &&
          typeof flotYAxis.max !== "undefined"
        ) {
          plotlyYAxis.autorange = false;
          plotlyYAxis.range = [flotYAxis.min, flotYAxis.max];
        } else if (
          typeof flotYAxis.min !== "undefined" &&
          flotYAxis.min === 0
        ) {
          plotlyYAxis.rangemode = "nonnegative";
        }
        if (
          typeof flotYAxis.position !== "undefined" &&
          flotYAxis.position === "right"
        ) {
          plotlyYAxis.overlaying = "y";
          plotlyYAxis.side = "right";
        }
      }
    }
    //console.log(layout);
    //console.log(flotLayout);
  }
  for (let iSeries = 0; iSeries < d.length; iSeries++) {
    const series = d[iSeries];
    //console.log (series);
    const newTrace = {};
    newTrace.x = [];
    newTrace.y = [];
    newTrace.type = "scatter";
    newTrace.mode = "lines";
    if (typeof series.label !== "undefined") newTrace.name = series.label;
    if (typeof series.points !== "undefined") {
      newTrace.marker = {};
      if (typeof series.points.symbol !== "undefined")
        newTrace.marker.symbol = series.points.symbol;
    }
    for (let iPoint = 0; iPoint < series.data.length; iPoint++) {
      if (
        breakLocation !== "undefined" ||
        layout.xaxis.autorange === true ||
        (parseFloat(series.data[iPoint][0]) >=
          parseFloat(layout.xaxis.range[0]) &&
          parseFloat(series.data[iPoint][0]) <=
            parseFloat(layout.xaxis.range[1]))
      ) {
        newTrace.x.push(series.data[iPoint][0]);
        newTrace.y.push(series.data[iPoint][1]);
      }
    }
    if (typeof series.yaxis !== "undefined" && breakLocation === "xleft") {
      if (series.yaxis > 1) {
        newTrace.yaxis = "y2";
      }
    }
    traces.push(newTrace);
  }

  Plotly.newPlot(divTop, traces, layout, {
    displayModeBar: false,
    scrollZoom: true,
  });
};

CCP4GraphPlot.prototype.handleEvent = function (evt) {
  if (evt.type == "change") {
    this.handleFileSelect(evt);
  }
  if (evt.type == "resize" && this.currentGraph) {
    $(`#${this.currentGraph.graphID}`).empty();
    this.plot();
  }
};

CCP4GraphPlot.prototype.handleFileSelect = function (evt) {
  const files = evt.target.files; // FileList object
  this.loadFiles(files);
};

CCP4GraphPlot.prototype.loadFile = function (file) {
  this.loadFiles([file]);
};

CCP4GraphPlot.prototype.loadFiles = function (files) {
  this.graphs = [];
  // files is a FileList of File objects. List some properties.
  const output = [];
  for (let i = 0, f; (f = files[i]); i++) {
    output.push(
      "<li><strong>",
      escape(f.name),
      "</strong> (",
      f.type || "n/a",
      ") - ",
      f.size,
      " bytes, last modified: ",
      f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : "n/a",
      "</li>"
    );
    const reader = new FileReader();
    output.push(reader);
    reader.onabort = this.handleAbort;
    reader.onerror = this.handleError;
    reader.onloadstart = this.handleLoadStart;
    reader.onloadend = this.handleLoadEnd;
    reader.onload = this.handleLoad;
    reader.graphObject = this;
    //console.log("start reading");
    reader.readAsArrayBuffer(f);
  }
  //document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  //console.log("handleFileSelect end");
};

// The "public methods".

CCP4GraphPlot.prototype.destroy = function () {
  //console.log('In destroy', this.graphDivName_in)
  $(`#${this.graphDivName_in}`)
    .find("div")
    .each((iDiv, theDiv) => {
      const flot = $(theDiv).data("plot");
      //console.log('iDiv, div', iDiv, theDiv, flot)
      if (flot) {
        //console.log('destroying', flot)
        flot.destroy();
      }
    });
  $(`#${this.graphDivName_in}`).empty();
};

CCP4GraphPlot.prototype.getCurrentData = function () {
  return $(`#${this.menuSelectName}`).prop("selectedIndex");
};

CCP4GraphPlot.prototype.setCurrentData = function (iplot) {
  //console.log(iplot, Object.keys(this.graphs))
  const graphName = this.graphs[iplot].graphID;
  $(`#${this.menuSelectName}`).val(`${graphName}`).change();
};

CCP4GraphPlot.prototype.getDataWithName = function (graphName) {
  for (let ig = 0; ig < this.graphs.length; ig++) {
    if (this.graphs[ig].graphID == graphName) {
      return this.graphs[ig];
    }
  }
  return null;
};

CCP4GraphPlot.prototype.watchUrl = function (url, timeout) {
  const self = this;
  window.setInterval(function () {
    self.loadFromUrl(url);
  }, timeout);
};

CCP4GraphPlot.prototype.loadFromUrl = function (url) {
  let txt = "";
  const xmlhttp = new XMLHttpRequest();
  const self = this;
  /*
    // This works in Firefox with files in same directory as html page, but not Qt WebKit or Safari.
    xmlhttp.onreadystatechanged = function(){
    if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
    txt = xmlhttp.responseText;
    self.loadString(txt);
    }
    };
    */
  // This works in Firefox, Qt WebKit and Safari with files in same directory as html page.
  const extendedURL = `/jobFile?jobId=${$("div[data-jobid]").data(
    "jobid"
  )}&filePath=${url}`;
  xmlhttp.open("GET", extendedURL, false);
  xmlhttp.overrideMimeType("text/plain;");
  xmlhttp.send();
  txt = xmlhttp.responseText;
  self.loadString(txt);
};

CCP4GraphPlot.prototype.loadFromID = function (elementID) {
  const source = document.getElementById(elementID).textContent;
  this.loadString(source);
};

CCP4GraphPlot.prototype.loadString = function (txt) {
  const myself = this;
  let textHasChanged = false;
  if ("undefined" === typeof myself.currentText) {
    textHasChanged = true;
  } else {
    if (txt !== myself.currentText) {
      textHasChanged = true;
    }
  }
  if (textHasChanged) {
    let xmlDoc;
    if (window.DOMParser) {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(txt, "text/xml");
    }
    //console.log(xmlDoc);
    //console.log("read XML");
    const root = xmlDoc.getElementsByTagName("CCP4ApplicationOutput")[0];
    const tables = root.getElementsByTagName("CCP4Table");
    const graphObject = this;
    graphObject.loadXML(graphObject, root, tables);
  } else {
    //console.log("Text unchanged for recycled graph");
  }
  //console.log("Text has changed was "+textHasChanged)
  myself.currentText = txt;
};

CCP4GraphPlot.prototype.plotShapes = function (thePlot, yaxisOverride) {
  const shapes = this.currentGraph.shapes;
  const canvas = thePlot.getCanvas();
  const offset = thePlot.getPlotOffset();
  const ctx = canvas.getContext("2d");
  let haveDashedLines = true;
  if (!ctx.setLineDash) {
    ctx.setLineDash = function (dash) {
      if (!ctx.webkitLineDash) {
        if (!ctx.mozDash) {
          //console.log("No dashed lines.")
          haveDashedLines = false;
        } else {
          //console.log("Using mozDash")
          ctx.mozDash = dash; // This may have no effect.
        }
      } else {
        //console.log("Using webkitLineDash")
        ctx.webkitLineDash = dash; // This may have no effect.
      }
    };
  }

  for (let ishape = 0; ishape < shapes.length; ishape++) {
    const plotOffset = thePlot.getPlotOffset();
    const canvasCoordDum1 = thePlot.p2c({ x: 0, y: 0 });
    const canvasCoordDum2 = thePlot.p2c({ x: 100, y: 100 });
    //for(iax=0;iax<thePlot.getYAxes().length;iax++){
    //console.log(iax+" "+thePlot.getYAxes()[iax].p2c(100))
    //}
    if (yaxisOverride != 1) {
      const canvasCoordy = this.p2cNY(thePlot, { y: 0 }, yaxisOverride);
      canvasCoordDum1["top"] = canvasCoordy["top"];
      const canvasCoordy2 = this.p2cNY(thePlot, { y: 100 }, yaxisOverride);
      canvasCoordDum2["top"] = canvasCoordy2["top"];
    }
    const xscale =
      (parseFloat(canvasCoordDum2["left"]) -
        parseFloat(canvasCoordDum1["left"])) *
      0.01;
    const yscale =
      -(
        parseFloat(canvasCoordDum2["top"]) - parseFloat(canvasCoordDum1["top"])
      ) * 0.01;

    const shape = shapes[ishape];

    if ("text" in shape) {
      const text = shape["text"];
      const font = text["font"];
      const fillColour = text["fillcolour"];
      if (canvas.getContext) {
        ctx.save();
        const canvasCoord = thePlot.p2c({ x: text["x"], y: text["y"] });
        const posLeft = canvasCoord["left"] + plotOffset["left"];
        const posTop = canvasCoord["top"] + plotOffset["top"];
        if (font !== "") {
          ctx.font = font;
        }
        ctx.fillStyle = fillColour;
        ctx.fillText(text["text"], posLeft, posTop);
        ctx.restore();
      }
    }

    if ("linestrip" in shape) {
      const linestrip = shape["linestrip"];
      const lineColour = linestrip["linecolour"];
      const lineSize = linestrip["linesize"];
      const lineStyle = linestrip["linestyle"];
      if (canvas.getContext) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = lineColour;
        ctx.lineWidth = lineSize;
        if (lineStyle) ctx.setLineDash(lineStyle);
        let canvasCoord = thePlot.p2c({
          x: linestrip["data"][0][0],
          y: linestrip["data"][0][1],
        });
        if (yaxisOverride != 1) {
          const canvasCoordy = this.p2cNY(
            thePlot,
            { y: linestrip["data"][0][1] },
            yaxisOverride
          );
          canvasCoord["top"] = canvasCoordy["top"];
        }
        let posLeft = canvasCoord["left"] + plotOffset["left"];
        let posTop = canvasCoord["top"] + plotOffset["top"];
        ctx.moveTo(posLeft, posTop);
        for (let ip = 1; ip < linestrip["data"].length; ip++) {
          canvasCoord = thePlot.p2c({
            x: linestrip["data"][ip][0],
            y: linestrip["data"][ip][1],
          });
          if (yaxisOverride != 1) {
            const canvasCoordy = this.p2cNY(
              thePlot,
              { y: linestrip["data"][ip][1] },
              yaxisOverride
            );
            canvasCoord["top"] = canvasCoordy["top"];
          }
          const posLeft2 = canvasCoord["left"] + plotOffset["left"];
          const posTop2 = canvasCoord["top"] + plotOffset["top"];
          //console.log(posLeft,posTop,posLeft2,posTop2)
          if (!lineStyle || (lineStyle && haveDashedLines)) {
            ctx.lineTo(posLeft2, posTop2);
          } else if (lineStyle && !haveDashedLines) {
            this.drawDashedLine(
              ctx,
              posLeft,
              posTop,
              posLeft2,
              posTop2,
              lineStyle
            );
            posLeft = posLeft2;
            posTop = posTop2;
          }
        }
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      }
    }

    if ("polygon" in shape) {
      const polygon = shape["polygon"];
      const fillColour = polygon["fillcolour"];
      const lineColour = polygon["linecolour"];
      const lineSize = polygon["linesize"];
      const lineStyle = polygon["linestyle"];
      if (canvas.getContext) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = lineColour;
        ctx.fillStyle = fillColour;
        ctx.lineWidth = lineSize;
        if (lineStyle) ctx.setLineDash(lineStyle);
        let canvasCoord = thePlot.p2c({
          x: polygon["data"][0][0],
          y: polygon["data"][0][1],
        });
        if (yaxisOverride != 1) {
          const canvasCoordy = this.p2cNY(
            thePlot,
            { y: polygon["data"][0][1] },
            yaxisOverride
          );
          canvasCoord["top"] = canvasCoordy["top"];
        }
        let posLeft = canvasCoord["left"] + plotOffset["left"];
        let posTop = canvasCoord["top"] + plotOffset["top"];
        const posLeft_orig = canvasCoord["left"] + plotOffset["left"];
        const posTop_orig = canvasCoord["top"] + plotOffset["top"];
        let posLeft2;
        let posTop2;
        ctx.moveTo(posLeft, posTop);
        for (let ip = 1; ip < polygon["data"].length; ip++) {
          canvasCoord = thePlot.p2c({
            x: polygon["data"][ip][0],
            y: polygon["data"][ip][1],
          });
          if (yaxisOverride != 1) {
            const canvasCoordy = this.p2cNY(
              thePlot,
              { y: polygon["data"][ip][1] },
              yaxisOverride
            );
            canvasCoord["top"] = canvasCoordy["top"];
          }
          posLeft2 = canvasCoord["left"] + plotOffset["left"];
          posTop2 = canvasCoord["top"] + plotOffset["top"];
          if (!lineStyle || (lineStyle && haveDashedLines)) {
            ctx.lineTo(posLeft2, posTop2);
          } else if (lineStyle && !haveDashedLines) {
            this.drawDashedLine(
              ctx,
              posLeft,
              posTop,
              posLeft2,
              posTop2,
              lineStyle
            );
            posLeft = posLeft2;
            posTop = posTop2;
          }
        }
        if (!lineStyle || (lineStyle && haveDashedLines)) {
          ctx.lineTo(posLeft, posTop);
        } else if (lineStyle && !haveDashedLines) {
          this.drawDashedLine(
            ctx,
            posLeft2,
            posTop2,
            posLeft_orig,
            posTop_orig,
            lineStyle
          );
          posLeft = posLeft2;
          posTop = posTop2;
        }
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        canvasCoord = thePlot.p2c({
          x: polygon["data"][0][0],
          y: polygon["data"][0][1],
        });
        if (yaxisOverride != 1) {
          const canvasCoordy = this.p2cNY(
            thePlot,
            { y: polygon["data"][0][1] },
            yaxisOverride
          );
          canvasCoord["top"] = canvasCoordy["top"];
        }
        posLeft = canvasCoord["left"] + plotOffset["left"];
        posTop = canvasCoord["top"] + plotOffset["top"];
        ctx.moveTo(posLeft, posTop);
        for (let ip = 1; ip < polygon["data"].length; ip++) {
          canvasCoord = thePlot.p2c({
            x: polygon["data"][ip][0],
            y: polygon["data"][ip][1],
          });
          if (yaxisOverride != 1) {
            const canvasCoordy = this.p2cNY(
              thePlot,
              { y: polygon["data"][ip][1] },
              yaxisOverride
            );
            canvasCoord["top"] = canvasCoordy["top"];
          }
          const posLeft2 = canvasCoord["left"] + plotOffset["left"];
          const posTop2 = canvasCoord["top"] + plotOffset["top"];
          ctx.lineTo(posLeft2, posTop2);
        }
        ctx.lineTo(posLeft, posTop);
        ctx.fill();
        ctx.restore();
      }
    }

    if ("circle" in shape) {
      const circle = shape["circle"];

      let canvasCoord = thePlot.p2c({ x: circle["x"], y: circle["y"] });
      if (yaxisOverride != 1) {
        const canvasCoordy = this.p2cNY(
          thePlot,
          { y: circle["y"] },
          yaxisOverride
        );
        canvasCoord["top"] = canvasCoordy["top"];
      }
      //console.log(canvasCoord)
      const radius = parseInt(Math.floor(xscale * circle["radius"]));
      const fillColour = circle["fillcolour"];
      const lineColour = circle["linecolour"];
      const lineSize = circle["linesize"];
      const lineStyle = circle["linestyle"];

      const posLeft = canvasCoord["left"] + plotOffset["left"];
      const posTop = canvasCoord["top"] + plotOffset["top"];
      if (canvas.getContext) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = lineColour;
        ctx.lineWidth = lineSize;
        if (lineStyle) ctx.setLineDash(lineStyle);
        ctx.arc(posLeft, posTop, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColour;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(posLeft, posTop, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      }
    }
  }
};

CCP4GraphPlot.prototype.replot = function () {
  $(`#${this.currentGraph.graphID}`).empty();
  this.plot();
};

CCP4GraphPlot.prototype.getCurrentPlotOptions = function () {
  return this.currentGraph.options;
};

CCP4GraphPlot.prototype.getCurrentPlotName = function () {
  return this.currentGraph.titles;
};

CCP4GraphPlot.prototype.getCurrentPlotData = function () {
  return this.currentGraph.graphData;
};

CCP4GraphPlot.prototype.getPlotOptions = function (iplot) {
  return this.graphs[iplot].options;
};

CCP4GraphPlot.prototype.getPlotName = function (iplot) {
  return this.graphs[iplot].titles;
};

CCP4GraphPlot.prototype.getPlotData = function (iplot) {
  return this.graphs[iplot].graphData;
};

CCP4GraphPlot.prototype.getNumberOfPlots = function () {
  return this.graphs.length;
};

CCP4GraphPlot.prototype.plot = async function () {
  const usePlotly = this.currentGraph.usePlotly;
  const xbreak = this.currentGraph.xbreaks;
  const ybreak = this.currentGraph.ybreaks;
  const options = this.currentGraph.options;
  const shapes = this.currentGraph.shapes;
  const graphName = this.currentGraph.graphID;
  const d = this.currentGraph.graphData;
  const titles = this.currentGraph.titles;

  const customXTicks = this.currentGraph.customXTicks;
  const customYTicks = this.currentGraph.customYTicks;

  if (!this.haveLaunchButton) {
    this.createLaunchButton();
  }

  const current_idx = this.graphs.indexOf(this.currentGraph);
  this.launchDataIDCurrentIndex.attr("value", current_idx);

  const theRealOuterDiv = $(`#${graphName}`);

  if (typeof xbreak !== "undefined" && xbreak.length > 0) {
    this.plotWithBreaks(
      theRealOuterDiv,
      xbreak,
      d,
      options,
      customXTicks,
      customYTicks,
      usePlotly
    );
  } else {
    this.plotWithoutBreaks(
      theRealOuterDiv,
      d,
      options,
      customXTicks,
      customYTicks,
      usePlotly
    );
  }

  theRealOuterDiv.find("canvas").each(function (iCanvas, aCanvas) {
    const ctx = aCanvas.getContext("2d");
    ctx.restore();
  });
};

CCP4GraphPlot.prototype.createLaunchButton = function () {
  this.haveLaunchButton = true;
  const launchButton = $("<object>")
    .attr("style", "float:right; position:relative; width:100%;")
    .addClass("qt_launch")
    .attr("type", "x-ccp4-widget/CLauncherButton");

  const launchParams = [
    { name: "label", value: "" },
    { name: "exe", value: "loggraph" },
    { name: "icon", value: "zoom.svg" },
    { name: "tooltip", value: "Open graph viewer" },
  ];

  launchParams.forEach((param) => {
    $("<param>")
      .attr("name", param.name)
      .attr("value", param.value)
      .appendTo(launchButton);
  });

  this.launchDataIDParam = $("<param>")
    .attr("name", "ccp4_data_id")
    .attr("value", this.dataID)
    .appendTo(launchButton);

  this.launchDataIDCurrentIndex = $("<param>")
    .attr("name", "ccp4_data_current_index")
    .attr("value", -1)
    .appendTo(launchButton);

  this.launchJobIdParam = $("<param>")
    .attr("name", "jobId")
    .attr("value", "")
    .appendTo(launchButton);
};

CCP4GraphPlot.prototype.plotWithBreaks = async function (
  theRealOuterDiv,
  xbreak,
  d,
  options,
  customXTicks,
  customYTicks,
  usePlotly
) {
  const yaxes = this.getYAxesWithBreaks(options, xbreak);
  const xaxes = this.getXAxesWithBreaks(options, xbreak);
  const bs = this.createBreakDivs(theRealOuterDiv, xaxes.length);

  const divTop = this.createTopDiv(theRealOuterDiv, options, xaxes.length);
  divTop.append(bs);
  for (let ib = 0; ib < bs.length; ib++) {
    const dRight = this.adjustDataForBreaks(d, ib, bs.length);
    const layout = this.getLayoutForBreaks(
      options,
      xaxes,
      yaxes,
      ib,
      customXTicks,
      customYTicks
    );
    const bDName = bs[ib].attr("id");

    if (ib < bs.length - 1) {
      await this.plotSingleBreak(dRight, bDName, layout, usePlotly, "xleft");
    } else {
      await this.plotSingleBreak(dRight, bDName, layout, usePlotly, "xright");
    }

    this.bindPlotEvents(bDName, theRealOuterDiv, options);
  }
};

CCP4GraphPlot.prototype.plotWithoutBreaks = async function (
  theRealOuterDiv,
  d,
  options,
  customXTicks,
  customYTicks,
  usePlotly
) {
  const yaxes = this.getYAxesWithoutBreaks(options);
  const xaxes = this.getXAxesWithoutBreaks(options);

  const divTop = this.createTopDiv(theRealOuterDiv, options, 1);

  const layout = this.getLayoutWithoutBreaks(
    options,
    xaxes,
    yaxes,
    customXTicks,
    customYTicks
  );

  if (usePlotly) {
    this.plotlyPlot(d, divTop, layout, null, true);
  } else {
    const thePlot = await import("jquery.flot").then((result) =>
      $.plot(divTop, d, layout)
    );
    this.plotShapes(thePlot, 1);
    this.drawBackground(thePlot, divTop);
  }

  this.bindPlotEvents(theRealOuterDiv.attr("id"), theRealOuterDiv, options);
};

CCP4GraphPlot.prototype.getYAxesWithBreaks = function (options, xbreak) {
  let yaxes = [];
  let yaxes2 = [];
  let yr;
  let yr2;

  if ("yrange" in options) {
    yr = { ...options["yrange"] };
    yr2 = { ...options["yrange"] };
    yaxes = [yr];
    yaxes2 = [yr2];
    for (let ibr = 0; ibr <= xbreak.length / 2; ibr++) {
      yaxes.push({ ...yr });
    }
  } else {
    yaxes = [{}];
    yr2 = {};
    yaxes2 = [yr2];
  }

  if ("ryrange" in options) {
    yr = { ...options["ryrange"] };
    yr2 = { ...options["ryrange"] };
    yr["position"] = "right";
    yaxes.push(yr);
    yr2["position"] = "right";
    yaxes2.push(yr2);
    for (let ibr = 0; ibr <= xbreak.length / 2; ibr++) {
      yaxes.push({ ...yr });
    }
  } else {
    yr = {};
    yaxes.push(yr);
    yr2 = {};
    yr2["position"] = "right";
    yaxes2.push(yr2);
  }

  return yaxes;
};

CCP4GraphPlot.prototype.getXAxesWithBreaks = function (options, xbreak) {
  let xaxes;
  const xax = [];
  if ("xrange" in options) {
    let xr = { ...options["xrange"] };
    let xr2 = { ...options["xrange"] };
    xr["max"] = xbreak[0];
    xr2["min"] = xbreak[1];
    xax.push({ ...xr });
    for (let ibr = 0; ibr < xbreak.length / 2 - 1; ibr++) {
      xax.push({ min: xbreak[2 * ibr + 1], max: xbreak[2 * ibr + 2] });
    }
    const xr2p = { ...xr2 };
    xr2p["min"] = xbreak[xbreak.length - 1];
    xax.push(xr2p);
    xaxes = xax;
  } else {
    xaxes = [xbreak[0]];
  }

  return xaxes;
};

CCP4GraphPlot.prototype.createBreakDivs = function (theRealOuterDiv, length) {
  const bs = [];
  const N = 20;
  let pcwidth;
  const lastchar = theRealOuterDiv.css("width").slice(-1);
  if (lastchar === "%") {
    pcwidth = parseInt(theRealOuterDiv.css("width")) / length - 2 + "%";
  } else {
    pcwidth = parseInt(theRealOuterDiv.css("width")) / length - 2 + "px";
  }

  for (let ibr = 0; ibr < length; ibr++) {
    const bDName = new Array(N + 1)
      .join((Math.random().toString(36) + "00000000000000000").slice(2, 18))
      .slice(0, N);
    const b = $("<div>")
      .attr(
        "style",
        `width:${pcwidth};height:${theRealOuterDiv.css("height")};float:left;`
      )
      .attr("id", bDName);
    bs.push(b);
  }
  return bs;
};

CCP4GraphPlot.prototype.createTopDiv = function (
  theRealOuterDiv,
  options,
  length
) {
  let divTop;
  let hTop = parseInt(theRealOuterDiv.css("height"));

  if (options.titles && options.titles.xlabel) {
    divTop = $("<div>");
    const divBot = $("<div>").addClass("xlabel");
    theRealOuterDiv.append(divTop).append(divBot);
    const h = parseInt(divBot.height());
    if (!isNaN(h)) {
      hTop = parseInt(theRealOuterDiv.css("height")) - h;
      divTop.attr("style", `width:100%;height:${hTop - 1}px;float:top;`);
    }
    divBot.html(options.titles.xlabel.trim().replace(/\s+/, "&nbsp;"));
  } else {
    divTop = theRealOuterDiv;
    divTop.attr("style", `width:100%;height:${hTop - 1}px;float:top;`);
  }
  return divTop;
};

CCP4GraphPlot.prototype.adjustDataForBreaks = function (d, ib, length) {
  const dRight = jQuery.extend(true, [], d);
  for (let idata = 0; idata < dRight.length; idata++) {
    if (!dRight[idata]["yaxis"]) {
      if (ib == 0) {
        dRight[idata]["yaxis"] = 1;
      } else {
        dRight[idata]["yaxis"] = 3;
      }
    } else {
      if (ib == length - 1) {
        dRight[idata]["yaxis"] = 2;
      } else {
        dRight[idata]["yaxis"] = 4;
      }
    }
  }
  return dRight;
};

CCP4GraphPlot.prototype.getLayoutForBreaks = function (
  options,
  xaxes,
  yaxes,
  ib,
  customXTicks,
  customYTicks
) {
  const layout = {
    xaxes: [xaxes[ib]],
    yaxes: [
      yaxes[ib][0],
      yaxes[ib][1],
      yaxes[ib][0],
      yaxes[ib][1],
      yaxes[ib][0],
      yaxes[ib][1],
    ],
    grid: { borderWidth: 0, clickable: true, hoverable: true },
    legend: { show: false },
  };

  if (options["xscale"] === "oneoversqrt") {
    layout.xaxes[0]["tickFormatter"] = function (x) {
      const y = 1.0 / Math.sqrt(x);
      if (isFinite(y)) {
        return y.toFixed(2);
      } else {
        return "Inf";
      }
    };
  }
  if (options["xscale"] === "log") {
    layout.xaxes[0]["transform"] = function (v) {
      return v == 0 ? null : Math.log(v);
    };
    layout.xaxes[0]["inverseTransform"] = function (v) {
      return Math.exp(v);
    };
    layout.xaxes[0]["ticks"] = 4;
  }
  if (options["yscale"] === "log") {
    layout.yaxes[0]["transform"] = function (v) {
      return v == 0 ? null : Math.log(v);
    };
    layout.yaxes[0]["inverseTransform"] = function (v) {
      return Math.exp(v);
    };
    layout.yaxes[0]["ticks"] = 4;
    layout.yaxes[1]["transform"] = function (v) {
      return v == 0 ? null : Math.log(v);
    };
    layout.yaxes[1]["inverseTransform"] = function (v) {
      return Math.exp(v);
    };
    layout.yaxes[1]["ticks"] = 4;
  }
  if (options["xintegral"] === true) {
    layout.xaxes[0]["tickDecimals"] = 0;
  }
  if (options["yintegral"] === true) {
    layout.yaxes[0]["tickDecimals"] = 0;
    layout.yaxes[1]["tickDecimals"] = 0;
  }
  if (customXTicks) {
    layout.xaxes[0]["ticks"] = customXTicks;
  }
  if (customYTicks) {
    layout.yaxes[0]["ticks"] = customYTicks;
  }

  return layout;
};

CCP4GraphPlot.prototype.plotSingleBreak = async function (
  dRight,
  bDName,
  layout,
  usePlotly,
  breakLocation
) {
  if (usePlotly) {
    this.plotlyPlot(dRight, bDName, layout, breakLocation, true);
  } else {
    const thePlot2 = await import("jquery.flot").then((result) =>
      $.plot(`#${bDName}`, dRight, layout)
    );
    this.plotShapes(thePlot2, 1);
  }
};

CCP4GraphPlot.prototype.bindPlotEvents = function (
  bDName,
  theRealOuterDiv,
  options
) {
  $(`#${bDName}`).bind("plotclick", function (event, pos, item) {
    if (item) {
      theRealOuterDiv[0].clickevtone = document.createEvent("CustomEvent");
      if (options["xscale"] === "oneoversqrt") {
        let datax = 99999.99;
        if (isFinite(1.0 / Math.sqrt(item["datapoint"][0]))) {
          datax = 1.0 / Math.sqrt(item["datapoint"][0]);
        }
        theRealOuterDiv[0].clickevtone.initCustomEvent(
          "plotClick",
          false,
          false,
          {
            x: datax,
            y: item["datapoint"][1],
          }
        );
      } else {
        theRealOuterDiv[0].clickevtone.initCustomEvent(
          "plotClick",
          false,
          false,
          {
            x: item["datapoint"][0],
            y: item["datapoint"][1],
          }
        );
      }
      theRealOuterDiv[0].dispatchEvent(theRealOuterDiv[0].clickevtone);
    }
  });
  $(`#${bDName}`).bind("plothover", function (event, pos, item) {
    if (item) {
      theRealOuterDiv[0].hoverevtone = document.createEvent("CustomEvent");
      if (options["xscale"] === "oneoversqrt") {
        let datax = 99999.99;
        if (isFinite(1.0 / Math.sqrt(item["datapoint"][0]))) {
          datax = 1.0 / Math.sqrt(item["datapoint"][0]);
        }
        theRealOuterDiv[0].hoverevtone.initCustomEvent(
          "plotHover",
          false,
          false,
          {
            x: datax,
            y: item["datapoint"][1],
          }
        );
      } else {
        theRealOuterDiv[0].hoverevtone.initCustomEvent(
          "plotHover",
          false,
          false,
          {
            x: item["datapoint"][0],
            y: item["datapoint"][1],
          }
        );
      }
      theRealOuterDiv[0].dispatchEvent(theRealOuterDiv[0].hoverevtone);
    }
  });
};

CCP4GraphPlot.prototype.getYAxesWithoutBreaks = function (options) {
  let yaxes;
  if ("yrange" in options) {
    yaxes = [options["yrange"]];
  } else {
    yaxes = [{}];
  }
  if ("ryrange" in options) {
    let yr = jQuery.extend(true, {}, options["ryrange"]);
    yr["position"] = "right";
    yr["color"] = "red";
    if (yr["max"] < yr["min"]) {
      yr["transform"] = function (v) {
        return -v;
      };
      yr["inverseTransform"] = function (v) {
        return -v;
      };
      const ymax = options["ryrange"]["max"];
      const ymin = options["ryrange"]["min"];
      yr["max"] = ymin;
      yr["min"] = ymax;
    }
    yaxes.push(yr);
  }
  return yaxes;
};

CCP4GraphPlot.prototype.getXAxesWithoutBreaks = function (options) {
  let xaxes;
  if ("xrange" in options) {
    xaxes = [options["xrange"]];
  } else {
    xaxes = [{}];
  }
  return xaxes;
};

CCP4GraphPlot.prototype.getLayoutWithoutBreaks = function (
  options,
  xaxes,
  yaxes,
  customXTicks,
  customYTicks
) {
  const layout = {
    xaxes: xaxes,
    yaxes: yaxes,
    grid: { borderWidth: 0, clickable: true, hoverable: true },
    legend: { show: false },
    series: options.series,
  };

  if (options["xscale"] === "oneoversqrt") {
    layout.xaxes[0]["tickFormatter"] = function (x) {
      const y = 1.0 / Math.sqrt(x);
      if (isFinite(y)) {
        return y.toFixed(2);
      } else {
        return "Inf";
      }
    };
  }
  if (options["xscale"] === "log") {
    layout.xaxes[0]["transform"] = function (v) {
      return v == 0 ? null : Math.log(v);
    };
    layout.xaxes[0]["inverseTransform"] = function (v) {
      return Math.exp(v);
    };
    layout.xaxes[0]["ticks"] = 4;
  }
  if (options["yscale"] === "log") {
    layout.yaxes[0]["transform"] = function (v) {
      return v == 0 ? null : Math.log(v);
    };
    layout.yaxes[0]["inverseTransform"] = function (v) {
      return Math.exp(v);
    };
    layout.yaxes[0]["ticks"] = 4;
  }
  if (options["yrange"]["max"] < options["yrange"]["min"]) {
    layout.yaxes[0]["transform"] = function (v) {
      return -v;
    };
    layout.yaxes[0]["inverseTransform"] = function (v) {
      return -v;
    };
    const ymax = options["yrange"]["max"];
    const ymin = options["yrange"]["min"];
    layout.yaxes[0]["max"] = ymin;
    layout.yaxes[0]["min"] = ymax;
  }
  if (options["xrange"]["max"] < options["xrange"]["min"]) {
    layout.xaxes[0]["transform"] = function (v) {
      return -v;
    };
    layout.xaxes[0]["inverseTransform"] = function (v) {
      return -v;
    };
    const xmax = options["xrange"]["max"];
    const xmin = options["xrange"]["min"];
    layout.xaxes[0]["max"] = xmin;
    layout.xaxes[0]["min"] = xmax;
  }
  if (options["xintegral"] === true) {
    layout.xaxes[0]["tickDecimals"] = 0;
  }
  if (options["yintegral"] === true) {
    layout.yaxes[0]["tickDecimals"] = 0;
  }
  if (customXTicks) {
    layout.xaxes[0]["ticks"] = customXTicks;
  }
  if (customYTicks) {
    layout.yaxes[0]["ticks"] = customYTicks;
  }

  return layout;
};

//Here

CCP4GraphPlot.prototype.loadXML = function (graphObject, root, tables) {
  if (!graphObject.graphDivName) {
    return;
  }

  const pimpleplot = $(`#${graphObject.graphDivName}`);
  pimpleplot.empty();
  graphObject.graphs = [];

  const myNodeSelect = $(`#${graphObject.menuSelectName}`);
  myNodeSelect.empty();

  this.dataID = this.getDataID(tables);
  for (let itab = 0; itab < tables.length; itab++) {
    const table = tables[itab];
    const usePlotly = this.getUsePlotly(table);
    const title = table.getAttribute("title");

    if (table.getElementsByTagName("data").length == 0) {
      console.log(`Table called "${title}" had no associated data`);
      continue;
    }

    const data = this.getData(table);
    const headers = this.getHeaders(table);
    const dataColRow = this.getDataColRow(headers, data);

    const plots = table.getElementsByTagName("plot");
    const selectGroup = this.createSelectGroup(title, myNodeSelect);

    for (let iplot = 0; iplot < plots.length; iplot++) {
      const plot = plots[iplot];
      const plot_title = this.getPlotTitle(plot);
      const plot_description = this.getPlotDescription(plot);
      const d = this.getPlotData(plot, headers, data, dataColRow);
      const options = this.getPlotOptions(plot);
      const shapes = this.getPlotShapes(plot, graphObject);
      const titles = this.getPlotTitles(
        plot,
        plot_title,
        plot_description,
        headers,
        data,
        dataColRow,
        d
      );
      const background = this.getPlotBackground(plot);
      const customXTicks = this.getCustomXTicks(plot, d);
      const customYTicks = this.getCustomYTicks(plot, d);

      const graphName = `${graphObject.graphDivName}${itab}${iplot}`;
      const thisPlotDiv = this.createPlotDiv(
        graphName,
        graphObject.graphDivName,
        pimpleplot
      );

      const selectItem = this.createSelectItem(
        plot_title,
        graphName,
        selectGroup,
        iplot,
        plots.length,
        itab,
        tables.length
      );

      const graph = new CCP4Graph(
        graphName,
        d,
        options.xbreak,
        options.ybreak,
        options,
        shapes,
        titles,
        background,
        customXTicks,
        customYTicks,
        usePlotly
      );

      this.addPlotEventListeners(
        thisPlotDiv,
        graphObject,
        graphName,
        plot_title
      );

      graphObject.graphs.push(graph);
    }
  }

  this.finalizeGraph(graphObject, pimpleplot);
};

CCP4GraphPlot.prototype.clearElement = function (element) {
  $(element).empty();
};

CCP4GraphPlot.prototype.getDataID = function (tables) {
  let dataID = "";
  for (let itab = 0; itab < tables.length; itab++) {
    dataID = `${dataID}${tables[itab].getAttribute("id")},`;
  }
  return dataID;
};

CCP4GraphPlot.prototype.getUsePlotly = function (table) {
  let usePlotly = false;
  try {
    usePlotly = table.getAttribute("usePlotly") === "True";
  } catch (err) {
    usePlotly = false;
  }
  return usePlotly;
};

CCP4GraphPlot.prototype.getData = function (table) {
  return $.trim(getNodeText(table.getElementsByTagName("data")[0])).split("\n");
};

CCP4GraphPlot.prototype.getHeaders = function (table) {
  let headers_sep = " ";
  if (table.getElementsByTagName("headers")[0].hasAttribute("separator")) {
    headers_sep = table
      .getElementsByTagName("headers")[0]
      .getAttribute("separator");
  }
  return $.trim(
    table.getElementsByTagName("headers")[0].childNodes[0].nodeValue
  )
    .replace(/ +/g, " ")
    .split(headers_sep);
};

CCP4GraphPlot.prototype.getDataColRow = function (headers, data) {
  const dataColRow = headers.map(() => []);
  for (let idatarow = 0; idatarow < data.length; idatarow++) {
    const thisDataRow = $.trim(data[idatarow]).replace(/ +/g, " ").split(" ");
    for (let idatacol = 0; idatacol < headers.length; idatacol++) {
      if (thisDataRow[idatacol] == "-") {
        dataColRow[idatacol].push(null);
      } else {
        dataColRow[idatacol].push(parseFloat(thisDataRow[idatacol]));
      }
    }
  }
  return dataColRow;
};

CCP4GraphPlot.prototype.createSelectGroup = function (title, myNodeSelect) {
  const selectGroup = $("<optgroup>").attr(
    "label",
    title.replace("<", "&lt;").replace(">", "&gt;")
  );
  myNodeSelect.append(selectGroup);
  return selectGroup;
};

CCP4GraphPlot.prototype.getPlotTitle = function (plot) {
  let plot_title = "";
  const plotNodes = plot.getElementsByTagName("title");
  if (plotNodes.length > 0) {
    plot_title = plotNodes[0].childNodes[0].nodeValue
      .replace("<", "&lt;")
      .replace(">", "&gt;");
  }
  return plot_title;
};

CCP4GraphPlot.prototype.getPlotDescription = function (plot) {
  let plot_description = "";
  const plotDescriptionNodes = plot.getElementsByTagName("description");
  if (plotDescriptionNodes.length > 0) {
    plot_description = plotDescriptionNodes[0].childNodes[0].nodeValue
      .trim()
      .replace("<", "&lt;")
      .replace(">", "&gt;")
      .replace(/\n/g, "<br>");
  }
  return plot_description;
};

CCP4GraphPlot.prototype.getPlotData = function (
  plot,
  headers,
  data,
  dataColRow
) {
  const plotlines = plot.getElementsByTagName("plotline");
  const d = [];
  for (let iplotline = 0; iplotline < plotlines.length; iplotline++) {
    const plotline = plotlines[iplotline];
    const xcol = parseInt(plotline.getAttribute("xcol")) - 1;
    const ycol = parseInt(plotline.getAttribute("ycol")) - 1;
    let label;
    try {
      label = plotline.getElementsByTagName("label")[0].childNodes[0].nodeValue;
    } catch (err) {
      label = headers[ycol];
    }

    const d1 = this.getPlotlineData(plotline, data, dataColRow, xcol, ycol);

    let theData = this.getPlotlineDataObject(plotline, d1, label);

    this.setPlotlineDataAttributes(plotline, theData);

    d.push(theData);
  }
  return d;
};

CCP4GraphPlot.prototype.getPlotlineData = function (
  plotline,
  data,
  dataColRow,
  xcol,
  ycol
) {
  const d1 = [];
  let averagebatches = false;
  let averagebatchcol = null;
  try {
    averagebatches =
      plotline.getElementsByTagName("averagebatches")[0].childNodes[0]
        .nodeValue;
    if (averagebatches == "true" || averagebatches == "1") {
      averagebatches = true;
      averagebatchcol =
        parseInt(
          plotline.getElementsByTagName("averagebatchcol")[0].childNodes[0]
            .nodeValue
        ) - 1;
    } else {
      averagebatches = false;
      averagebatchcol = null;
    }
  } catch (err) {
    averagebatches = null;
  }

  if (!averagebatches) {
    for (let idatarow = 0; idatarow < data.length; idatarow++) {
      if (xcol < dataColRow.length && ycol < dataColRow.length) {
        d1.push([dataColRow[xcol][idatarow], dataColRow[ycol][idatarow]]);
      } else {
        console.log(`Had not right column`);
      }
    }
  } else {
    let oldbatchnum = null;
    let nbatch = 0;
    let thisBatchVal = 0;
    let theXCol;
    for (let idatarow = 0; idatarow < data.length; idatarow++) {
      const batchnum = dataColRow[averagebatchcol][idatarow];
      if (batchnum == oldbatchnum || oldbatchnum === null) {
        thisBatchVal += dataColRow[ycol][idatarow];
        theXCol = dataColRow[xcol][idatarow];
        nbatch++;
      } else {
        const avg = thisBatchVal / nbatch;
        d1.push([theXCol, avg]);
        nbatch = 0;
        thisBatchVal = 0;
      }
      oldbatchnum = batchnum;
    }
    const avg = thisBatchVal / nbatch;
    d1.push([theXCol, avg]);
  }
  return d1;
};

CCP4GraphPlot.prototype.getPlotlineDataObject = function (plotline, d1, label) {
  let theData;
  try {
    const visible =
      plotline.getElementsByTagName("visible")[0].childNodes[0].nodeValue;
    if (visible && (visible == "false" || visible == "0")) {
      return;
    }
  } catch (err) {}

  try {
    const showinlegend =
      plotline.getElementsByTagName("showinlegend")[0].childNodes[0].nodeValue;
    if (showinlegend && (showinlegend == "false" || showinlegend == "0")) {
      theData = { data: d1 };
    } else {
      theData = { label: label, data: d1 };
    }
  } catch (err) {
    theData = { label: label, data: d1 };
  }
  return theData;
};

CCP4GraphPlot.prototype.setPlotlineDataAttributes = function (
  plotline,
  theData
) {
  try {
    let colour =
      plotline.getElementsByTagName("colour")[0].childNodes[0].nodeValue;
    if (colour == "r") colour = "red";
    if (colour == "g") colour = "green";
    if (colour == "b") colour = "blue";
    if (colour == "y") colour = "yellow";
    if (colour == "m") colour = "magenta";
    if (colour == "c") colour = "cyan";
    if (colour == "w") colour = "white";
    if (colour == "b") colour = "black";
    theData["color"] = colour;
  } catch (err) {}

  try {
    const rightaxis = plotline.getAttribute("rightaxis");
    if (!rightaxis || rightaxis == "false" || rightaxis == 0) {
    } else {
      theData["yaxis"] = 2;
    }
  } catch (err) {}

  let haveLine = true;
  let haveDash = false;
  try {
    const linestyle =
      plotline.getElementsByTagName("linestyle")[0].childNodes[0].nodeValue;
    if (linestyle == "--") {
      theData["lines"] = { show: false };
      haveLine = false;
      haveDash = true;
      theData["dashes"] = { show: true, dashLength: [8, 8] };
    } else if (linestyle == ":") {
      theData["lines"] = { show: false };
      haveLine = false;
      haveDash = true;
      theData["dashes"] = { show: true, dashLength: [4, 4] };
    } else if (linestyle == "-.") {
      theData["lines"] = { show: false };
      theData["shadowSize"] = 0;
      haveLine = false;
      haveDash = true;
      theData2 = jQuery.extend(true, {}, theData);
      theData["dashes"] = { show: true, dashLength: [12, 12] };
      theData2["dashes"] = { show: true, dashLength: [3, 3] };
      if ("label" in theData2) {
        delete theData2["label"];
      }
    } else if (linestyle == "." || linestyle == "_") {
      theData["lines"] = { show: false };
      haveLine = false;
    }
  } catch (err) {}

  try {
    let symbol = "circle";
    if (plotline.getElementsByTagName("symbol").length > 0) {
      symbol =
        plotline.getElementsByTagName("symbol")[0].childNodes[0].nodeValue;
      if (symbol == "o") {
        symbol = "circle";
      } else if (symbol == "d") {
        symbol = "diamond";
      } else if (symbol == "s") {
        symbol = "square";
      } else if (symbol == "^") {
        symbol = "triangle";
      } else if (symbol == "x") {
        symbol = "cross";
      } else {
        symbol = "circle";
      }
    }
    if (plotline.getElementsByTagName("fillcolour").length > 0) {
      const fillcolour =
        plotline.getElementsByTagName("fillcolour")[0].childNodes[0].nodeValue;
      if (fillcolour == "false") {
        if (symbol === "none") {
          theData["points"] = { show: false };
        } else {
          theData["points"] = {
            symbol: symbol,
            fill: 1.0,
            fillColor: false,
            show: true,
          };
        }
      } else {
        if (symbol === "none") {
          theData["points"] = { show: false };
        } else {
          theData["points"] = {
            symbol: symbol,
            fillColor: fillcolour,
            show: true,
          };
        }
      }
    } else {
      if (symbol === "none") {
        theData["points"] = { show: false };
      } else {
        theData["points"] = { symbol: symbol, show: true };
      }
    }
    if (haveLine) {
      theData["lines"] = { show: true };
    }
  } catch (err) {}

  try {
    const symbolsize =
      parseInt(
        plotline.getElementsByTagName("symbolsize")[0].childNodes[0].nodeValue
      ) /
        2 +
      1;
    if ("points" in theData) {
      theData["points"]["radius"] = symbolsize;
    } else {
      theData["points"] = { show: true, radius: symbolsize };
    }
    if (haveLine) {
      theData["lines"] = { show: true };
    }
  } catch (err) {}

  try {
    const linesize = parseInt(
      plotline.getElementsByTagName("linesize")[0].childNodes[0].nodeValue
    );
    if (haveLine && "lines" in theData) {
      theData["lines"]["lineWidth"] = linesize;
    }
    if (haveDash && "dashes" in theData) {
      theData["dashes"]["lineWidth"] = linesize;
      if (typeof theData2 !== "undefined" && "dashes" in theData) {
        theData2["dashes"]["lineWidth"] = linesize;
      }
    }
  } catch (err) {}

  let averagebatches = false;
  try {
    plotline.getElementsByTagName("averagebatches")[0].childNodes[0].nodeValue;
  } catch (err) {
    averagebatches = false;
  }

  if (averagebatches) {
    try {
      theData["shadowSize"] = 0;
    } catch (err) {}
  }
};

CCP4GraphPlot.prototype.getPlotOptions = function (plot) {
  const xrange = {};
  const yrange = {};
  const ryrange = {};
  const xranges = plot.getElementsByTagName("xrange");
  if (xranges.length > 0) {
    const rangeEl = xranges[0];
    try {
      const minx = parseFloat(rangeEl.getAttribute("min"));
      if (!isNaN(minx)) {
        xrange["min"] = minx;
      }
    } catch (err) {}
    try {
      const maxx = parseFloat(rangeEl.getAttribute("max"));
      if (!isNaN(maxx)) {
        xrange["max"] = maxx;
      }
    } catch (err) {}
  }
  const yranges = plot.getElementsByTagName("yrange");
  for (let iyr = 0; iyr < yranges.length; iyr++) {
    if (
      !yranges[iyr].getAttribute("rightaxis") ||
      yranges[iyr].getAttribute("rightaxis") == "false" ||
      yranges[iyr].getAttribute("rightaxis") == "0"
    ) {
      try {
        const miny = parseFloat(yranges[iyr].getAttribute("min"));
        if (!isNaN(miny)) {
          yrange["min"] = miny;
        }
      } catch (err) {}
      try {
        const maxy = parseFloat(yranges[iyr].getAttribute("max"));
        if (!isNaN(maxy)) {
          yrange["max"] = maxy;
        }
      } catch (err) {}
    } else {
      try {
        const miny = parseFloat(yranges[iyr].getAttribute("min"));
        if (!isNaN(miny)) {
          ryrange["min"] = miny;
        }
      } catch (err) {}
      try {
        const maxy = parseFloat(yranges[iyr].getAttribute("max"));
        if (!isNaN(maxy)) {
          ryrange["max"] = maxy;
        }
      } catch (err) {}
    }
  }

  const xbreaks = plot.getElementsByTagName("xbreaks");
  const xbreak = [];
  if (xbreaks.length > 0) {
    const xbreakEl = xbreaks[0];
    const breaks = xbreakEl.getElementsByTagName("break");
    if (breaks.length < 500) {
      for (let ibr = 0; ibr < breaks.length; ibr++) {
        const breakEl = breaks[ibr];
        xbreak.push(
          parseFloat(breakEl.getAttribute("min")),
          parseFloat(breakEl.getAttribute("max"))
        );
      }
    }
  }
  const ybreak = [];
  const options = { xrange, yrange, ryrange, xbreak, ybreak };
  return options;
};

CCP4GraphPlot.prototype.getPlotShapes = function (plot, graphObject) {
  const shapes = [];
  try {
    const linestrips = plot.getElementsByTagName("line");
    for (let ilstrip = 0; ilstrip < linestrips.length; ilstrip++) {
      const dataPoints = [];
      if (!linestrips[ilstrip].getAttribute("x1")) {
        continue;
      } else {
        dataPoints.push(linestrips[ilstrip].getAttribute("x1"));
      }
      if (!linestrips[ilstrip].getAttribute("y1")) {
        continue;
      } else {
        dataPoints.push(linestrips[ilstrip].getAttribute("y1"));
      }
      if (!linestrips[ilstrip].getAttribute("x2")) {
        continue;
      } else {
        dataPoints.push(linestrips[ilstrip].getAttribute("x2"));
      }
      if (!linestrips[ilstrip].getAttribute("y2")) {
        continue;
      } else {
        dataPoints.push(linestrips[ilstrip].getAttribute("y2"));
      }

      const p = [];
      for (let ip = 0; ip < dataPoints.length / 2; ip++) {
        p.push([dataPoints[2 * ip], dataPoints[2 * ip + 1]]);
      }

      let linecolour;
      if (!linestrips[ilstrip].getAttribute("linecolour")) {
        linecolour = "#000000";
      } else {
        linecolour = linestrips[ilstrip].getAttribute("linecolour");
      }
      let linestyle;
      if (!linestrips[ilstrip].getAttribute("linestyle")) {
        linestyle = null;
      } else {
        linestyle = linestrips[ilstrip].getAttribute("linestyle");
        if (linestyle == "dashdot" || linestyle == "-.") {
          linestyle = [3, 2, 8, 2];
        } else if (linestyle == "dash" || linestyle == "--") {
          linestyle = [8, 8];
        } else if (linestyle == "dot" || linestyle == ":") {
          linestyle = [4, 4];
        } else {
          linestyle = null;
        }
      }
      let linesize;
      if (!linestrips[ilstrip].getAttribute("linesize")) {
        linesize = 1;
      } else {
        linesize = parseInt(linestrips[ilstrip].getAttribute("linesize"));
      }
      linecolour = graphObject.parseColourToRGBA(linecolour, 1.0);
      const linestrip = {
        linestrip: {
          data: p,
          linesize: linesize,
          linecolour: linecolour,
          linestyle: linestyle,
        },
      };
      shapes.push(linestrip);
    }
  } catch (err) {}

  try {
    const linestrips = plot.getElementsByTagName("linestrip");
    for (let ilstrip = 0; ilstrip < linestrips.length; ilstrip++) {
      const dataPoints = linestrips[ilstrip].childNodes[0].nodeValue
        .trim()
        .split(/\s+/);
      const p = [];
      for (let ip = 0; ip < dataPoints.length / 2; ip++) {
        p.push([dataPoints[2 * ip], dataPoints[2 * ip + 1]]);
      }
      let linecolour;
      if (!linestrips[ilstrip].getAttribute("linecolour")) {
        linecolour = "#000000";
      } else {
        linecolour = linestrips[ilstrip].getAttribute("linecolour");
      }
      let linestyle;
      if (!linestrips[ilstrip].getAttribute("linestyle")) {
        linestyle = null;
      } else {
        linestyle = linestrips[ilstrip].getAttribute("linestyle");
        if (linestyle == "dashdot" || linestyle == "-.") {
          linestyle = [3, 2, 8, 2];
        } else if (linestyle == "dash" || linestyle == "--") {
          linestyle = [8, 8];
        } else if (linestyle == "dot" || linestyle == ":") {
          linestyle = [4, 4];
        } else {
          linestyle = null;
        }
      }
      let linesize;
      if (!linestrips[ilstrip].getAttribute("linesize")) {
        linesize = 1;
      } else {
        linesize = parseInt(linestrips[ilstrip].getAttribute("linesize"));
      }
      linecolour = graphObject.parseColourToRGBA(linecolour, 1.0);
      const linestrip = {
        linestrip: {
          data: p,
          linesize: linesize,
          linecolour: linecolour,
          linestyle: linestyle,
        },
      };
      shapes.push(linestrip);
    }
  } catch (err) {
    console.log("linestrip woes?");
  }

  try {
    const texts = plot.getElementsByTagName("text");
    for (let itext = 0; itext < texts.length; itext++) {
      const xpos = parseFloat(texts[itext].getAttribute("xpos"));
      const ypos = parseFloat(texts[itext].getAttribute("ypos"));
      const text = texts[itext].textContent;
      let rtext;
      let fillcolour;
      if (!texts[itext].getAttribute("colour")) {
        fillcolour = "#000000";
      } else {
        fillcolour = texts[itext].getAttribute("colour");
      }
      if (texts[itext].getAttribute("font")) {
        const font = texts[itext].getAttribute("font");
        rtext = {
          text: {
            x: xpos,
            y: ypos,
            text: text,
            font: font,
            fillcolour: fillcolour,
          },
        };
      } else {
        rtext = {
          text: {
            x: xpos,
            y: ypos,
            text: text,
            font: "",
            fillcolour: fillcolour,
          },
        };
      }
      shapes.push(rtext);
    }
  } catch (err) {
    console.log("text woes?");
  }

  try {
    const polygons = plot.getElementsByTagName("polygon");
    for (let ipoly = 0; ipoly < polygons.length; ipoly++) {
      const dataPoints = polygons[ipoly].childNodes[0].nodeValue
        .trim()
        .split(/\s+/);
      const p = [];
      for (let ip = 0; ip < dataPoints.length / 2; ip++) {
        p.push([dataPoints[2 * ip], dataPoints[2 * ip + 1]]);
      }
      let alpha;
      if (!polygons[ipoly].getAttribute("alpha")) {
        alpha = 0.5;
      } else {
        alpha = parseFloat(polygons[ipoly].getAttribute("alpha"));
      }
      let linecolour;
      if (!polygons[ipoly].getAttribute("linecolour")) {
        linecolour = "#000000";
      } else {
        linecolour = polygons[ipoly].getAttribute("linecolour");
      }
      let fillcolour;
      if (!polygons[ipoly].getAttribute("fillcolour")) {
        fillcolour = "#000000";
      } else {
        fillcolour = polygons[ipoly].getAttribute("fillcolour");
      }
      let linestyle;
      if (!polygons[ipoly].getAttribute("linestyle")) {
        linestyle = null;
      } else {
        linestyle = polygons[ipoly].getAttribute("linestyle");
        if (linestyle == "dashdot" || linestyle == "-.") {
          linestyle = [3, 2, 8, 2];
        } else if (linestyle == "dash" || linestyle == "--") {
          linestyle = [8, 8];
        } else if (linestyle == "dot" || linestyle == ":") {
          linestyle = [4, 4];
        } else {
          linestyle = null;
        }
      }
      let linesize;
      if (!polygons[ipoly].getAttribute("linesize")) {
        linesize = 1;
      } else {
        linesize = parseInt(polygons[ipoly].getAttribute("linesize"));
      }
      fillcolour = graphObject.parseColourToRGBA(fillcolour, alpha);
      linecolour = graphObject.parseColourToRGBA(linecolour, 1.0);
      const polygon = {
        polygon: {
          data: p,
          linesize: linesize,
          linecolour: linecolour,
          fillcolour: fillcolour,
          linestyle: linestyle,
        },
      };
      shapes.push(polygon);
    }
  } catch (err) {
    console.log("polygon woes?");
  }

  try {
    const circles = plot.getElementsByTagName("circle");
    for (let icirc = 0; icirc < circles.length; icirc++) {
      let alpha;
      if (!circles[icirc].getAttribute("alpha")) {
        alpha = 0.5;
      } else {
        alpha = parseFloat(circles[icirc].getAttribute("alpha"));
      }
      const xpos = parseFloat(circles[icirc].getAttribute("xpos"));
      const ypos = parseFloat(circles[icirc].getAttribute("ypos"));
      const radius = parseFloat(circles[icirc].getAttribute("radius"));
      let linecolour;
      if (!circles[icirc].getAttribute("linecolour")) {
        linecolour = "#000000";
      } else {
        linecolour = circles[icirc].getAttribute("linecolour");
      }
      let fillcolour;
      if (!circles[icirc].getAttribute("fillcolour")) {
        fillcolour = "#000000";
      } else {
        fillcolour = circles[icirc].getAttribute("fillcolour");
      }
      let linestyle;
      if (!circles[icirc].getAttribute("linestyle")) {
        linestyle = null;
      } else {
        linestyle = circles[icirc].getAttribute("linestyle");
        if (linestyle == "dashdot" || linestyle == "-.") {
          linestyle = [3, 2, 8, 2];
        } else if (linestyle == "dash" || linestyle == "--") {
          linestyle = [8, 8];
        } else if (linestyle == "dot" || linestyle == ":") {
          linestyle = [4, 4];
        } else {
          linestyle = null;
        }
      }
      let linesize;
      if (!circles[icirc].getAttribute("linesize")) {
        linesize = 1;
      } else {
        linesize = parseInt(circles[icirc].getAttribute("linesize"));
      }
      fillcolour = graphObject.parseColourToRGBA(fillcolour, alpha);
      linecolour = graphObject.parseColourToRGBA(linecolour, 1.0);
      const circle = {
        circle: {
          x: xpos,
          y: ypos,
          radius: radius,
          linesize: linesize,
          linecolour: linecolour,
          fillcolour: fillcolour,
          linestyle: linestyle,
        },
      };
      shapes.push(circle);
    }
  } catch (err) {}
  return shapes;
};

CCP4GraphPlot.prototype.getPlotTitles = function (
  plot,
  plot_title,
  plot_description,
  headers,
  data,
  dataColRow,
  d
) {
  let titles = {};
  let xaxislabel = null;
  let options = this.getPlotOptions(plot);
  try {
    xaxislabel = plot
      .getElementsByTagName("xlabel")[0]
      .childNodes[0].nodeValue.replace("<", "&lt;")
      .replace(">", "&gt;");
  } catch (err) {}

  let showlegend = null;
  try {
    showlegend =
      plot.getElementsByTagName("showlegend")[0].childNodes[0].nodeValue;
    if (showlegend === "0" || showlegend === "false") {
      options["showlegend"] = false;
    } else {
      options["showlegend"] = true;
    }
  } catch (err) {
    options["showlegend"] = true;
  }

  let fixaspectratio = null;
  try {
    fixaspectratio =
      plot.getElementsByTagName("fixaspectratio")[0].childNodes[0].nodeValue;
    if (fixaspectratio === "1" || fixaspectratio === "true") {
      options["fixaspectratio"] = true;
    } else {
      options["fixaspectratio"] = false;
    }
  } catch (err) {
    options["fixaspectratio"] = false;
  }

  let xintegral = null;
  try {
    xintegral =
      plot.getElementsByTagName("xintegral")[0].childNodes[0].nodeValue;
    if (xintegral === "1" || xintegral === "true") {
      options["xintegral"] = true;
    } else {
      options["xintegral"] = false;
    }
  } catch (err) {
    options["xintegral"] = false;
  }

  let yintegral = null;
  try {
    yintegral =
      plot.getElementsByTagName("yintegral")[0].childNodes[0].nodeValue;
    if (yintegral === "1" || yintegral === "true") {
      options["yintegral"] = true;
    } else {
      options["yintegral"] = false;
    }
  } catch (err) {
    options["yintegral"] = false;
  }

  const hists = plot.getElementsByTagName("histogram");
  for (let ihist = 0; ihist < hists.length; ihist++) {
    const hist = hists[ihist];
    const col = parseInt(hist.getAttribute("col")) - 1;
    let label;
    try {
      label = plotline.getElementsByTagName("label")[0].childNodes[0].nodeValue;
    } catch (err) {
      label = headers[col];
    }
    options["yintegral"] = true;
    let nbins;
    try {
      nbins = parseInt(
        hist.getElementsByTagName("nbins")[0].childNodes[0].nodeValue
      );
    } catch (err) {
      nbins = parseInt(Math.sqrt(data.length)) + 1;
    }

    let maxVal = Number.MIN_VALUE;
    let minVal = Number.MAX_VALUE;
    for (let idatarow = 0; idatarow < data.length; idatarow++) {
      if (dataColRow[col][idatarow] > maxVal) {
        maxVal = dataColRow[col][idatarow];
      }
      if (dataColRow[col][idatarow] < minVal) {
        minVal = dataColRow[col][idatarow];
      }
    }
    const binSize = (maxVal - minVal) / nbins;

    const d1 = [];

    const histData = {};
    for (let ibin = 0; ibin < nbins; ibin++) {
      const binBot = minVal + binSize * ibin;
      const binMid = minVal + binSize * (ibin + 0.5);
      const binTop = minVal + binSize * (ibin + 1);
      histData[binMid] = 0;
      for (let idatarow = 0; idatarow < data.length; idatarow++) {
        if (
          (ibin == 0 &&
            dataColRow[col][idatarow] >= binBot &&
            dataColRow[col][idatarow] <= binTop) ||
          (ibin > 0 &&
            dataColRow[col][idatarow] > binBot &&
            dataColRow[col][idatarow] <= binTop)
        ) {
          histData[binMid]++;
        }
      }
    }
    for (const key in histData) {
      if (histData.hasOwnProperty(key)) {
        d1.push([key, histData[key]]);
      }
    }
    const theData = { data: d1, label: label };
    try {
      let colour =
        hist.getElementsByTagName("colour")[0].childNodes[0].nodeValue;
      if (colour == "r") colour = "red";
      if (colour == "g") colour = "green";
      if (colour == "b") colour = "blue";
      if (colour == "y") colour = "yellow";
      if (colour == "m") colour = "magenta";
      if (colour == "c") colour = "cyan";
      if (colour == "w") colour = "white";
      if (colour == "b") colour = "black";
      theData["color"] = colour;
    } catch (err) {}
    theData["bars"] = {
      show: true,
      barWidth: binSize * 0.8,
      align: "center",
    };
    d.push(theData);
  }

  const barcharts = plot.getElementsByTagName("barchart");
  let barWidth = 5;
  for (let ihist = 0; ihist < barcharts.length; ihist++) {
    const hist = barcharts[ihist];
    const col = parseInt(hist.getAttribute("col")) - 1;
    let tcol = null;
    let haveTCol = false;
    if (hist.getAttribute("tcol") && hist.getAttribute("tcol").length > 0) {
      haveTCol = true;
      tcol = parseInt(hist.getAttribute("tcol")) - 1;
    }
    let barplacement;
    try {
      barplacement =
        plot.getElementsByTagName("barplacement")[0].childNodes[0].nodeValue;
    } catch (err) {
      barplacement = null;
    }
    let label;
    try {
      label = plot.getElementsByTagName("label")[0].childNodes[0].nodeValue;
    } catch (err) {
      if (haveTCol) {
        label = headers[tcol];
      } else {
        label = headers[col];
      }
    }
    options["yintegral"] = true;

    const d1 = [];
    const histData = {};
    for (let idatarow = 0; idatarow < data.length; idatarow++) {
      if (dataColRow[col][idatarow] in histData) {
        if (haveTCol) {
          histData[dataColRow[col][idatarow]] += parseFloat(
            dataColRow[tcol][idatarow]
          );
        } else {
          histData[dataColRow[col][idatarow]]++;
        }
      } else {
        if (haveTCol) {
          histData[dataColRow[col][idatarow]] = parseFloat(
            dataColRow[tcol][idatarow]
          );
        } else {
          histData[dataColRow[col][idatarow]] = 1;
        }
      }
    }
    for (const key in histData) {
      if (histData.hasOwnProperty(key)) {
        d1.push([parseFloat(key), histData[key]]);
      }
    }
    d1.sort((a, b) => a[0] - b[0]);

    const theData = { data: d1, label: label };
    try {
      let colour =
        hist.getElementsByTagName("colour")[0].childNodes[0].nodeValue;
      if (colour == "r") colour = "red";
      if (colour == "g") colour = "green";
      if (colour == "b") colour = "blue";
      if (colour == "y") colour = "yellow";
      if (colour == "m") colour = "magenta";
      if (colour == "c") colour = "cyan";
      if (colour == "w") colour = "white";
      if (colour == "b") colour = "black";
      theData["color"] = colour;
    } catch (err) {}
    try {
      if (hist.getElementsByTagName("width").length > 0) {
        barWidth = parseInt(
          hist.getElementsByTagName("width")[0].childNodes[0].nodeValue
        );
      }
    } catch (err) {}
    theData["bars"] = { show: true, barWidth: barWidth, align: "center" };
    if (barplacement === "stacked") {
      theData["series"] = {
        stack: true,
        bars: {
          show: true,
          align: "center",
        },
      };
    } else if (barplacement === "sidebyside") {
      theData["bars"] = { show: true, order: ihist, align: "center" };
    }
    d.push(theData);
  }

  let yscale = null;
  try {
    yscale = plot.getElementsByTagName("yscale")[0].childNodes[0].nodeValue;
    if (yscale === "log") {
      options["yscale"] = yscale;
    }
  } catch (err) {}

  let xscale = null;
  try {
    xscale = plot.getElementsByTagName("xscale")[0].childNodes[0].nodeValue;
    if (xscale === "oneoversqrt" || xscale === "log") {
      options["xscale"] = xscale;
    }
  } catch (err) {}

  let yaxislabel = null;
  let ryaxislabel = null;
  const ylabels = plot.getElementsByTagName("ylabel");
  for (let iylab = 0; iylab < ylabels.length; iylab++) {
    try {
      const ylab = ylabels[iylab];
      const labrightaxis = ylab.getAttribute("rightaxis");
      if (!labrightaxis || labrightaxis == "false" || labrightaxis == 0) {
        yaxislabel = ylab.childNodes[0].nodeValue
          .replace("<", "&lt;")
          .replace(">", "&gt;");
      } else {
        ryaxislabel = ylab.childNodes[0].nodeValue
          .replace("<", "&lt;")
          .replace(">", "&gt;");
      }
    } catch (err) {}
  }

  titles = {
    title: plot_title,
    xlabel: xaxislabel,
    ylabel: yaxislabel,
    rylabel: ryaxislabel,
    description: plot_description,
  };
  return titles;
};

CCP4GraphPlot.prototype.getPlotBackground = function (plot) {
  let background = null;
  try {
    background =
      plot.getElementsByTagName("background")[0].childNodes[0].nodeValue;
  } catch (err) {}
  return background;
};

CCP4GraphPlot.prototype.getCustomXTicks = function (plot, d) {
  let customXTicks = null;
  try {
    const customTicksText =
      plot.getElementsByTagName("customXTicks")[0].childNodes[0].nodeValue;

    if (customTicksText === "oneperdatapoint") {
      if (d.length > 0 && "data" in d[0]) {
        customXTicks = [];
        for (let idp = 0; idp < d[0]["data"].length; idp++) {
          customXTicks.push(d[0]["data"][idp][0]);
        }
      }
    } else if (customTicksText.split(",").length > 0) {
      const splitTicks = customTicksText.split(",");
      customXTicks = [];
      if (customXLabels && customXLabels.length === splitTicks.length) {
        for (let iTick = 0; iTick < splitTicks.length; iTick++) {
          customXTicks.push([
            parseFloat(splitTicks[iTick]),
            customXLabels[iTick],
          ]);
        }
      } else {
        for (let iTick = 0; iTick < splitTicks.length; iTick++) {
          customXTicks.push(parseFloat(splitTicks[iTick]));
        }
      }
    }
  } catch (err) {}
  return customXTicks;
};

CCP4GraphPlot.prototype.getCustomYTicks = function (plot, d) {
  let customYTicks = null;
  try {
    const customTicksText =
      plot.getElementsByTagName("customYTicks")[0].childNodes[0].nodeValue;

    if (customTicksText === "oneperdatapoint") {
      if (d.length > 0 && "data" in d[0]) {
        customYTicks = [];
        for (let idp = 0; idp < d[0]["data"].length; idp++) {
          customYTicks.push(d[0]["data"][idp][0]);
        }
      }
    } else if (customTicksText.split(",").length > 0) {
      const splitTicks = customTicksText.split(",");
      customYTicks = [];
      if (customYLabels && customYLabels.length === splitTicks.length) {
        for (let iTick = 0; iTick < splitTicks.length; iTick++) {
          customYTicks.push([
            parseFloat(splitTicks[iTick]),
            customYLabels[iTick],
          ]);
        }
      } else {
        for (let iTick = 0; iTick < splitTicks.length; iTick++) {
          customYTicks.push(parseFloat(splitTicks[iTick]));
        }
      }
    }
  } catch (err) {}
  return customYTicks;
};

CCP4GraphPlot.prototype.createPlotDiv = function (
  graphName,
  graphDivName,
  pimpleplot
) {
  const thisPlotDiv = $("<div>")
    .attr("id", graphName)
    .css({
      width: $(`#${graphDivName}`).css("width"),
      height: $(`#${graphDivName}`).css("height"),
      display: "none",
    });
  pimpleplot.append(thisPlotDiv);
  return thisPlotDiv;
};

CCP4GraphPlot.prototype.createSelectItem = function (
  plot_title,
  graphName,
  selectGroup,
  iplot,
  plotsLength,
  itab,
  tablesLength
) {
  const selectItem = $("<option>")
    .html(plot_title.replace("<", "&lt;").replace(">", "&gt;"))
    .attr("value", `${graphName}`)
    .attr("id", `${graphName}_selectitem`);
  if (iplot == plotsLength - 1 && itab == tablesLength - 1) {
    selectItem.attr("selected", "true");
  }
  selectGroup.append(selectItem);
  return selectItem;
};

CCP4GraphPlot.prototype.addPlotEventListeners = function (
  thisPlotDiv,
  graphObject,
  graphName,
  plot_title
) {
  thisPlotDiv.on("plotHover", function (e) {
    const pimpleMain = $(`#${this.graphDivName_in}`);
    if (pimpleMain.toArray().length > 0) {
      pimpleMain[0].hoverevt = $.Event("graphHover", {
        x: e.detail.x,
        y: e.detail.y,
        plot: this.iplot,
        table: this.itab,
      });
      pimpleMain.trigger(pimpleMain[0].hoverevt);
    }
  });

  thisPlotDiv.on("plotClick", function (e) {
    const pimpleMain = $(`#${this.graphDivName_in}`);
    pimpleMain[0].clickevt = $.Event("graphClick", {
      x: e.detail.x,
      y: e.detail.y,
      plot: this.iplot,
      table: this.itab,
    });
    pimpleMain.trigger(pimpleMain[0].clickevt);
  });

  const self = this;

  thisPlotDiv.hover(function () {
    if (self.dataInfoDiv === null) {
      self.dataInfoDiv = $("<div>").addClass("datainfo_hidden");
      $(`#${this.graphDivName_in}`).append(self.dataInfoDiv);
    }
    if (self.toolTipDiv === null) {
      self.toolTipDiv = $("<div>").addClass("tooltip_hidden");
      $(`#${this.graphDivName_in}`).append(self.toolTipDiv);
    }
    if (self.currentGraph.titles["description"].length > 0) {
      self.toolTipDiv.removeClass("tooltip_hidden").addClass("tooltip");
      self.toolTipDiv.html(self.currentGraph.titles["description"]);
    }
  });
};

CCP4GraphPlot.prototype.finalizeGraph = function (graphObject, thisPlotDiv) {
  const w = $(`#${graphObject.graphDivName}`).css("width");
  const h = $(`#${graphObject.graphDivName}`).css("height");

  if (graphObject.graphs.length > 0) {
    const initialVal = $(`#${graphObject.menuSelectName} option:eq(0)`).val();
    $(`#${graphObject.menuSelectName}`).val(initialVal).change();
    //initial.prop("selected", true);
    const graphName = $(`#${graphObject.menuSelectName}`).val();
    const graph = graphObject.graphs[0];
    thisPlotDiv = $(`#${graphName}`);

    $(`#${graphObject.graphDivName}`).children().hide();
    thisPlotDiv.css({ width: "100%", height: h, display: "block" }).empty();

    if (typeof thisPlotDiv !== "undefined") {
      graphObject.currentGraph = graph;
      thisPlotDiv.css({ width: w, height: h });
    }
  }
};

export default CCP4GraphPlot;
