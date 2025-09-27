import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import {
  Button,
  Dialog,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from "@mui/material";
import { useApi } from "../../../api";
import { useJob, usePrevious, valueOfItem } from "../../../utils";
import { useCallback, useEffect, useState } from "react";
import { Add, Delete } from "@mui/icons-material";
import { useParameterChangeIntent } from "../../../providers/parameter-change-intent-provider";
import { clear } from "console";

export const CAsuContentSeqListElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job } = props;
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const { useTaskItem, setParameter, container, mutateContainer } = useJob(
    job.id
  );
  const { intent, setIntent, clearIntent } = useParameterChangeIntent();

  const { item, update: updateList, value: itemValue } = useTaskItem(itemName);
  const previousItemValue = usePrevious(itemValue);

  const extendListItem = useCallback(async () => {
    if (!updateList) return;
    var taskElement = JSON.parse(JSON.stringify(item._subItem));
    taskElement._objectPath = taskElement._objectPath.replace(
      "[?]",
      "[" + item._value.length + "]"
    );
    for (var valueElementKey in taskElement._value) {
      var valueElement = taskElement._value[valueElementKey];
      valueElement._objectPath = valueElement._objectPath.replace(
        "[?]",
        "[" + item._value.length + "]"
      );
    }
    const listValue = Array.isArray(valueOfItem(item)) ? valueOfItem(item) : [];
    let newItemValue = valueOfItem(taskElement);
    listValue.push(newItemValue);
    await updateList(listValue);
  }, [item, job, updateList, setIntent, mutateContainer]);

  // After reload, select the new item if intent matches
  useEffect(() => {
    if (
      item?._value &&
      intent &&
      typeof intent === "object" &&
      "jobId" in intent &&
      job.id === (intent as any).jobId &&
      "reason" in intent &&
      intent.reason === "UserEdit" &&
      "parameterPath" in intent &&
      intent.parameterPath === item._objectPath &&
      "previousValue" in intent &&
      intent.previousValue !== undefined &&
      JSON.stringify(intent.previousValue) !== JSON.stringify(itemValue)
    ) {
      if (intent.previousValue.length < itemValue.length) {
        setDetailItem(item?._value[item?._value.length - 1]);
      }
      clearIntent();
    }
  }, [item?._value, intent, job.id, clearIntent]);

  const deleteItem = useCallback(
    async (deletedItem: any) => {
      const array = item._value;
      const index = array.indexOf(deletedItem);
      if (index > -1) {
        array.splice(index, 1);
        const setParameterArg = {
          object_path: item._objectPath,
          value: valueOfItem(item),
        };
        const updateResult: any = await setParameter(setParameterArg);
        if (props.onChange) {
          await props.onChange(updateResult.updated_item);
        }
      }
    },
    [item, setParameter, props.onChange]
  );

  useEffect(() => {
    console.debug("CAsuContentSeqListElement mounted");
    return () => {
      console.debug("CAsuContentSeqListElement unmounted");
    };
  }, []);

  return (
    item && (
      <>
        <Toolbar sx={{ m: 0, p: 0, mt: 0, pt: 0 }}>
          <Typography variant="body1" sx={{ mt: 0, pt: 0, flexGrow: 1 }}>
            Click a table row to edit the constituents of the ASU
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={async () => {
              await extendListItem();
            }}
          />
        </Toolbar>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ maxWidth: "5rem" }}>Name</TableCell>
              <TableCell style={{ maxWidth: "5rem" }}>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell style={{ maxWidth: "5rem" }}>Number in AU</TableCell>
              <TableCell>Sequence</TableCell>
              <TableCell style={{ maxWidth: "5rem" }}>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {item?._value?.map((contentElement: any, iElement: number) => (
              <TableRow
                key={`${iElement}`}
                onClick={() => setDetailItem(contentElement)}
                sx={{
                  transition: "box-shadow 0.2s, background 0.2s",
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: 3,
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                {[
                  "name",
                  "polymerType",
                  "description",
                  "nCopies",
                  "sequence",
                ].map((property) => (
                  <TableCell
                    key={property}
                    style={{
                      maxWidth: ["name", "polymerType", "nCopies"].includes(
                        property
                      )
                        ? "5rem"
                        : property === "description"
                          ? "10rem"
                          : property === "sequence"
                            ? "20rem"
                            : undefined,
                    }}
                  >
                    <div
                      style={{
                        maxHeight: "12rem",
                        overflowY: "auto",
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {contentElement._value[property]._value}
                    </div>
                  </TableCell>
                ))}
                <TableCell style={{ maxWidth: "5rem" }}>
                  <Button
                    startIcon={<Delete />}
                    size="small"
                    onClick={(ev: any) => {
                      ev.stopPropagation();
                      ev.preventDefault();
                      deleteItem(contentElement);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {(item?._value?.length ?? 0) === 0 && (
          <div
            style={{
              margin: "1rem auto",
              maxWidth: 340,
              background: "rgba(255,255,200,0.95)",
              borderRadius: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              padding: "0.75rem 1rem",
              textAlign: "center",
              color: "#666",
              fontSize: 15,
              lineHeight: 1.3,
              position: "relative",
            }}
          >
            <span
              role="img"
              aria-label="hint"
              style={{ fontSize: 20, marginBottom: 4 }}
            >
              💡
            </span>
            <div>
              No content yet. Use the <b>+</b> button above to add a constituent
              to the ASU.
            </div>
          </div>
        )}
        {detailItem && (
          <Dialog
            open={Boolean(detailItem)}
            onClose={() => {
              setDetailItem(null);
              mutateContainer();
            }}
            fullWidth
            maxWidth={false}
            slotProps={{
              paper: {
                style: {
                  margin: "1rem",
                  width: "calc(100% - 2rem)",
                },
              },
            }}
          >
            <DialogContent>
              <CCP4i2TaskElement
                {...props}
                itemName={`${detailItem._objectPath}`}
              />
            </DialogContent>
          </Dialog>
        )}
      </>
    )
  );
};
