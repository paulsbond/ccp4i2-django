import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  CircularProgress,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useApi } from "../../../api";
import { Job, Project, File as CCP4i2File } from "../../../models";
import { CCP4i2CSimpleElementProps } from "./csimple";
import { CCP4i2TaskElementProps, errorInValidation } from "./task-element";

export const CBooleanElement: React.FC<CCP4i2TaskElementProps> = (props) => {
  const { job, sx, item, qualifiers } = props;
  const api = useApi();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [value, setValue] = useState<number | string | null>(null);
  const [validationAnchor, setValidationAnchor] = useState<HTMLElement | null>(
    null
  );
  const [inFlight, setInFlight] = useState(false);
  const validationOpen = Boolean(validationAnchor);
  const progressRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setValue(item._value);
  }, [item]);

  const { objectPath } = useMemo<{
    objectPath: string | null;
  }>(() => {
    if (item) return { objectPath: item._objectPath };
    return { objectPath: null };
  }, [item]);

  const { mutate } = api.container<any>(`jobs/${job.id}/container`);

  const { mutate: mutateParams } = api.get<any>(`jobs/${job.id}/container`);

  const { data: validation, mutate: mutateValidation } = api.container<any>(
    `jobs/${props.job.id}/validation`
  );
  const { mutate: mutateContent } = api.digest<any>(
    `jobs/${props.job.id}/digest?object_path=${objectPath}`
  );

  const handleChange: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (ev) => {
    setValue(ev.target.value);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = async (ev) => {
    if (ev.key === "Enter") {
      const setParameterArg = {
        object_path: objectPath,
        value: value,
      };
      console.log({ setParameterArg });
      const result = await api.post<Job>(
        `jobs/${job.id}/set_parameter`,
        setParameterArg
      );
      console.log(result);
      mutate();
      await mutateParams();
      await mutateContent();
      await mutateValidation();
      setInFlight(false);
    }
  };

  const guiLabel = useMemo<string>(() => {
    return qualifiers?.guiLabel
      ? qualifiers.guiLabel
      : objectPath?.split(".").at(-1);
  }, [objectPath, qualifiers]);

  const fieldError = useMemo(() => {
    return errorInValidation(item._objectPath, validation);
  }, [item, validation]);

  const infoContent = useMemo(() => {
    return <span></span>;
  }, [item]);
  return (
    <Stack direction="row">
      <TextField
        disabled={job.status !== 1}
        sx={{ minWidth: "20rem", ...sx }}
        type="checkbox"
        value={value || ""}
        label={guiLabel}
        title={qualifiers?.toolTip ? qualifiers.toolTip : objectPath}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <CircularProgress
        ref={progressRef}
        sx={{ height: "2rem", width: "2rem" }}
        variant={inFlight ? "indeterminate" : "determinate"}
        value={100}
      />
      <Popper anchorEl={anchorEl} open={open}>
        <Box sx={{ border: 1, p: 1, bgcolor: "background.paper" }}>
          {infoContent}
        </Box>
      </Popper>
      <Popper open={Boolean(fieldError)} anchorEl={progressRef.current}>
        <Box sx={{ border: 1, p: 1, bgcolor: "background.paper" }}>
          {fieldError && (
            <Typography sx={{ textWrap: "wrap", maxWidth: "15rem" }}>
              {fieldError.description}
            </Typography>
          )}
        </Box>
      </Popper>
    </Stack>
  );
};
