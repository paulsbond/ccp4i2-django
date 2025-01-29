"use client";
import { DialogContent, DialogTitle } from "@mui/material";
import SimpleDialog from "@mui/material/Dialog";
import { useEffect, useRef, useState } from "react";

interface ParseMtzProps {
  fileContent: ArrayBuffer;
  item: any;
  setFileContent: (file: ArrayBuffer | null) => void;
}

export const ParseMtz: React.FC<ParseMtzProps> = ({
  fileContent,
  setFileContent,
  item,
}) => {
  const [columnData, setColumnData] = useState<string[] | null>(null);
  const [columnOptions, setColumnOptions] = useState<any>({});
  const [allColumnNames, setAllColumnNames] = useState<{ [key: string]: any }>(
    []
  );
  const [selectedColumnOption, setSelectedColumnOption] = useState<any | null>(
    null
  );
  const scriptLoaded = useRef<boolean>(false);

  useEffect(() => {
    const asyncFunc = async () => {
      if (fileContent && fileContent.byteLength) {
        const fileName = `File_`;
        const byteArray = new Uint8Array(fileContent);
        window.CCP4Module.FS_createDataFile(
          ".",
          fileName,
          byteArray,
          true,
          true
        );
        const header_info = window.CCP4Module.get_mtz_columns(fileName);
        window.CCP4Module.FS_unlink(`./${fileName}`);
        const newColumns: { [colType: string]: string } = {};
        for (let ih = 0; ih < header_info.size(); ih += 2) {
          newColumns[header_info.get(ih + 1)] = header_info.get(ih);
        }
        setAllColumnNames(newColumns);
      }
    };
    asyncFunc();
  }, [fileContent]);

  useEffect(() => {
    const sortedColumnNames: any = {};
    const options: any = {};
    Object.keys(allColumnNames).forEach((label) => {
      const columnType: string = allColumnNames[label];
      if (!Object.keys(sortedColumnNames).includes(columnType))
        sortedColumnNames[columnType] = [];
      sortedColumnNames[columnType].push(label);
    });
    const signatures = [...item._qualifiers.correctColumns];
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
  }, [allColumnNames]);

  return (
    <SimpleDialog
      open={fileContent != null}
      onClose={() => {
        setFileContent(null);
      }}
    >
      <DialogTitle>{item?._objectPath}</DialogTitle>
      <DialogContent>{JSON.stringify(columnOptions)}</DialogContent>
    </SimpleDialog>
  );
};
