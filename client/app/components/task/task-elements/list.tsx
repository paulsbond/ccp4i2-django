import { useCallback, useContext, useMemo, useState } from "react";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useApi } from "../../../api";
import { itemsForName, useTaskItem, valueForDispatch } from "../task-utils";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  FormControl,
  FormLabel,
  Grid2,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { MyExpandMore } from "../../expand-more";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CCP4i2Context } from "../../../app-context";
import { Job, Project } from "../../../models";

interface CListElementProps extends CCP4i2TaskElementProps {
  initiallyOpen?: boolean;
}

export const CListElement: React.FC<CListElementProps> = (props) => {
  const { itemName, job, qualifiers } = props;
  const api = useApi();
  const { projectId } = useContext(CCP4i2Context);
  const { data: project } = api.get<Project>(`projects/${projectId}`);

  const { data: container, mutate: mutateParams } = api.get<any>(
    `jobs/${job.id}/container`
  );
  const useItem = useTaskItem(container);
  const item = useItem(itemName);
  const { data: validation, mutate: mutateValidation } = api.container<any>(
    `jobs/${props.job.id}/validation`
  );

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
    const listValue = Array.isArray(valueForDispatch(item))
      ? valueForDispatch(item)
      : [];
    let newItemValue = valueForDispatch(taskElement);
    console.log({ newItemValue, project });
    if (true) {
      if (taskElement._baseClass === "CDataFile" && newItemValue && project) {
        newItemValue.project = project.uuid.replace(/\-/g, "");
        newItemValue.baseName = "UNDEFINED";
      }
      if (taskElement._class === "CAltSpaceGroup") {
        newItemValue = "P1";
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
      const result = await api.post<Job>(
        `jobs/${job.id}/set_parameter`,
        setParameterArg
      );
      console.log(result);
      await mutateParams();
      await mutateValidation();
    }
  }, [item, project, mutateParams, mutateValidation, job]);

  const deleteItem = useCallback(
    async (deletedItem: any) => {
      const array = item._value;
      const index = array.indexOf(deletedItem);
      console.log(index, deletedItem);
      if (index > -1) {
        // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
        console.log(array, valueForDispatch(item));
        const setParameterArg = {
          object_path: item._objectPath,
          value: valueForDispatch(item),
        };
        console.log(setParameterArg);
        const result = await api.post<Job>(
          `jobs/${job.id}/set_parameter`,
          setParameterArg
        );
        await mutateParams();
        await mutateValidation();
      }
    },
    [item]
  );

  return (
    <Card sx={{ mb: 1 }}>
      <CardHeader
        titleTypographyProps={{ variant: "body1", my: 0, py: 0 }}
        title={<>{guiLabel}</>}
        action={
          <>
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
            <Button onClick={extendListItem}>
              <Add />
            </Button>
          </>
        }
      />
      <CardContent>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {item?._value &&
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
            })}
        </Collapse>
      </CardContent>
    </Card>
  );
};
