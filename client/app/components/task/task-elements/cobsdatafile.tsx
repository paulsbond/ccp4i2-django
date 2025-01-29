import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo, useRef, useState } from "react";
import { ParseMtz } from "./parse-mtz";
import { useApi } from "../../../api";
import { BaseSpacegroupCellElement } from "./base-spacegroup-cell-element";
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
    alert(`${path}`);
    if (path.endsWith("moorhen.wasm")) return "/moorhen.wasm";
    if (path.endsWith("mtz.wasm")) return "/mtz.wasm";
    // otherwise, use the default, the prefix (JS file's dir) + the path
    return prefix + path;
  },
};

export const CObsDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const [fileContent, setFileContent] = useState<
    ArrayBuffer | null | string | File
  >(null);
  const cootModule = useRef<any | null>(null);

  const { data: fileDigest } = api.digest<any>(
    `jobs/${props.job.id}/digest?${props.item.objectPath}`
  );
  const returnPromise = useRef<Promise<ArrayBuffer> | null>(null);
  return (
    <>
      <Script
        src="/mtz.js"
        onLoad={async () => {
          console.log("Hello");
          //@ts-ignore
          const cootModule = await window.GemmiMtz(createArgs);
          cootModule.current = cootModule;
          console.log({ cootModule });
        }}
      />
      <Stack direction="column">
        <CDataFileElement
          {...props}
          infoContent={<BaseSpacegroupCellElement data={fileDigest?.digest} />}
          setFileContent={setFileContent}
        />
        <BaseSpacegroupCellElement data={fileDigest?.digest} />
      </Stack>
      {fileContent && (
        <ParseMtz
          item={props.item}
          fileContent={fileContent as ArrayBuffer}
          setFileContent={setFileContent}
        />
      )}
    </>
  );
};
