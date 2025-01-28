import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo, useRef, useState } from "react";
import { ParseMtz } from "../../parse-mtz";

export const CObsDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
  const returnPromise = useRef<Promise<ArrayBuffer> | null>(null);
  return (
    <>
      <Stack direction="column">
        <CDataFileElement
          {...props}
          processForUpload={<ArrayBuffer,>(fileContent: ArrayBuffer) => {
            if (fileContent) {
              setFileContent(fileContent);
              return Promise.resolve(fileContent as ArrayBuffer);
            }
          }}
        />
      </Stack>
      <ParseMtz
        fileContent={fileContent as ArrayBuffer}
        setFileContent={setFileContent}
      />
      ;
    </>
  );
};
