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
import { useCallback, useState } from "react";
import { Add, Delete } from "@mui/icons-material";

export const CAsuContentSeqListElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { itemName, job } = props;
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const { getTaskItem, setParameter, container, mutateContainer } = useJob(
    job.id
  );

  const { item, update: updateList, value: itemValue } = getTaskItem(itemName);
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
    const result = await updateList(listValue);
    mutateContainer();
  }, [item, job, updateList]);

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
        const updateResult: any = await setParameter(setParameterArg);
        if (props.onParameterChangeSuccess) {
          await props.onParameterChangeSuccess(updateResult.updated_item);
        }
      }
    },
    [item]
  );

  return (
    item && (
      <>
        <Toolbar sx={{ m: 0, p: 0 }}>
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
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

        <Table style={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Number in AU</TableCell>
              <TableCell>Sequence</TableCell>
              <TableCell>Delete</TableCell>
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
                      maxWidth: property === "sequence" ? "30rem" : "10rem",
                    }}
                  >
                    <div
                      style={{
                        maxHeight: "10rem",
                        overflowY: "auto",
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {contentElement._value[property]._value}
                    </div>
                  </TableCell>
                ))}
                <TableCell>
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
