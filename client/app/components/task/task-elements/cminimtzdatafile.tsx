import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useCallback, useMemo, useState } from "react";
import { ParseMtz } from "./parse-mtz";
import { useApi } from "../../../api";
import { BaseSpacegroupCellElement } from "./base-spacegroup-cell-element";
import { readFilePromise, useJob } from "../task-utils";
import { Job } from "../../../models";

export const CMiniMtzDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName } = props;
  const api = useApi();
  const { getTaskItem } = useJob(job);
  const item = getTaskItem(itemName);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const { data: fileDigest, mutate: mutateDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item._objectPath}`
  );

  const { mutate: mutateJobs } = api.get<Job[]>(`projects/${job.project}/jobs`);

  const { mutate: mutateContainer } = api.container<any>(
    `jobs/${props.job.id}/container`
  );

  const { mutate: mutateValidation } = api.container<any>(
    `jobs/${props.job.id}/validation`
  );

  const { mutate: mutateFiles } = api.get<File[]>(
    `projects/${job.project}/files`
  );

  const infoContent = useMemo(
    () => <BaseSpacegroupCellElement data={fileDigest?.digest} />,
    [fileDigest]
  );

  const handleAccept = useCallback(
    async (signature: string) => {
      if (selectedFiles) {
        //Read file
        const fileBuffer = await readFilePromise(
          selectedFiles[0],
          "ArrayBuffer"
        );
        const fileBlob = new Blob([fileBuffer as string], {
          type: "application/CCP4-mtz-file",
        });

        const formData = new FormData();
        formData.append("column_selector", signature);
        formData.append("objectPath", item._objectPath);
        formData.append("file", fileBlob, selectedFiles[0].name);
        console.log(signature, item._objectPath, selectedFiles[0]);
        const uploadResult = await api.post<Job>(
          `jobs/${job.id}/upload_file_param`,
          formData
        );
        setSelectedFiles(null);
        mutateDigest();
        mutateJobs();
        mutateFiles();
        mutateContainer();
        mutateValidation();
      }
    },
    [job, item, selectedFiles]
  );

  const handleCancel = () => {
    setSelectedFiles(null);
  };

  return (
    <>
      <Stack direction="column">
        <CDataFileElement
          {...props}
          infoContent={infoContent}
          setFiles={setSelectedFiles}
        />
      </Stack>
      {selectedFiles && (
        <ParseMtz
          item={item}
          file={selectedFiles[0]}
          setFiles={setSelectedFiles}
          handleAccept={handleAccept}
          handleCancel={handleCancel}
        />
      )}
    </>
  );
};
