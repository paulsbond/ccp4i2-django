import React, { Fragment, useState, useEffect, useMemo } from "react";
import $ from "jquery";
import CCP4i2ReportFlotWidget from "./CCP4i2ReportFlotWidget";
import {
  CardHeader,
  Grid,
  Select,
  Collapse,
  Toolbar,
  Typography,
  MenuItem,
  Paper,
  Autocomplete,
  TextField,
  Grid2,
  styled,
} from "@mui/material";
import { GeneralTable } from "../General/GeneralTable";
import { MyExpandMore } from "../expand-more";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
window.jQuery = window.$ = $;

const MyToolbar = styled(({ theme }) => ({
  backgroundColor: theme.components.MuiToolBar.backgroundColor,
  color: theme.color,
}));

export function handleItem(iItem, item, job) {
  if (["CCP4i2ReportFold"].includes($(item).get(0).tagName)) {
    var theElement = <CCP4i2ReportFold key={iItem} item={item} job={job} />;
    //console.log('handling', iItem, item, $(item).data('element'), theElement.key)
    return theElement;
  } else if (["CCP4i2ReportPre"].includes($(item).get(0).tagName)) {
    return <CCP4i2ReportPre key={iItem} item={item} job={job} />;
  } else if (["CCP4i2ReportFlotGraph"].includes($(item).get(0).tagName)) {
    return (
      <CCP4i2ReportFlotWidget
        key={iItem}
        item={item}
        uniqueId={$(item).attr("key")}
        job={job}
      />
    );
  } else if (
    ["CCP4i2ReportFlotGraphGroup", "CCP4i2ReportObjectGallery"].includes(
      $(item).get(0).tagName
    )
  ) {
    return (
      <CCP4i2ReportFlotGraphGroupWidget
        key={iItem}
        item={item}
        uniqueId={$(item).attr("key")}
        job={job}
      />
    );
  } else if (
    [
      "CCP4i2ReportDiv",
      "div",
      "CCP4i2ReportResults",
      "CCP4i2ReportReferenceGroup",
    ].includes($(item).get(0).tagName)
  ) {
    return <CCP4i2ReportDiv key={iItem} item={item} job={job} />;
  } else if (["CCP4i2ReportGeneric"].includes($(item).get(0).tagName)) {
    return <CCP4i2ReportGeneric key={iItem} item={item} job={job} />;
  } else if (["CCP4i2ReportTitle"].includes($(item).get(0).tagName)) {
    return <CCP4i2ReportTitle key={iItem} item={item} job={job} />;
  } else if (["CCP4i2ReportText"].includes($(item).get(0).tagName)) {
    return <CCP4i2ReportText key={iItem} item={item} job={job} />;
  } else if (["CCP4i2ReportTable"].includes($(item).get(0).tagName)) {
    return <CCP4i2ReportTable key={iItem} item={item} job={job} />;
  } else if (["CCP4i2ReportReference"].includes($(item).get(0).tagName)) {
    return <CCP4i2ReportReference key={iItem} item={item} job={job} />;
  }
  //console.log('not handling', item, $(item).data('element'))
  return null;
}

export const CCP4i2ReportFlotGraphGroupWidget = (props) => {
  const [shown, setShown] = useState(0);

  const xmlGraphs = useMemo(() => {
    if (props.item && props.job) {
      const childGraphs = $(props.item).children().toArray();
      return childGraphs;
    }
    return [];
  }, [props.item, props.job]);

  const graphTitles = useMemo(() => {
    const graphTitles = [];
    xmlGraphs.forEach((childGraph, iGraph) => {
      const ccp4DataTitleNode = $(childGraph).find("ns0\\:ccp4_data")[0];
      let ccp4DataTitle = `Graph ${iGraph}`;
      try {
        ccp4DataTitle = $(ccp4DataTitleNode).attr("title");
      } catch (e) {
        console.log(e);
      }
      graphTitles.push(ccp4DataTitle);
    });
    return graphTitles;
  }, [xmlGraphs]);

  const graphs = useMemo(() => {
    if (xmlGraphs && props.job) {
      const result = xmlGraphs.map((child, iChild) =>
        handleItem(iChild, child, props.job)
      );
      return result;
    }
    return [];
  }, [xmlGraphs, props.job]);

  return (
    graphs.length > 0 &&
    xmlGraphs.length > 0 &&
    graphTitles.length > 0 && (
      <div style={{ height: "450px" }}>
        {$(props.item).attr("title")}
        {graphs && graphs.length > 1 && (
          <Autocomplete
            defaultValue={
              graphTitles && graphTitles.length > 0 ? graphTitles[0] : "0"
            }
            options={graphs.map((item, iItem) => {
              return {
                label: graphTitles[iItem],
                id: iItem,
              };
            })}
            onChange={(ev, newValue) => {
              console.log(ev, newValue);
              setShown(newValue.id);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  $(props.item).attr("title") !== 0
                    ? $(props.item).attr("title")
                    : `Group of ${graphs ? graphs.length : "0"} graphs`
                }
              />
            )}
          />
        )}
        {graphs &&
          graphs.length > 0 &&
          graphs.map((child, iChild) => (iChild == shown ? child : null))}
      </div>
    )
  );
};

export const CCP4i2ReportFold = (props) => {
  const [foldContent, setFoldContent] = useState([]);
  const [expanded, setExpanded] = useState(
    $(props.item).attr("initiallyOpen") === "True"
  );

  useEffect(() => {
    try {
      let newContent = $(props.item)
        .children()
        .map((iChild, child) => handleItem(iChild, child, props.job));
      setFoldContent(newContent);
    } catch (err) {
      console.log(err);
    }
  }, [props.item]);

  return (
    <>
      <Toolbar
        variant="dense"
        key={$(props.item).attr("key")}
        onClick={(ev) => {
          ev.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        <MyExpandMore
          expand={expanded}
          onClick={(ev) => {
            ev.stopPropagation();
            setExpanded(!expanded);
          }}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </MyExpandMore>
        {$(props.item).attr("label")}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1 }}
        ></Typography>
      </Toolbar>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {foldContent}
      </Collapse>
    </>
  );
};

export const CCP4i2ReportDiv = (props) => {
  const [isRow, setIsRow] = useState(false);

  useEffect(() => {
    if (props.item) {
      let isRow = false;
      for (var child of $(props.item).children()) {
        try {
          var childCssDict = cssToDict($(child).attr("style"));
          if (Object.keys(childCssDict).includes("float")) {
            isRow = true;
            break;
          }
        } catch (err) {}
      }
      setIsRow(isRow);
    }
  }, [props.item]);

  return isRow ? (
    <Grid2 container>
      {$(props.item)
        .children()
        .map((iChild, child) => (
          <Grid2 key={iChild}>{handleItem(iChild, child, props.job)}</Grid2>
        ))}
    </Grid2>
  ) : (
    <Fragment>
      {$(props.item)
        .children()
        .map((iChild, child) => (
          <div key={iChild} className="CCP4i2ReportDiv">
            {handleItem(iChild, child, props.job)}
          </div>
        ))}
    </Fragment>
  );
};

export const CCP4i2RVAPIRow = (props) => {
  const [content, setContent] = useState([]);

  useEffect(() => {
    let newContent = $(props.item)
      .find("td")
      .map((iCol, col) => {
        if ($(col).find("div[data-renderer]").length > 0) {
          return (
            <Grid item key={iCol}>
              <CCP4i2ReportFlotWidget
                item={$(col)}
                uniqueId={$(col).find("div[data-renderer]").data("data")}
              />
            </Grid>
          );
        } else {
          return (
            <Grid
              item
              key={iCol}
              dangerouslySetInnerHTML={{ __html: col.innerHTML }}
            />
          );
        }
      });
    setContent(newContent);
  }, [props.job, props.item]);

  return <Grid container>{content}</Grid>;
};

export const CCP4i2RVAPITable = (props) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(props.item.find("tr"));
  }, [props.item, props.job]);

  return (
    <div>
      {rows.map((iRow, row) => (
        <CCP4i2RVAPIRow key={iRow} item={row} job={props.job} />
      ))}
    </div>
  );
};

export const CCP4i2RVAPITable1 = (props) => {
  const rows = useMemo(() => {
    return props.item.find("tr");
  }, [props.item]);

  return (
    <div>
      {rows.map((iRow, row) => (
        <CCP4i2RVAPIRow key={iRow} item={row} job={props.job} />
      ))}
    </div>
  );
};

CCP4i2RVAPITable1.defaultProps = {
  item: $("<div></div>"),
};

export const CCP4i2ReportGeneric = (props) => {
  const [isRVAPITable, setIsRVAPITable] = useState(false);

  useEffect(() => {
    setIsRVAPITable($(props.item).children("table.rvapi-page").length > 0);
  }, [props.item, props.job]);

  return isRVAPITable ? (
    <CCP4i2RVAPITable item={$(props.item).find("tbody")} job={props.job} />
  ) : (
    <div dangerouslySetInnerHTML={{ __html: props.item.innerHTML }} />
  );
};

export const CCP4i2DiagnosticXml = ({ xmlText }) => {
  const [diagnosticXml, setDiagnosticXml] = useState($.parseXML(xmlText));
  const [diagnosticXmlText, setDiagnosticXmlText] = useState(xmlText);
  useEffect(() => {
    //console.log('xmlText is', xmlText)
    //console.log('diagnosticXmlText is', diagnosticXmlText)
    if (xmlText !== diagnosticXmlText) {
      setDiagnosticXmlText(xmlText);
      setDiagnosticXml($.parseXML(xmlText));
      return;
    }
  });
  return (
    <Collapse>
      {$(diagnosticXml)
        .find("ccp4i2_body")
        .find("errorReport")
        .map((iChild, child) => {
          //console.log(child)
          return (
            <Paper
              key={iChild}
              className={`error_severity_${$(child).find("severity").text()}`}
              header={$(child).find("description").text()}
            >
              <pre>{$(child).find("details").text()}</pre>
            </Paper>
          );
        })}
    </Collapse>
  );
};

export const CCP4i2ReportTable = (props) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    let newData = [];
    let newColumns = [];

    $(props.item)
      .find("tr")
      .each((iRow, tableRow) => {
        var dataItem = { key: iRow };
        if ($(props.item).attr("transpose") === "True") {
          $(tableRow)
            .find("th")
            .each((iColumn, tableData) => {
              dataItem["col_" + iColumn] = $(tableData).text();
            });
        }
        const thCount = Object.keys(dataItem).length;
        $(tableRow)
          .find("td")
          .each((iColumn, tableData) => {
            dataItem["col_" + (thCount + iColumn - 1)] = $(tableData).text();
          });
        if ($(tableRow).find("td").length > 0) {
          newData.push(dataItem);
        }
        if ($(props.item).attr("transpose") === "False") {
          $(tableRow)
            .find("th")
            .each((iColumn, tableData) => {
              while (iColumn >= newColumns.length) {
                newColumns.push({});
              }
              newColumns[iColumn] = {
                title: (
                  <div
                    dangerouslySetInnerHTML={{ __html: tableData.innerHTML }}
                  />
                ),
                dataIndex: "col_" + iColumn,
                key: "col_" + iColumn,
                searchable: true,
                render: (text) => (
                  <p dangerouslySetInnerHTML={{ __html: text }} />
                ),
              };
            });
        }
      });
    if (newColumns.length === 0 && newData.length > 0) {
      for (var iCol = 0; iCol < Object.keys(newData[0]).length - 1; iCol++) {
        newColumns.push({
          title: "",
          dataIndex: "col_" + iCol,
          key: "col_" + iCol,
          searchable: true,
          render: (text) => <div dangerouslySetInnerHTML={{ __html: text }} />,
        });
      }
    }
    setData(newData);
    setColumns(newColumns);
  }, [props.job, props.item]);

  return (
    <GeneralTable
      columns={columns}
      dataSource={data}
      tableRowProps={{ p: 0.5 }}
      size="small"
      pagination={false}
      sx={{ mx: 6, my: 0, py: 0 }}
    />
  );
};

export const CCP4i2ReportTitle = (props) => {
  return (
    false && (
      <CardHeader
        className="site-page-header"
        title={$(props.item).attr("title1")}
        subtitle={$(props.item).attr("title2")}
      />
    )
  );
};

export const CCP4i2ReportPre = (props) => {
  const [style, setStyle] = useState({});
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    setStyle(cssToDict($(props.item).attr("style")));
    setInnerHTML(props.item.innerHTML);
  }, [props.item, props.job]);

  return <pre style={style} dangerouslySetInnerHTML={{ __html: innerHTML }} />;
};

export const CCP4i2ReportText = (props) => {
  const [style, setStyle] = useState({});
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    setStyle(cssToDict($(props.item).attr("style")));
    setInnerHTML(props.item.innerHTML);
  }, [props.item, props.job]);

  return <span style={style} dangerouslySetInnerHTML={{ __html: innerHTML }} />;
};

export const CCP4i2ReportReference = (props) => {
  const title = useMemo(() => {
    if (!props.item) return "";
    try {
      return $(props.item).attr("articleTitle");
    } catch (err) {
      return "";
    }
  }, [props.item]);

  const source = useMemo(() => {
    if (!props.item) return "";
    try {
      return $(props.item).attr("source");
    } catch (err) {
      return "";
    }
  }, [props.item]);

  const authors = useMemo(() => {
    if (!props.item) return "";
    try {
      const authorList = $(props.item).attr("authorList");
      return authorList;
    } catch (err) {
      return "";
    }
  }, [props.item]);

  return (
    <div>
      <Typography> {title}</Typography>
      <Typography sx={{ pl: 5, fontStyle: "italic", fontWeight: "medium" }}>
        {source}
      </Typography>
      <Typography sx={{ pl: 5, fontStyle: "italic", fontWeight: "medium" }}>
        {authors}
      </Typography>
    </div>
  );
};

function cssToDict(cssText) {
  const regex = /([\w-]*)\s*:\s*([^;]*)/g;
  var match,
    properties = {};

  while ((match = regex.exec(cssText))) {
    const camelCase = match[1]
      .trim()
      .replace(/-(.)/g, (m, p) => p.toUpperCase());
    properties[camelCase] = match[2];
  }
  //console.log(cssText, properties)
  return properties;
}
