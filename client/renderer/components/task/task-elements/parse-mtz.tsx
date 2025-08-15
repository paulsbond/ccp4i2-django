"use client";

import React, {
  SyntheticEvent,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
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
} from "@mui/material";
import SimpleDialog from "@mui/material/Dialog";
import { v4 as uuid4 } from "uuid";

import { useCCP4i2Window } from "../../../app-context";
import { readFilePromise } from "../../../utils";

// Constants
const SIGNATURE_MAP: Record<string, string> = {
  KMKM: "Intensity Friedel pairs",
  GLGL: "Structure factor Friedel pairs",
  JQ: "Intensities",
  FQ: "Structure factors",
} as const;

const GENERIC_SIGNATURES = ["KMKM", "GLGL", "JQ", "FQ"] as const;

// Types
interface ColumnOptions {
  [signature: string]: string[];
}

interface ColumnNames {
  [columnLabel: string]: string;
}

interface ColumnCounters {
  [columnType: string]: number;
}

interface ValuesState {
  [signature: string]: string;
}

interface ValuesAction {
  type: "SET_VALUE";
  signature: string;
  value: string;
}

interface ItemQualifiers {
  correctColumns?: string[];
}

interface ParseMtzItem {
  _class?: string;
  _objectPath?: string;
  _qualifiers?: ItemQualifiers;
}

interface ParseMtzProps {
  file: File;
  item: ParseMtzItem;
  setFiles: (files: FileList | null) => void;
  handleAccept?: (signature: string) => void;
  handleCancel?: () => void;
}

// Reducer
const valuesReducer = (
  state: ValuesState,
  action: ValuesAction
): ValuesState => {
  switch (action.type) {
    case "SET_VALUE":
      return {
        ...state,
        [action.signature]: action.value,
      };
    default:
      return state;
  }
};

// Helper functions
const createSignatureOptions = (
  signature: string,
  sortedColumnNames: Record<string, string[]>
): string[] => {
  const signatureOptions: string[][] = [];
  let optionIndex = 0;

  const columnCounters: ColumnCounters = {};
  Object.keys(sortedColumnNames).forEach((key) => {
    columnCounters[key] = 0;
  });

  let shouldContinue = true;

  while (shouldContinue) {
    signatureOptions[optionIndex] = [];

    for (let i = 0; i < signature.length; i++) {
      const columnType = signature.charAt(i);

      if (!Object.keys(sortedColumnNames).includes(columnType)) {
        shouldContinue = false;
        break;
      }

      if (columnCounters[columnType] >= sortedColumnNames[columnType].length) {
        shouldContinue = false;
        break;
      }

      signatureOptions[optionIndex].push(
        sortedColumnNames[columnType][columnCounters[columnType]]
      );
      columnCounters[columnType] += 1;
    }

    optionIndex += 1;
  }

  return signatureOptions
    .filter((option) => option.length > 0)
    .map((option) => `/*/*/[${option.join(",")}]`);
};

const buildColumnOptions = (
  allColumnNames: ColumnNames,
  item: ParseMtzItem
): ColumnOptions => {
  const sortedColumnNames: Record<string, string[]> = {};

  // Group columns by type
  Object.entries(allColumnNames).forEach(([label, columnType]) => {
    if (!sortedColumnNames[columnType]) {
      sortedColumnNames[columnType] = [];
    }
    sortedColumnNames[columnType].push(label);
  });

  // Determine signatures to process
  const signatures =
    item._class === "CGenericReflDataFile"
      ? [...GENERIC_SIGNATURES]
      : [...(item._qualifiers?.correctColumns || [])];

  const options: ColumnOptions = {};

  signatures.forEach((signature) => {
    const signatureOptions = createSignatureOptions(
      signature,
      sortedColumnNames
    );
    if (signatureOptions.length > 0) {
      options[signature] = signatureOptions;
    }
  });

  return options;
};

const getSignatureLabel = (signature: string): string => {
  return SIGNATURE_MAP[signature] || signature;
};

// Component
export const ParseMtz: React.FC<ParseMtzProps> = ({
  file,
  setFiles,
  item,
  handleAccept,
  handleCancel,
}) => {
  // State
  const [columnOptions, setColumnOptions] = useState<ColumnOptions>({});
  const [allColumnNames, setAllColumnNames] = useState<ColumnNames>({});
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [values, dispatch] = useReducer(valuesReducer, {});

  // Context
  const { cootModule } = useCCP4i2Window();

  // Handlers
  const handleGroupChange = useCallback(
    (event: SyntheticEvent<Element, Event>, newValue: string | null) => {
      setSelectedGroup(newValue);
    },
    []
  );

  const handleColumnChange = useCallback(
    (signature: string) =>
      (
        event: SyntheticEvent<Element, Event>,
        value: string | null,
        reason: AutocompleteChangeReason
      ) => {
        dispatch({
          type: "SET_VALUE",
          signature,
          value: value || "",
        });
      },
    []
  );

  const handleAcceptClick = useCallback(() => {
    if (selectedGroup && handleAccept) {
      handleAccept(values[selectedGroup]);
    }
  }, [values, handleAccept, selectedGroup]);

  const handleDialogClose = useCallback(() => {
    setFiles(null);
  }, [setFiles]);

  const handleCancelClick = useCallback(() => {
    if (handleCancel) {
      handleCancel();
    }
  }, [handleCancel]);

  // Effects
  useEffect(() => {
    const parseMtzFile = async (): Promise<void> => {
      if (!file || !cootModule) return;
      if (file.name.endsWith(".mtz")) {
        try {
          const fileContent = await readFilePromise(file, "ArrayBuffer");
          if (!fileContent) return;

          const fileName = `File_${uuid4()}`;
          const byteArray = new Uint8Array(fileContent as ArrayBuffer);

          cootModule.FS_createDataFile(".", fileName, byteArray, true, true);
          const headerInfo = cootModule.get_mtz_columns(fileName);
          cootModule.FS_unlink(`./${fileName}`);

          const newColumns: ColumnNames = {};
          for (let i = 0; i < headerInfo.size(); i += 2) {
            newColumns[headerInfo.get(i + 1)] = headerInfo.get(i);
          }

          if (Object.keys(newColumns).length === 0) {
            console.error("Error parsing MTZ file");
            handleCancel?.();
            return;
          }

          setAllColumnNames(newColumns);
        } catch (error) {
          console.error("Failed to parse MTZ file:", error);
          handleCancel?.();
        }
      } else {
        handleAccept?.("/*/*/[FP,SIGFP]"); // Default to FP,SIGFP if not an MTZ file
      }
    };

    parseMtzFile();
  }, [file, cootModule, handleCancel]);

  useEffect(() => {
    if (!item || Object.keys(allColumnNames).length === 0) return;

    const options = buildColumnOptions(allColumnNames, item);
    setColumnOptions(options);

    if (Object.keys(options).length > 0) {
      // Set initial values
      const initialValues: ValuesState = {};
      Object.entries(options).forEach(([signature, signatureOptions]) => {
        initialValues[signature] = signatureOptions[0];
      });

      Object.entries(initialValues).forEach(([signature, value]) => {
        dispatch({ type: "SET_VALUE", signature, value });
      });

      setSelectedGroup(Object.keys(options)[0]);
    }
  }, [allColumnNames, item]);

  // Computed values
  const isDialogOpen = Boolean(
    file && allColumnNames && Object.keys(allColumnNames).length > 0
  );

  const isAcceptDisabled = !selectedGroup;

  return (
    <SimpleDialog
      open={isDialogOpen}
      onClose={handleDialogClose}
      slotProps={{
        paper: {
          sx: { width: "80%", maxWidth: "none" },
        },
      }}
    >
      <DialogTitle>{item._objectPath}</DialogTitle>

      <DialogContent>
        <RadioGroup value={selectedGroup} onChange={handleGroupChange}>
          {Object.entries(columnOptions).map(
            ([signature, options]) =>
              options.length > 0 && (
                <Stack key={signature} direction="row" spacing={2}>
                  <FormControlLabel
                    sx={{ minWidth: "20rem" }}
                    value={signature}
                    control={<Radio size="small" />}
                    label={getSignatureLabel(signature)}
                  />

                  <Autocomplete
                    options={options}
                    value={values[signature] || ""}
                    onChange={handleColumnChange(signature)}
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
        <Button disabled={isAcceptDisabled} onClick={handleAcceptClick}>
          OK
        </Button>
        <Button onClick={handleCancelClick}>Cancel</Button>
      </DialogActions>
    </SimpleDialog>
  );
};
