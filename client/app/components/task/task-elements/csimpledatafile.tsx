import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "../../../api";
import { readFilePromise, useJob } from "../task-utils";
import { Job } from "../../../models";

export const CSimpleDataFileElement: React.FC<CCP4i2TaskElementProps> = (
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

  useEffect(() => {
    if (selectedFiles) {
      handleAccept();
    }
  }, [selectedFiles]);

  const handleAccept = useCallback(async () => {
    if (selectedFiles) {
      //Read file
      const fileBuffer = await readFilePromise(selectedFiles[0], "ArrayBuffer");
      const fileBlob = new Blob([fileBuffer as string], {
        type: item._qualifiers.mimeTypeName,
      });

      const formData = new FormData();
      formData.append("objectPath", item._objectPath);
      formData.append("file", fileBlob, selectedFiles[0].name);
      const uploadResult = await api.post<Job>(
        `jobs/${job.id}/upload_file_param`,
        formData
      );
      console.log(uploadResult);
      setSelectedFiles(null);
      mutateDigest();
      mutateJobs();
      mutateFiles();
      mutateContainer();
      mutateValidation();
    }
  }, [job, item, selectedFiles]);

  const handleCancel = () => {
    setSelectedFiles(null);
  };

  return (
    <>
      <Stack direction="column">
        <CDataFileElement {...props} setFiles={setSelectedFiles} />
      </Stack>
    </>
  );
};
