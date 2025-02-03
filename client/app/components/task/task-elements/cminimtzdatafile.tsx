import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useCallback, useMemo, useState } from "react";
import { ParseMtz } from "./parse-mtz";
import { useApi } from "../../../api";
import { BaseSpacegroupCellElement } from "./base-spacegroup-cell-element";
import { useJob } from "../task-utils";

export const CMiniMtzDataFile: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { job, itemName } = props;
  const api = useApi();
  const { getTaskItem } = useJob(job);
  const item = getTaskItem(itemName);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: fileDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item._objectPath}`
  );

  const infoContent = useMemo(
    () => <BaseSpacegroupCellElement data={fileDigest?.digest} />,
    [fileDigest]
  );

  const handleAccept = useCallback(
    (signature: string) => {
      const formData = new FormData();
      formData.append("jobId", `${job.id}`);
      formData.append("signature", signature);
      formData.append("objectPath", item._objectPath);
      formData.append("file", selectedFile as File);
      setSelectedFile(null);
    },
    [job, item, selectedFile]
  );

  const handleCancel = () => {
    setSelectedFile(null);
  };

  return (
    <>
      <Stack direction="column">
        <CDataFileElement
          {...props}
          infoContent={infoContent}
          setFile={setSelectedFile}
        />
      </Stack>
      {selectedFile && (
        <ParseMtz
          item={item}
          file={selectedFile}
          setFile={setSelectedFile}
          handleAccept={handleAccept}
          handleCancel={handleCancel}
        />
      )}
    </>
  );
};
