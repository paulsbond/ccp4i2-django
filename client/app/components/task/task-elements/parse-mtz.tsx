"use client";
import { DialogContent, DialogTitle } from "@mui/material";
import SimpleDialog from "@mui/material/Dialog";
import { useEffect, useRef, useState } from "react";

interface ParseMtzProps {
  fileContent: ArrayBuffer;
  item: any;
  setFileContent: (file: ArrayBuffer | null) => void;
}

import Script from "next/script";

const createArgs = {
  print(t: string) {
    console.log(["output", t]);
  },
  printErr(t: string) {
    console.error(["output", t]);
  },
  locateFile(path: string, prefix: string) {
    // if it's moorhen.wasm, use a custom dir
    if (path.endsWith("moorhen.wasm")) return "/moorhen.wasm";
    if (path.endsWith("mtz.wasm")) return prefix + path;
    // otherwise, use the default, the prefix (JS file's dir) + the path
    return prefix + path;
  },
};

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
  const [cootModule, setCootModule] = useState<any | null>(null);

  useEffect(() => {
    console.log({ fileContent, cootModule });
    const asyncFunc = async () => {
      if (fileContent && fileContent.byteLength && cootModule) {
        const fileName = `File_`;
        const byteArray = new Uint8Array(fileContent);
        cootModule.FS_createDataFile(".", fileName, byteArray, true, true);
        const header_info = cootModule.get_mtz_columns(fileName);
        cootModule.FS_unlink(`./${fileName}`);
        const newColumns: { [colType: string]: string } = {};
        for (let ih = 0; ih < header_info.size(); ih += 2) {
          newColumns[header_info.get(ih + 1)] = header_info.get(ih);
        }
        setAllColumnNames(newColumns);
      }
    };
    asyncFunc();
    return () => {};
  }, [fileContent, cootModule]);

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
    <>
      <Script
        src="/moorhen.js"
        onLoad={async () => {
          console.log("Hello");
          //@ts-ignore
          const cootModule = window
            .createCootModule(createArgs)
            .then((module) => {
              setCootModule(module);
              console.log({ cm: module });
            });
        }}
      />
      <SimpleDialog
        open={fileContent != null}
        onClose={() => {
          setFileContent(null);
        }}
      >
        <DialogTitle>{item?._objectPath}</DialogTitle>
        <DialogContent>{JSON.stringify(columnOptions)}</DialogContent>
      </SimpleDialog>
    </>
  );
};
