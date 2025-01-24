import { Autocomplete, LinearProgress, TextField } from "@mui/material";
import { useApi } from "../../../api";
import { CCP4i2TaskElementProps } from "./task-element";
import { File } from "../../../models";
import { useMemo } from "react";
import { valueOfItemPath } from "../task-utils";

export const CPdbDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { sx, qualifiers, objectPath, job, paramsXML } = props;
  const { data: project_files, mutate: mutateFiles } = api.get<File[]>(
    `projects/${job.project}/files`
  );
  const { data: params_xml, mutate: mutateParams } = api.get<{
    status: string;
    params_xml: string;
  }>(`jobs/${props.job.id}/params_xml`);
  if (!project_files) return <LinearProgress />;

  const fileOptions = project_files.filter(
    (file: File) => file.type === "chemical/x-pdb"
  );

  const value = useMemo<any | null>(() => {
    if (objectPath && paramsXML)
      return valueOfItemPath("prosmart_refmac.inputData.XYZIN", paramsXML);
    return null;
  }, [paramsXML, objectPath]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  return (
    <>
      {JSON.stringify(value)}
      <Autocomplete
        disabled={job.status !== 1}
        sx={sx}
        //value={value}
        //onChange={handleSelect}
        options={fileOptions || []}
        getOptionLabel={(option) => `${option.name}${option.annotation}`}
        renderInput={(params) => <TextField {...params} label={guiLabel} />}
      />
    </>
  );

  return;
};
