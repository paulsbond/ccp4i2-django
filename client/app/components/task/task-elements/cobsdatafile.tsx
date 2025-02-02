import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useMemo, useRef, useState } from "react";
import { ParseMtz } from "./parse-mtz";
import { useApi } from "../../../api";
import { BaseSpacegroupCellElement } from "./base-spacegroup-cell-element";
import { useTaskItem } from "../task-utils";

export const CObsDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName } = props;
  const api = useApi();
  const { data: container } = api.container<any>(`jobs/${job.id}/container`);
  const useItem = useTaskItem(container);
  const item = useItem(itemName);
  const [fileContent, setFileContent] = useState<
    ArrayBuffer | null | string | File
  >(null);
  const cootModule = useRef<any | null>(null);

  const { data: fileDigest } = api.digest<any>(
    `jobs/${props.job.id}/digest?object_path=${item._objectPath}`
  );

  const infoContent = useMemo(
    () => <BaseSpacegroupCellElement data={fileDigest?.digest} />,
    [fileDigest]
  );

  return (
    <>
      <Stack direction="column">
        <CDataFileElement
          {...props}
          infoContent={infoContent}
          setFileContent={setFileContent}
        />
      </Stack>
      {fileContent && (
        <ParseMtz
          item={item}
          fileContent={fileContent as ArrayBuffer}
          setFileContent={setFileContent}
        />
      )}
    </>
  );
};
