import React, {
  Fragment,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import $ from "jquery";
import { Job } from "../../models";
import {
  Collapse,
  Grid2,
  Grid,
  Toolbar,
  Typography,
  CardHeader,
} from "@mui/material";
import { MyExpandMore } from "../expand-more";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CCP4i2ReportFlotWidget from "./CCP4i2ReportFlotWidget";
import { CCP4i2ReportFlotGraphGroupWidget } from "./CCP4i2ReportFlotGraphGroupWidget";
import { CCP4i2ReportTable } from "./CCP4i2ReportTable";
import { CCP4i2ReportInputOutputData } from "./CCP4i2ReportInputOutputData";

export interface CCP4i2ReportElementProps extends PropsWithChildren {
  iItem: Number;
  item: HTMLElement | HTMLTableSectionElement;
  job: Job;
}

export const CCP4i2ReportFold: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [foldContent, setFoldContent] = useState<React.ReactNode[]>([]);
  const [nFloatingChildren, setNFloatingChildren] = useState(1);
  const [expanded, setExpanded] = useState(
    $(props.item).attr("initiallyOpen") === "True"
  );

  useEffect(() => {
    if (props.item) {
      let nFloatingChildren = 0;
      for (var child of $(props.item).children()) {
        try {
          if ($(child).attr("style") === undefined) {
            continue;
          }
          const styleString: string = $(child).attr("style") as string;
          var childCssDict = cssToDict(styleString);
          if (Object.keys(childCssDict).includes("float")) {
            const oldStyle = styleString;
            const fixedStyle = oldStyle
              .replace("float:left;", "")
              .replace("float:right;", "");
            console.log({ oldStyle, fixedStyle });
            $(child).attr("style", fixedStyle);
            nFloatingChildren += 1;
          }
        } catch (err) {}
      }
      setNFloatingChildren(nFloatingChildren);
    }
  }, [props.item]);

  useEffect(() => {
    try {
      let newContent: React.ReactNode[] = $(props.item)
        .children()
        .toArray()
        .map((child, iChild) => (
          <CCP4i2ReportElement iItem={iChild} item={child} job={props.job} />
        ));
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
        {nFloatingChildren > 0 ? (
          <Grid2 container>
            {foldContent.map((iItem, item) => (
              <Grid2 size={{ xs: 12 / nFloatingChildren }}>{item}</Grid2>
            ))}
          </Grid2>
        ) : (
          foldContent
        )}
      </Collapse>
    </>
  );
};

function cssToDict(cssText: string) {
  const regex = /([\w-]*)\s*:\s*([^;]*)/g;
  var match,
    properties: any = {};

  while ((match = regex.exec(cssText))) {
    const camelCase = match[1]
      .trim()
      .replace(/-(.)/g, (m, p) => p.toUpperCase());
    properties[camelCase] = match[2];
  }
  //console.log(cssText, properties)
  return properties;
}

export const CCP4i2ReportDiv: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [nFloatingChildren, setNFloatingChildren] = useState(1);

  useEffect(() => {
    if (props.item) {
      let nFloatingChildren = 0;
      for (var child of $(props.item).children()) {
        try {
          const attrValue = $(child).attr("style");
          if (attrValue === undefined) {
            continue;
          }
          var childCssDict = cssToDict(attrValue);
          if (Object.keys(childCssDict).includes("float")) {
            const oldStyle = attrValue;
            const fixedStyle = oldStyle
              .replace("float:left;", "")
              .replace("float:right;", "");
            console.log({ oldStyle, fixedStyle });
            $(child).attr("style", fixedStyle);
            nFloatingChildren += 1;
          }
        } catch (err) {}
      }
      setNFloatingChildren(nFloatingChildren);
    }
  }, [props.item]);

  return nFloatingChildren > 0 ? (
    <Grid2 container>
      {$(props.item)
        .children()
        .map((iChild, child) => (
          <Grid2 key={iChild} size={{ xs: 12 / nFloatingChildren }}>
            <CCP4i2ReportElement iItem={iChild} item={child} job={props.job} />
          </Grid2>
        ))}
    </Grid2>
  ) : (
    <Fragment>
      {$(props.item)
        .children()
        .map((iChild, child) => (
          <div key={iChild} className="CCP4i2ReportDiv">
            <CCP4i2ReportElement iItem={iChild} item={child} job={props.job} />
          </div>
        ))}
    </Fragment>
  );
};

export const CCP4i2ReportPre: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [style, setStyle] = useState({});
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    const style = $(props.item).attr("style");
    if (style) {
      setStyle(cssToDict(style));
    }
    setInnerHTML(props.item.innerHTML);
  }, [props.item, props.job]);

  return <pre style={style} dangerouslySetInnerHTML={{ __html: innerHTML }} />;
};

export const CCP4i2RVAPIRow: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [content, setContent] = useState<
    JQuery<React.JSX.Element> | undefined
  >();

  useEffect(() => {
    let newContent = $(props.item)
      .find("td")
      .map((iCol, col) => {
        if ($(col).find("div[data-renderer]").length > 0) {
          return (
            <Grid item key={iCol}>
              <CCP4i2ReportFlotWidget
                //Might the following line be because col is found bysearching from dt element
                //@ts-ignore
                item={$(col)}
                iItem={iCol}
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

export const CCP4i2RVAPITable: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [rows, setRows] = useState<JQuery<HTMLTableRowElement>>();

  useEffect(() => {
    setRows($(props.item).find("tr"));
  }, [props.item, props.job]);

  return (
    <div>
      {rows &&
        rows.map((iRow: number, row) => (
          <CCP4i2RVAPIRow
            key={`${iRow}`}
            iItem={iRow}
            item={row}
            job={props.job}
          />
        ))}
    </div>
  );
};

export const CCP4i2ReportGeneric: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  const [isRVAPITable, setIsRVAPITable] = useState(false);

  useEffect(() => {
    setIsRVAPITable($(props.item).children("table.rvapi-page").length > 0);
  }, [props.item, props.job]);

  const tableBody = useMemo(() => {
    const tableBody = $(props.item).find("tbody").get(0);
    return tableBody;
  }, [props.item]);

  return isRVAPITable && tableBody ? (
    <CCP4i2RVAPITable iItem={props.iItem} item={tableBody} job={props.job} />
  ) : (
    <div dangerouslySetInnerHTML={{ __html: props.item.innerHTML }} />
  );
};

export const CCP4i2ReportTitle: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  return (
    false && (
      <CardHeader
        title={$(props.item).attr("title1")}
        subtitle={$(props.item).attr("title2")}
      />
    )
  );
};

export const CCP4i2ReportText: React.FC<CCP4i2ReportElementProps> = (props) => {
  const [style, setStyle] = useState<any>({});
  const [innerHTML, setInnerHTML] = useState("");

  useEffect(() => {
    const possibleStyle = $(props.item).attr("style");
    if (possibleStyle) {
      setStyle(cssToDict(possibleStyle));
    }
    setInnerHTML(props.item.innerHTML);
  }, [props.item, props.job]);

  return <span style={style} dangerouslySetInnerHTML={{ __html: innerHTML }} />;
};

export const CCP4i2ReportReference: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
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

export const CCP4i2ReportElement: React.FC<CCP4i2ReportElementProps> = ({
  iItem,
  item,
  job,
}) => {
  const returnElement = useMemo<React.ReactNode>(() => {
    const htmlElement = $(item).get(0);
    const tagName = htmlElement?.tagName;
    if (tagName) {
      if (["CCP4i2ReportFold"].includes(tagName)) {
        return (
          <CCP4i2ReportFold
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (
        [
          "CCP4i2ReportDiv",
          "div",
          "CCP4i2ReportResults",
          "CCP4i2ReportReferenceGroup",
        ].includes(tagName)
      ) {
        return (
          <CCP4i2ReportDiv
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportPre"].includes(tagName)) {
        return (
          <CCP4i2ReportPre
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportFlotGraph"].includes(tagName)) {
        return (
          <CCP4i2ReportFlotWidget
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            uniqueId={$(item).attr("key")}
            job={job}
          />
        );
      } else if (["CCP4i2ReportGeneric"].includes(tagName)) {
        return (
          <CCP4i2ReportGeneric
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (
        ["CCP4i2ReportFlotGraphGroup", "CCP4i2ReportObjectGallery"].includes(
          tagName
        )
      ) {
        return (
          <CCP4i2ReportFlotGraphGroupWidget
            iItem={iItem}
            key={`${iItem}`}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportTable"].includes(tagName)) {
        return (
          <CCP4i2ReportTable
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportText"].includes(tagName)) {
        return (
          <CCP4i2ReportText
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportTitle"].includes(tagName)) {
        return (
          <CCP4i2ReportTitle
            iItem={iItem}
            key={`${iItem}`}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportReference"].includes(tagName)) {
        return (
          <CCP4i2ReportReference
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportInputData"].includes(tagName)) {
        return (
          <CCP4i2ReportInputOutputData
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      } else if (["CCP4i2ReportOutputData"].includes(tagName)) {
        return (
          <CCP4i2ReportInputOutputData
            key={`${iItem}`}
            iItem={iItem}
            item={item}
            job={job}
          />
        );
      }
    }
    return <div>{$(item).get(0)?.tagName}</div>;
  }, [item, iItem, job]);
  return <>{returnElement}</>;
};
