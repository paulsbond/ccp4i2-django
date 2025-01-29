import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo, useRef, useState } from "react";
import { ParseMtz } from "./parse-mtz";
import { useApi } from "../../../api";
import { BaseSpacegroupCellElement } from "./base-spacegroup-cell-element";

export const CObsDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const [obsFileContent, setObsFileContent] = useState<ArrayBuffer | null>(
    null
  );
  const { data: fileDigest } = api.digest<any>(
    `jobs/${props.job.id}/digest?${props.item.objectPath}`
  );
  const returnPromise = useRef<Promise<ArrayBuffer> | null>(null);
  return (
    <>
      <Stack direction="column">
        <CDataFileElement
          {...props}
          processForUpload={<ArrayBuffer,>(fileContent: ArrayBuffer | null) => {
            if (fileContent != null) {
              setObsFileContent(fileContent);
            }
            return Promise.resolve(obsFileContent as ArrayBuffer);
          }}
          infoContent={<BaseSpacegroupCellElement data={fileDigest?.digest} />}
        />
      </Stack>
      <ParseMtz
        item={props.item}
        fileContent={obsFileContent as ArrayBuffer}
        setFileContent={setObsFileContent}
      />
      ;
    </>
  );
};
