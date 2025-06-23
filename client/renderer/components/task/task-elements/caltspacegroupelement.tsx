import { CCP4i2TaskElementProps } from "./task-element";
import { useJob } from "../../../utils";
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
} from "@mui/material";
import { Info } from "@mui/icons-material";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ErrorInfo } from "./error-info";
import { TaskInterfaceContext } from "../../../providers/task-container";
import { SpaceGroup, spaceGroups } from "../../../spacegroups";

export const CAltSpaceGroupElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName, qualifiers } = props;
  const { setParameter, getTaskItem, getValidationColor } = useJob(job.id);
  const { item, value: stringValue, update } = getTaskItem(itemName);
  const [value, setValue] = useState<SpaceGroup | undefined>(spaceGroups[0]);
  const { inFlight, setInFlight } = useContext(TaskInterfaceContext);

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props?.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  useEffect(() => {
    if (stringValue)
      setValue(spaceGroups.find((sg: SpaceGroup) => sg.name === stringValue));
  }, [stringValue]);

  const handleInputChanged = async (arg: SpaceGroup) => {
    setValue(arg);
    setInFlight(true);
    const setParameterArg = {
      object_path: item._objectPath,
      value: value?.name,
    };
    console.log(setParameterArg);
    try {
      const result: any = await setParameter(setParameterArg);
      if (props.onParameterChangeSuccess) {
        await props.onParameterChangeSuccess(result.updated_item);
      }
    } catch (err) {
      alert(err);
    }
    setInFlight(false);
  };
  return inferredVisibility ? (
    <Card
      sx={{
        border: "3px solid",
        borderColor: getValidationColor(item),
      }}
    >
      <CardHeader
        title={qualifiers?.guiLabel}
        sx={{ borderColor: getValidationColor(item) }}
        action={<ErrorInfo {...props} />}
      />
      <CardContent sx={{ my: 0, py: 0 }}>
        {item && (
          <Autocomplete
            sx={{
              mt: 1,
              backgroundColor: inFlight ? "#ffeebe" : "palette.common.white",
            }}
            id="autocomplete-spacegroup"
            disabled={inFlight || job.status != 1}
            multiple={false}
            options={spaceGroups}
            getOptionLabel={(option: SpaceGroup) => option.name}
            getOptionKey={(option: SpaceGroup) => option.name}
            value={value}
            style={{ minWidth: "15rem" }}
            onChange={(
              event: React.SyntheticEvent<Element, Event>,
              newValue: SpaceGroup | null
            ) => {
              if (newValue) {
                handleInputChanged(newValue);
              }
            }}
            renderInput={(params: any) => (
              <TextField {...params} label="Space groups" />
            )}
          />
        )}
      </CardContent>
    </Card>
  ) : null;
};
