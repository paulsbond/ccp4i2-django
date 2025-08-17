import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useCallback, useMemo, useState } from "react";
import { ParseMtz } from "./parse-mtz";
import { useApi } from "../../../api";
import { BaseSpacegroupCellElement } from "./base-spacegroup-cell-element";
import { readFilePromise, useJob } from "../../../utils";
import { Job } from "../../../types/models";

export const CMiniMtzDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName, onChange, visibility } = props;
  const api = useApi();
  const { useTaskItem, useFileDigest } = useJob(job.id);
  const { item } = useTaskItem(itemName);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Mutation hooks
  const mutators = {
    jobs: api.get_endpoint<Job[]>({
      type: "projects",
      id: job.project,
      endpoint: "jobs",
    }).mutate,
    container: api.get_wrapped_endpoint_json<any>({
      type: "jobs",
      id: job.id,
      endpoint: "container",
    }).mutate,
    validation: api.get_endpoint_xml({
      type: "jobs",
      id: job.id,
      endpoint: "validation",
    }).mutate,
    files: api.get<File[]>(`projects/${job.project}/files`).mutate,
  };

  const { data: fileDigest, mutate: mutateDigest } = useFileDigest(
    item?._objectPath || ""
  );

  const infoContent = useMemo(
    () => <BaseSpacegroupCellElement data={fileDigest} />,
    [fileDigest]
  );

  const handleAccept = useCallback(
    async (signature: string) => {
      if (!selectedFiles) return;

      const fileBuffer = await readFilePromise(selectedFiles[0], "ArrayBuffer");
      const formData = new FormData();

      if (signature?.trim()) formData.append("column_selector", signature);
      formData.append("objectPath", item._objectPath);
      formData.append(
        "file",
        new Blob([fileBuffer as string], { type: "application/CCP4-mtz-file" }),
        selectedFiles[0].name
      );

      const uploadResult = await api.post<any>(
        `jobs/${job.id}/upload_file_param`,
        formData
      );

      onChange?.(uploadResult.updated_item);
      setSelectedFiles(null);

      // Trigger all mutations
      await Promise.all([
        mutators.jobs(),
        mutators.files(),
        mutators.container(),
        mutators.validation(),
        mutateDigest(),
      ]);
    },
    [job.id, item, selectedFiles, onChange, api, mutators, mutateDigest]
  );

  const handleCancel = useCallback(() => setSelectedFiles(null), []);

  const isVisible = useMemo(
    () =>
      !visibility ||
      (typeof visibility === "function" ? visibility() : visibility),
    [visibility]
  );

  if (!isVisible) return null;

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
