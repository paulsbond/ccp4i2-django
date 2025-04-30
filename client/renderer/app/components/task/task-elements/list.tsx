import { useCallback, useContext, useMemo, useState } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useApi } from "../../../api";
import { useJob, useProject, valueOfItem } from "../../../utils";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  FormControl,
  FormLabel,
  Grid2,
  Typography,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { MyExpandMore } from "../../expand-more";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CCP4i2Context } from "../../../app-context";
import { Project } from "../../../models";

interface CListElementProps extends CCP4i2TaskElementProps {
  initiallyOpen?: boolean;
}

export const CListElement: React.FC<CListElementProps> = (props) => {
  const { itemName, job, qualifiers } = props;
  const api = useApi();
  const { getTaskItem, setParameter } = useJob(job.id);
  const { projectId } = useContext(CCP4i2Context);
  const { project } = projectId ? useProject(projectId) : {};
  const { item } = getTaskItem(itemName);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : item._objectPath?.split(".").at(-1);
  }, [item, qualifiers]);

  const [expanded, setExpanded] = useState<boolean>(true);

  const extendListItem = useCallback(async () => {
    var taskElement = JSON.parse(JSON.stringify(item._subItem));
    console.log("taskElement", taskElement);
    taskElement._objectPath = taskElement._objectPath.replace(
      "[?]",
      "[" + item._value.length + "]"
    );
    if (typeof taskElement._value === "object") {
      for (var valueElementKey in taskElement._value) {
        var valueElement = taskElement._value[valueElementKey];
        valueElement._objectPath = valueElement._objectPath.replace(
          "[?]",
          "[" + item._value.length + "]"
        );
      }
    }
    const listValue = Array.isArray(valueOfItem(item)) ? valueOfItem(item) : [];
    let newItemValue = valueOfItem(taskElement);
    if (taskElement._baseClass === "CDataFile" && newItemValue && project) {
      newItemValue.project = project.uuid.replace(/\-/g, "");
      newItemValue.baseName = "UNDEFINED";
    } else if (taskElement._class === "CAltSpaceGroup") {
      newItemValue = "P1";
    } else if (taskElement._baseClass === "CInt") {
      newItemValue = 0;
    } else if (taskElement._baseClass === "CFloat") {
      newItemValue = 0;
    } else if (taskElement._baseClass === "CString") {
      newItemValue = 0;
    }
    listValue.push(newItemValue);
    console.log({
      op: taskElement._objectPath,
      v4d: listValue,
    });
    const setParameterArg = {
      object_path: item._objectPath,
      value: listValue,
    };
    const result = await setParameter(setParameterArg);
    console.log(result);
  }, [item, project, job]);

  const deleteItem = useCallback(
    async (deletedItem: any) => {
      const array = item._value;
      const index = array.indexOf(deletedItem);
      console.log(index, deletedItem);
      if (index > -1) {
        // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
        console.log(array, valueOfItem(item));
        const setParameterArg = {
          object_path: item._objectPath,
          value: valueOfItem(item),
        };
        const result = await setParameter(setParameterArg);
      }
    },
    [item]
  );

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  return (
    inferredVisibility && (
      <Card>
        <CardHeader
          title={<>{guiLabel}</>}
          action={
            <>
              <MyExpandMore
                sx={{ color: "primary.contrastText" }}
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
              <Button disabled={!(job.status == 1)} onClick={extendListItem}>
                <Add sx={{ color: "primary.contrastText" }} />
              </Button>
            </>
          }
        />
        <CardContent>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {item?._value &&
              (item._value?.length == 0 ? (
                <Typography variant="caption">No elements</Typography>
              ) : (
                item._value.map((content: any) => {
                  return (
                    <Grid2 key={content._objectPath} container>
                      <Grid2 key="Element" size={{ xs: 11 }}>
                        <CCP4i2TaskElement
                          {...props}
                          itemName={content._objectPath}
                        />
                      </Grid2>
                      <Grid2 key="deleteButton" size={{ xs: 1 }}>
                        <FormControl>
                          <FormLabel>Delete</FormLabel>
                          <Button
                            disabled={!(job.status === 1)}
                            id="deleteButton"
                            onClick={() => {
                              deleteItem(content);
                            }}
                          >
                            {" "}
                            <Delete />
                          </Button>
                        </FormControl>
                      </Grid2>
                    </Grid2>
                  );
                })
              ))}
          </Collapse>
        </CardContent>
      </Card>
    )
  );
};
