import { useContext, useEffect, useMemo, useState } from "react";
import $ from "jquery";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";
import {
  Avatar,
  Button,
  CardHeader,
  Chip,
  Collapse,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { MyExpandMore } from "../expand-more";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useApi } from "../../api";
import { fileTypeMapping } from "../files-table";
import EditableTypography from "../editable-typography";
import { File as DjangoFile, Job } from "../../models";
import {
  ClassicJobsListPreviewDialog,
  JobMenu,
  JobMenuContext,
  JobWithChildren,
} from "../job-menu";
//import { fileTypeMapping } from "../files-table";

export const CCP4i2ReportInputOutputData: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  const [fileUUIDs, setFileUUIDs] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [previewNode, setPreviewNode] = useState<
    JobWithChildren | DjangoFile | null
  >(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuNode, setMenuNode] = useState<
    Job | JobWithChildren | DjangoFile | null
  >(null);

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
      <JobMenuContext.Provider
        value={{
          anchorEl,
          setAnchorEl,
          menuNode,
          setMenuNode,
          previewNode,
          setPreviewNode,
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            backgroundColor: "primary.main",
            color: "primary.contrastText",
          }}
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
        <ClassicJobsListPreviewDialog />
      </JobMenuContext.Provider>
    </>
  );
};

interface CCP4i2ReportFileProps extends CCP4i2ReportElementProps {
  uuid: string;
}
const CCP4i2ReportFile: React.FC<CCP4i2ReportFileProps> = (props) => {
  const api = useApi();
  const { data: file, isLoading } = api.get<DjangoFile>(
    `files/${props.uuid}/by_uuid/`
  );
  const { anchorEl, setAnchorEl, menuNode, setMenuNode } =
    useContext(JobMenuContext);

  const fileTypeIcon = useMemo(() => {
    if (!file?.type) return "ccp4";
    return Object.keys(fileTypeMapping).includes(file?.type)
      ? fileTypeMapping[file?.type]
      : "ccp4";
  }, [file]);

  if (!file || isLoading) return <LinearProgress />;
  return (
    <>
      <Stack
        direction="row"
        sx={{
          border: "3px solid",
          borderRadius: "0.5rem",
          mx: 2,
          my: 1,
          p: 1,
        }}
      >
        <Avatar
          src={`/qticons/${fileTypeIcon}.png`}
          sx={{ mr: 2, width: "2rem", height: "2rem" }}
        />
        <EditableTypography
          variant="body1"
          text={
            file?.annotation
              ? file?.annotation
              : file?.job_param_name
              ? file.job_param_name
              : ""
          }
          onDelay={(annotation) => {
            const formData = new FormData();
            formData.set("annotation", annotation);
            api.patch(`files/${file?.id}`, formData);
          }}
        />
        <Typography sx={{ flexGrow: 1 }} />
        <div>
          {file?.sub_type && (
            <Chip
              key="subType"
              avatar={<div style={{ width: "3rem" }}>Subtype</div>}
              label={file?.sub_type}
            />
          )}
          {file?.content && (
            <Chip
              key="content"
              avatar={<div style={{ width: "3rem" }}>Content</div>}
              label={file?.content}
            />
          )}
          <Button
            size="small"
            sx={{ p: 0, m: 0 }}
            variant="outlined"
            onClick={(ev) => {
              ev.stopPropagation();
              ev.preventDefault();
              setAnchorEl(ev.currentTarget);
              setMenuNode(file || null);
            }}
          >
            <MenuIcon fontSize="small" />
          </Button>
        </div>
      </Stack>
    </>
  );
};
