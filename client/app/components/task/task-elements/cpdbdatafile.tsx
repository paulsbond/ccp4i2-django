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
  const { sx, qualifiers, objectPath, job } = props;
  const { data: project_files, mutate: mutateFiles } = api.get<File[]>(
    `projects/${job.project}/files`
  );
  const { data: params_xml, mutate: mutateParams } = api.get<{
    status: string;
    params_xml: string;
  }>(`jobs/${props.job.id}/params_xml`);

  const paramsXML = params_xml?.params_xml
    ? $($.parseXML(params_xml?.params_xml))
    : $();

  if (!project_files) return <LinearProgress />;

  const fileOptions = project_files.filter(
    (file: File) => file.type === "chemical/x-pdb"
  );

  const value = useMemo<any | null>(() => {
    if (objectPath && paramsXML && fileOptions) {
      const result = valueOfItemPath("inputData.XYZIN", paramsXML);
      if (result.dbFileId && result.dbFileId.trim().length > 0) {
        const chosenOption = fileOptions.find((file: File) => {
          const dehyphentatedUUID = file.uuid.replace(/-/g, "");
          const dehyphentatedDbFileId = result.dbFileId.replace(/-/g, "");
          return dehyphentatedUUID === dehyphentatedDbFileId;
        });
        return chosenOption;
      }
    }
    return null;
  }, [paramsXML, objectPath, fileOptions]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  return (
    <Autocomplete
      disabled={job.status !== 1}
      sx={sx}
      value={value}
      //onChange={handleSelect}
      options={fileOptions || []}
      getOptionLabel={(option) => `${option.name}${option.annotation}`}
      getOptionKey={(option) => `${option.uuid}`}
      renderInput={(params) => <TextField {...params} label={guiLabel} />}
    />
  );

  return;
};
