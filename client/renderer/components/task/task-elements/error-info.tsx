import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ClickAwayListener,
  Collapse,
  LinearProgress,
  Popper,
  Table,
  TableBody,
  TableRow,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import {
  SyntheticEvent,
  use,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { ExpandLess, ExpandMore, Info, MoreHoriz } from "@mui/icons-material";
import { useJob, valueOfItem } from "../../../utils";
import { TaskInterfaceContext } from "../../contexts/task-container";
import { Job } from "../../../models";
import { Line } from "react-chartjs-2";
import { SimpleObjectTable } from "../../simple-object-table";

export const ErrorTrigger: React.FC<{ item: any; job: Job }> = ({
  item,
  job,
}) => {
  const { setErrorInfoAnchor, setErrorInfoItem } =
    useContext(TaskInterfaceContext);
  const { getValidationColor } = useJob(job.id);
  const handleClick = useCallback(
    (ev: SyntheticEvent) => {
      setErrorInfoAnchor(ev.currentTarget);
      setErrorInfoItem(item);
      ev.stopPropagation();
      ev.preventDefault();
    },
    [setErrorInfoAnchor, setErrorInfoItem, item]
  );

  return (
    <Button
      size="small"
      sx={{ px: 0, py: 0, mx: 0, my: 0, maxWidth: "1rem" }}
      onClick={handleClick}
    >
      <Info sx={{ width: 1, color: getValidationColor(item) }} />
    </Button>
  );
};

export const ErrorPopper: React.FC<{ job: Job }> = ({ job }) => {
  const {
    setErrorInfoAnchor,
    errorInfoAnchor,
    setErrorInfoItem,
    errorInfoItem,
  } = useContext(TaskInterfaceContext);
  const { getValidationColor, getErrors } = useJob(job.id);
  const fieldErrors = errorInfoItem ? getErrors(errorInfoItem) : null;
  useEffect(() => {
    console.log("errorInfoItem", errorInfoItem, errorInfoAnchor);
  }, [errorInfoItem, errorInfoAnchor]);
  const [qualifiersOpen, setQualifiersOpen] = useState<boolean>(false);
  const [valueOpen, setValueOpen] = useState<boolean>(false);

  const valueOfErrorInfoItem = useMemo(() => {
    if (!errorInfoItem) return null;
    const result = valueOfItem(errorInfoItem);
    if (result || typeof result === "boolean") {
      if (typeof result === "object") {
        return result;
      } else if (typeof result === "boolean") {
        return { value: result ? "true" : "false" };
      } else {
        return { value: result };
      }
    }
    return null;
  }, [errorInfoItem]);

  const errorContent = useMemo(() => {
    if (!errorInfoItem) return null;
    return (
      <>
        {errorInfoItem && fieldErrors && fieldErrors.messages.length > 0 ? (
          <Box
            sx={{
              borderRadius: 5,
              bgcolor: getValidationColor(errorInfoItem),
              p: 1,
            }}
          >
            <Typography variant="subtitle1">
              Errors in {errorInfoItem._objectPath}
            </Typography>
            {fieldErrors.messages.map((fieldError: any, iError: number) => (
              <Typography
                key={`${iError}`}
                sx={{ textWrap: "wrap", maxWidth: "40rem" }}
              >
                {fieldError}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="subtitle1">
            No errors for {errorInfoItem._objectPath}
          </Typography>
        )}
        {errorInfoItem && errorInfoItem._qualifiers && (
          <Card key="qualifiers">
            <CardHeader
              avatar={qualifiersOpen ? <ExpandLess /> : <ExpandMore />}
              title="Item qualifiers"
              onClick={() => {
                setQualifiersOpen(qualifiersOpen ? false : true);
              }}
            />
            <CardContent>
              <Collapse
                in={qualifiersOpen}
                timeout="auto"
                unmountOnExit
                sx={{ p: 2 }}
              >
                <SimpleObjectTable object={errorInfoItem._qualifiers} />
              </Collapse>
            </CardContent>
          </Card>
        )}
        {valueOfErrorInfoItem && (
          <Card key="value">
            <CardHeader title="Value of item" />
            <CardContent>
              <SimpleObjectTable object={valueOfErrorInfoItem} />
            </CardContent>
          </Card>
        )}
      </>
    );
  }, [errorInfoItem, fieldErrors, qualifiersOpen]);

  const isOpen = Boolean(errorInfoAnchor);

  const handleClickAway = (ev: MouseEvent | TouchEvent) => {
    console.log("Identified click away");
    setErrorInfoAnchor(null);
    setErrorInfoItem(null);
    ev.stopPropagation();
  };

  return (
    errorInfoItem &&
    errorInfoAnchor &&
    errorContent && (
      <Popper
        anchorEl={errorInfoAnchor}
        placement="auto-end"
        open={errorInfoAnchor != null}
        sx={{
          zIndex: 1000,
          bgcolor: "background.paper",
          p: 1,
          maxWidth: "40rem",
        }}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            sx={{
              border: 1,
              p: 1,
              bgcolor: "paper",
              textWrap: "pretty",
            }}
          >
            {errorContent}
          </Box>
        </ClickAwayListener>
      </Popper>
    )
  );
};

export const ErrorInfo: React.FC<CCP4i2TaskElementProps> = (props) => {
  return <LinearProgress />;
};
