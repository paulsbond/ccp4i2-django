import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "../../../api";
import { readFilePromise, useJob } from "../../../utils";
import { Job } from "../../../models";

export const CSimpleDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName } = props;
  const api = useApi();
  const { getTaskItem } = useJob(job.id);
  const { item } = getTaskItem(itemName);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const { mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: job.project,
    endpoint: "jobs",
  });

  const { mutate: mutateContainer } = api.get_wrapped_endpoint_json<any>({
    type: "jobs",
    id: job.id,
    endpoint: "container",
  });

  const { mutate: mutateValidation } = api.get_endpoint_xml({
    type: "jobs",
    id: job.id,
    endpoint: "validation",
  });

  const { data: fileDigest, mutate: mutateDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item._objectPath}`
  );

  const { mutate: mutateFiles } = api.get<File[]>(
    `projects/${job.project}/files`
  );

  //If file(s) are selected, call handleAccept
  useEffect(() => {
    if (selectedFiles) {
      processFirstFile();
    }
  }, [selectedFiles]);

  //handleAccept is a simple upload of the file to the server
  const processFirstFile = useCallback(async () => {
    if (selectedFiles) {
      //Read file
      const fileBuffer = await readFilePromise(selectedFiles[0], "ArrayBuffer");
      const fileBlob = new Blob([fileBuffer as string], {
        type: item._qualifiers.mimeTypeName,
      });

      const formData = new FormData();
      formData.append("objectPath", item._objectPath);
      formData.append("file", fileBlob, selectedFiles[0].name);
      const uploadResult = await api.post<any>(
        `jobs/${job.id}/upload_file_param`,
        formData
      );
      console.log(uploadResult);
      if (props.onFileChangeSuccess) {
        props.onFileChangeSuccess(uploadResult.updated_item);
      }
      setSelectedFiles(null);
      mutateJobs();
      mutateFiles();
      mutateContainer();
      mutateValidation();
      mutateDigest();
    }
  }, [job, item, selectedFiles]);

  const handleCancel = () => {
    setSelectedFiles(null);
  };

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  return inferredVisibility ? (
    <>
      <Stack direction="column">
        <CDataFileElement {...props} setFiles={setSelectedFiles} />
      </Stack>
    </>
  ) : null;
};
