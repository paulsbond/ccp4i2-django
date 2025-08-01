import { useEffect, useMemo, useState } from "react";
import $ from "jquery";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";
import { Collapse, Toolbar, Typography } from "@mui/material";
import { MyExpandMore } from "../expand-more";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { JobMenu } from "../../providers/job-context-menu";
import { CCP4i2ReportFile } from "./CCP4i2ReportFile";
//import { fileTypeMapping } from "../files-table";

export const CCP4i2ReportInputOutputData: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  const [fileUUIDs, setFileUUIDs] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!props.item) return;
    const fileUUIDs: string[] = [];
    $(props.item)
      .find("div")
      .each((iDiv, div) => {
        const divId = $(div).attr("id");
        if (divId) {
          const matches = /input_file_(.*)/.exec(divId);
          //console.log(divId, matches);
          if (matches) {
            fileUUIDs.push(matches[1]);
          }
        }
      });
    setFileUUIDs(fileUUIDs);
  }, [props.item]);

  const title = useMemo<string>(() => {
    const h5Nodes = $(props.item).find("h5");
    const h5s = h5Nodes
      .map((iItem, item) => {
        return $(item).text();
      })
      .toArray();
    return h5s.length > 0 ? h5s.join(", ") : "Input or Output data";
  }, [props.item]);

  return (
    <>
      <Toolbar
        variant="lightGrey"
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
        {title}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1 }}
        ></Typography>
      </Toolbar>
      <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ p: 2 }}>
        {fileUUIDs.map((fileUUID: string, iFile: Number) => (
          <CCP4i2ReportFile {...props} uuid={fileUUID} key={`${iFile}`} />
        ))}
      </Collapse>
      <JobMenu />
    </>
  );
};
