import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useCallback, useMemo, useState } from "react";
import { ParseMtz } from "./parse-mtz";
import { useApi } from "../../../api";
import { BaseSpacegroupCellElement } from "./base-spacegroup-cell-element";
import { readFilePromise, useJob } from "../../../utils";
import { Job } from "../../../models";

export const CMiniMtzDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName } = props;
  const api = useApi();
  const { getTaskItem } = useJob(job.id);
  const item = getTaskItem(itemName);
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

  const { mutate: mutateFiles } = api.get<File[]>(
    `projects/${job.project}/files`
  );

  const { data: fileDigest } = api.digest<any>(
    `jobs/${job.id}/digest?object_path=${item._objectPath}`
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

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  return (
    inferredVisibility && (
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
    )
  );
};
