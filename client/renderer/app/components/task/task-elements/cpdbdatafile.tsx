import { Stack, Typography } from "@mui/material";
import { CDataFileElement } from "./cdatafile";
import { CCP4i2TaskElement, CCP4i2TaskElementProps } from "./task-element";
import { useMemo } from "react";
import { useApi } from "../../../api";
import { useJob } from "../../../utils";
import { CSimpleDataFileElement } from "./csimpledatafile";

export const CPdbDataFileElement: React.FC<CCP4i2TaskElementProps> = (
  props
) => {
  const { job, itemName } = props;
  const api = useApi();
  const { getTaskItem } = useJob(job.id);
  const item = getTaskItem(itemName);

  const selectionItemName = useMemo(() => {
    const result = `${item._objectPath}.selection.text`;
    return result;
  }, [item]);

  const fileDigest = {};
  const infoContent = useMemo(
    () => <Typography>{JSON.stringify(fileDigest)}</Typography>,
    [fileDigest]
  );

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  return (
    inferredVisibility && (
      <Stack direction="column">
        <CSimpleDataFileElement {...props} />
        <CCP4i2TaskElement
          {...props}
          itemName={selectionItemName}
          qualifiers={{
            ...getTaskItem(selectionItemName)._qualifiers,
            guiLabel: "Selection string",
          }}
        />
      </Stack>
    )
  );
};
