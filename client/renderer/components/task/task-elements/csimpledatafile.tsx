import { Stack } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElementProps } from "./task-element";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "../../../api";
import { readFilePromise, useJob, useProject } from "../../../utils";

interface CSimpleDataFileElementProps extends CCP4i2TaskElementProps {
  hasValidationError?: boolean;
}

export const CSimpleDataFileElement: React.FC<CSimpleDataFileElementProps> = (
  props
) => {
  const { job, itemName, onChange, visibility } = props;
  const api = useApi();
  const { useTaskItem, useFileDigest, mutateContainer, mutateValidation } =
    useJob(job.id);
  const { mutateFiles, mutateJobs } = useProject(job.project);
  const { item } = useTaskItem(itemName);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const { data: fileDigest, mutate: mutateDigest } = useFileDigest(
    item?._objectPath
  );
  const previousSelectedFiles = useRef<FileList | null>(null);

  const processFirstFile = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length == 0 || !item) return;
    if (selectedFiles === previousSelectedFiles.current) return;
    previousSelectedFiles.current = selectedFiles;
    const fileBuffer = await readFilePromise(selectedFiles[0], "ArrayBuffer");
    const formData = new FormData();

    formData.append("objectPath", item._objectPath);
    formData.append(
      "file",
      new Blob([fileBuffer as string], { type: item._qualifiers.mimeTypeName }),
      selectedFiles[0].name
    );

    const uploadResult = await api.post<any>(
      `jobs/${job.id}/upload_file_param`,
      formData
    );

    onChange?.(uploadResult.updated_item);
    setSelectedFiles(null);

    // Execute all mutations in parallel
    await Promise.all([
      mutateJobs(),
      mutateFiles(),
      mutateContainer(),
      mutateValidation(),
      mutateDigest(),
    ]);
  }, [
    job,
    item,
    selectedFiles,
    onChange,
    api,
    mutateJobs,
    mutateFiles,
    mutateContainer,
    mutateValidation,
    mutateDigest,
  ]);

  // Auto-process files when selected
  useEffect(() => {
    if (selectedFiles && processFirstFile) processFirstFile();
  }, [selectedFiles, processFirstFile]);

  const isVisible = useMemo(
    () =>
      !visibility ||
      (typeof visibility === "function" ? visibility() : visibility),
    [visibility]
  );

  if (!isVisible) return null;

  return (
    <Stack direction="column" spacing={0} useFlexGap>
      <CDataFileElement {...props} setFiles={setSelectedFiles} />
    </Stack>
  );
};
