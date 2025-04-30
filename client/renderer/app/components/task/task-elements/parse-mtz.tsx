"use client";
import {
  Autocomplete,
  AutocompleteChangeReason,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SimpleDialog from "@mui/material/Dialog";
import {
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { v4 as uuid4 } from "uuid";
import { CCP4i2Context } from "../../../app-context";
import { readFilePromise } from "../../../utils";

const signatureMap = {
  KMKM: "Intensity Friedel pairs",
  GLGL: "Structure factor Friedel pairs",
  JQ: "Intensities",
  FQ: "Structure factors",
};

interface ParseMtzProps {
  file: File;
  item: any;
  setFiles: (files: FileList | null) => void;
  handleAccept?: (signature: string) => void;
  handleCancel?: () => void;
}

export const ParseMtz: React.FC<ParseMtzProps> = ({
  file,
  setFiles,
  item,
  handleAccept,
  handleCancel,
}) => {
  const [columnOptions, setColumnOptions] = useState<{
    [signature: string]: [keySelectors: string];
  }>({});
  const [allColumnNames, setAllColumnNames] = useState<{ [key: string]: any }>(
    []
  );
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const handleChangeGroup = useCallback(
    (event: SyntheticEvent<Element, Event>, newValue: string | null) => {
      setSelectedGroup(newValue);
    },
    []
  );

  const { cootModule } = useContext(CCP4i2Context);

  const valuesReducer = (
    state: { [key: string]: string },
    action: { type: string; signature: string; value: string }
  ) => {
    switch (action.type) {
      case "SET_VALUE":
        return { ...state, [action.signature]: action.value };
      default:
        return state;
    }
  };

  const [values, dispatch] = useReducer(valuesReducer, {});

  useEffect(() => {
    const asyncFunc = async () => {
      if (file && cootModule) {
        const fileContent = await readFilePromise(file, "ArrayBuffer");
        if (fileContent) {
          const fileName = `File_${uuid4()}`;
          const byteArray = new Uint8Array(fileContent as ArrayBuffer);
          cootModule.FS_createDataFile(".", fileName, byteArray, true, true);
          const header_info = cootModule.get_mtz_columns(fileName);
          cootModule.FS_unlink(`./${fileName}`);
          const newColumns: { [colType: string]: string } = {};
          for (let ih = 0; ih < header_info.size(); ih += 2) {
            newColumns[header_info.get(ih + 1)] = header_info.get(ih);
          }
          if (Object.keys(newColumns).length === 0) {
            console.error("Error parsing MTZ file");
            if (handleCancel) handleCancel();
          }
          setAllColumnNames(newColumns);
        }
      }
    };
    asyncFunc();
    return () => {};
  }, [file, cootModule]);

  useEffect(() => {
    if (!item) return;
    const sortedColumnNames: any = {};
    const options: any = {};
    Object.keys(allColumnNames).forEach((label) => {
      const columnType: string = allColumnNames[label];
      if (!Object.keys(sortedColumnNames).includes(columnType))
        sortedColumnNames[columnType] = [];
      sortedColumnNames[columnType].push(label);
    });
    const signatures =
      item?._class === "CGenericReflDataFile"
        ? ["KMKM", "GLGL", "JQ", "FQ"]
        : [...item._qualifiers.correctColumns];
    signatures.forEach((signature) => {
      const signatureOptions: string[][] = [];
      let iOption = 0;
      const columnCounters: any = {};
      Object.keys(sortedColumnNames).forEach(
        (key) => (columnCounters[key] = 0)
      );
      let doContinue = true;
      while (doContinue) {
        signatureOptions[iOption] = [];
        for (let i = 0; i < signature.length; i++) {
          const columnType = signature.charAt(i);
          if (!Object.keys(sortedColumnNames).includes(columnType)) {
            doContinue = false;
            break;
          }
          if (
            columnCounters[columnType] >= sortedColumnNames[columnType].length
          ) {
            doContinue = false;
            break;
          }
          signatureOptions[iOption].push(
            sortedColumnNames[columnType][columnCounters[columnType]]
          );
          columnCounters[columnType] += 1;
        }
        iOption += 1;
      }
      if (signatureOptions.length > 0) {
        options[signature] = signatureOptions
          .filter((signatureOption) => signatureOption.length > 0)
          .map((signatureOption) => `/*/*/[${signatureOption.join(",")}]`);
      }
    });
    setColumnOptions(options);
    if (Object.keys(options).length > 0) {
      const initialValues: { [key: string]: string } = {};
      Object.keys(options).forEach((signature) => {
        initialValues[signature] = options[signature][0];
      });
      Object.entries(initialValues).forEach(([signature, value]) => {
        dispatch({ type: "SET_VALUE", signature, value });
      });
      setSelectedGroup(Object.keys(options)[0]);
    }
  }, [allColumnNames, item]);

  const onAcceptClicked = useCallback(() => {
    if (selectedGroup) {
      //alert(JSON.stringify(values[selectedGroup]));
      if (handleAccept) handleAccept(values[selectedGroup]);
    }
  }, [values, handleAccept, selectedGroup]);

  return (
    <>
      <SimpleDialog
        open={
          file != null &&
          allColumnNames &&
          Object.keys(allColumnNames).length > 0
        }
        onClose={() => {
          setFiles(null);
        }}
        slotProps={{
          paper: {
            sx: { width: "80%", maxWidth: "none" },
          },
        }}
      >
        <DialogTitle>{item?._objectPath}</DialogTitle>
        <DialogContent>
          <RadioGroup value={selectedGroup} onChange={handleChangeGroup}>
            {Object.keys(columnOptions).map(
              (signature: string, index: number) =>
                columnOptions[signature].length > 0 && (
                  <Stack key={signature} direction="row">
                    <FormControlLabel
                      sx={{ minWidth: "20rem" }}
                      key={index}
                      value={signature}
                      control={<Radio size="small" />}
                      label={
                        Object.keys(signatureMap).includes(signature)
                          ? //@ts-ignore
                            signatureMap[signature]
                          : signature
                      }
                    />
                    <Autocomplete
                      options={columnOptions[signature]}
                      value={values[signature] || ""}
                      onChange={(
                        event: SyntheticEvent<Element, Event>,
                        value: any | null,
                        reason: AutocompleteChangeReason
                      ) => {
                        dispatch({
                          type: "SET_VALUE",
                          signature,
                          value: value || "",
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          sx={{ my: 2, minWidth: "20rem" }}
                          {...params}
                          label="Columns"
                        />
                      )}
                    />
                  </Stack>
                )
            )}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button disabled={!Boolean(selectedGroup)} onClick={onAcceptClicked}>
            OK
          </Button>
          <Button
            onClick={(ev) => {
              if (handleCancel) handleCancel();
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </SimpleDialog>
    </>
  );
};
