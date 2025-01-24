import {
  Autocomplete,
  AutocompleteChangeReason,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
} from "@mui/material";
import { useApi } from "../../../api";
import { CCP4i2TaskElementProps } from "./task-element";
import { File, Job } from "../../../models";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { valueOfItemPath } from "../task-utils";

export const CPdbDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const api = useApi();
  const { sx, qualifiers, objectPath, job } = props;
  const [inFlight, setInFlight] = useState(false);
  const [value, setValue] = useState<any>({});

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

  useEffect(() => {
    if (objectPath && paramsXML && fileOptions) {
      const result = valueOfItemPath("inputData.XYZIN", paramsXML);
      if (result.dbFileId && result.dbFileId.trim().length > 0) {
        const chosenOption = fileOptions.find((file: File) => {
          const dehyphentatedUUID = file.uuid.replace(/-/g, "");
          const dehyphentatedDbFileId = result.dbFileId.replace(/-/g, "");
          return dehyphentatedUUID === dehyphentatedDbFileId;
        });
        console.log({ result, chosenOption });
        setValue(chosenOption);
      }
    }
    setValue(null);
  }, [paramsXML, objectPath, fileOptions]);

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  const handleSelect = useCallback(
    async (
      event: SyntheticEvent<Element, Event>,
      value: File | null,
      reason: AutocompleteChangeReason
    ) => {
      const setParameterArg: any = {
        object_path: objectPath,
      };
      if (reason === "clear") {
        setParameterArg.value = null;
      } else if (value) {
        setParameterArg.value = { dbFileId: value.uuid };
      }
      console.log({ setParameterArg });
      setInFlight(true);
      const result = await api.post<Job>(
        `jobs/${job.id}/set_parameter`,
        setParameterArg
      );
      console.log(result);
      await mutateParams();
      setInFlight(false);
    },
    [job]
  );

  return (
    <Stack direction="row">
      <Autocomplete
        disabled={job.status !== 1}
        sx={sx}
        value={value}
        onChange={handleSelect}
        options={fileOptions || []}
        getOptionLabel={(option) => `${option.name}${option.annotation}`}
        getOptionKey={(option) => `${option.uuid}`}
        renderInput={(params) => <TextField {...params} label={guiLabel} />}
      />
      <CircularProgress
        sx={{ height: "2rem", width: "2rem", mt: "1.25rem" }}
        variant={inFlight ? "indeterminate" : "determinate"}
        value={100}
      />
    </Stack>
  );

  return;
};
