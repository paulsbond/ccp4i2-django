import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Grid2,
  Paper,
  Toolbar,
} from "@mui/material";
import { ElaborateSearch } from "../General/SearchObjects";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useApi } from "../../api";
import { MyExpandMore } from "../expand-more";
import { CCP4i2Context } from "../../app-context";

interface TaskTree {
  lookup: any;
  tree: any[];
}
interface TastTreeResult {
  TaskTree: TaskTree;
}
interface CCP4i2TaskTreeProps {
  onTaskSelect?: (taskName: string) => void;
}
interface CCP4i2TaskTreeFolderProps {
  category: [name: string, title: string, taskNames: string[]];
  searchText: string | null;
  taskTree: TaskTree;
  onTaskSelect?: (taskName: string) => void;
}
interface CCP4i2TaskCardProps {
  task: any;
  onTaskSelect?: (taskName: string) => void;
}

export const CCP4i2TaskTree: React.FC<CCP4i2TaskTreeProps> = ({
  onTaskSelect,
}) => {
  const api = useApi();
  const { projectId } = useContext(CCP4i2Context);
  const [searchText, setSearchText] = useState<string | null>(null);
  const { data: taskTreeResult } = api.get<any>(
    `projects/${projectId}/task_tree`
  );
  const taskTree = taskTreeResult?.task_tree;

  return (
    <Paper
      sx={{
        maxHeight: "calc(100vh - 10rem)",
        overflowY: "auto",
      }}
    >
      <Toolbar>
        {`Tasks (Currently numbering ${Object.keys(taskTree?.lookup).length})`}
        <ElaborateSearch
          searchValue={searchText}
          setSearchValue={setSearchText}
        />
      </Toolbar>
      <Paper>
        {taskTree?.tree?.map(
          (
            category: [name: string, title: string, taskNames: string[]],
            iCategory: number
          ) => (
            <CCP4i2TaskTreeFolder
              key={`${iCategory}`}
              {...{ category, taskTree, searchText, onTaskSelect }}
            />
          )
        )}
      </Paper>
    </Paper>
  );
};

const CCP4i2TaskTreeFolder: React.FC<CCP4i2TaskTreeFolderProps> = ({
  category,
  searchText,
  taskTree,
  onTaskSelect,
}) => {
  const [tasksExpanded, setTasksExpanded] = useState<boolean>(false);

  const filterFunc = useCallback(
    (taskName: string) => {
      if (searchText == null || searchText.trim().length == 0) return true;
      if (!taskTree?.lookup) return false;
      if (!Object.keys(taskTree?.lookup).includes(taskName)) return false;
      const versions: string[] = Object.keys(taskTree.lookup[taskName]);
      if (versions.length == 0) return false;
      const lastVersion = taskTree.lookup[taskName][versions[0]];
      if (!lastVersion) return false;
      return (
        lastVersion.TASKTITLE.toUpperCase().includes(
          searchText.toUpperCase()
        ) ||
        lastVersion.taskName.toUpperCase().includes(searchText.toUpperCase()) ||
        lastVersion.DESCRIPTION.toUpperCase().includes(searchText.toUpperCase())
      );
    },
    [taskTree, searchText]
  );

  const filteredTasks = useMemo(() => {
    if (!category || !taskTree) return [];
    if (!searchText || searchText.trim().length == 0) return category[2];
    return category[2].filter(filterFunc);
  }, [searchText, taskTree, category]);

  const searchActive = useMemo(() => {
    return searchText != null && searchText.trim().length > 0;
  }, [searchText]);

  return (
    filteredTasks &&
    filteredTasks.length > 0 && (
      <Card
        key={category[0]}
        onClick={(ev) => {
          ev.stopPropagation();
          setTasksExpanded(!tasksExpanded);
        }}
      >
        <CardHeader
          titleTypographyProps={{ variant: "h6", my: 0, py: 0 }}
          title={category[1]}
          subheader={category[0]}
          action={
            <MyExpandMore
              expand={tasksExpanded}
              onClick={(ev) => {
                ev.stopPropagation();
                setTasksExpanded(!tasksExpanded);
              }}
              aria-expanded={tasksExpanded}
              aria-label="Show subjobs"
            >
              <ExpandMoreIcon />
            </MyExpandMore>
          }
        />
        {(tasksExpanded || searchActive) && (
          <CardContent>
            <Collapse
              in={tasksExpanded || searchActive}
              timeout="auto"
              unmountOnExit
            >
              <Grid2
                container
                columnGap={0}
                rowGap={0}
                columnSpacing={0}
                rowSpacing={0}
              >
                {filteredTasks.map(
                  (taskName: string) =>
                    Object.keys(taskTree.lookup).includes(taskName) && (
                      <Grid2
                        key={JSON.stringify(taskTree.lookup[taskName])}
                        size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}
                        sx={{ m: 1 }}
                      >
                        <CCP4i2TaskCard
                          task={taskTree.lookup[taskName]}
                          onTaskSelect={onTaskSelect}
                        />
                      </Grid2>
                    )
                )}
              </Grid2>
            </Collapse>
          </CardContent>
        )}
      </Card>
    )
  );
};

const CCP4i2TaskCard: React.FC<CCP4i2TaskCardProps> = ({
  task,
  onTaskSelect,
}) => {
  const latestVersion: string | undefined = useMemo(() => {
    return Object.keys(task).at(-1);
  }, [task]);
  const handleTaskSelect = useCallback(() => {
    if (task && latestVersion && onTaskSelect) {
      onTaskSelect(task[latestVersion].taskName);
    }
  }, [task, onTaskSelect, latestVersion]);

  //useEffect(() => { console.log(task) }, [])
  return (
    latestVersion && (
      <Card
        sx={{
          minHeight: "18rem",
          maxHeight: "18rem",
          overflowY: "auto",
          ":hover": { boxShadow: 24 },
        }}
        onClick={handleTaskSelect}
      >
        <CardHeader
          titleTypographyProps={{ variant: "button", my: 0, py: 0 }}
          title={
            <>
              <Avatar
                src={`/svgicons/${task[latestVersion].taskName}.svg`}
                alt={`/qticons/${task[latestVersion].taskName}.png`}
              />
              {task[latestVersion].shortTitle}
            </>
          }
          subheader={task[latestVersion].TASKTITLE}
        />
        <CardContent>
          <p>{`${task[latestVersion].taskName}`}</p>
          <p>{`${task[latestVersion].DESCRIPTION}`}</p>
          {task[latestVersion].MAINTAINER !== "Nobody" && (
            <p>{`Maintained by ${task[latestVersion].MAINTAINER}`}</p>
          )}
        </CardContent>
      </Card>
    )
  );
};
