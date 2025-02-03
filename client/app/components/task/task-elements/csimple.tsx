import { useMemo } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { CSimpleTextFieldElement } from "./csimple-textfield";
import { CSimpleAutocompleteElement } from "./csimple-autocomplete";
import { Typography } from "@mui/material";
import { useApi } from "../../../api";
import { useTaskItem } from "../task-utils";

export interface CCP4i2CSimpleElementProps extends CCP4i2TaskElementProps {
  type: "int" | "float" | "text" | "checkbox";
}

export const CSimpleElement: React.FC<CCP4i2CSimpleElementProps> = (props) => {
  const { itemName } = props;
  const api = useApi();
  const { data: container } = api.container<any>(
    `jobs/${props.job.id}/container`
  );
  const useItem = useTaskItem(container);
  const item = useItem(itemName);

  const usingSelect = useMemo(() => {
    return item?._qualifiers?.onlyEnumerators;
  }, [item]);

  return usingSelect ? (
    <CSimpleAutocompleteElement {...props} />
  ) : (
    <CSimpleTextFieldElement {...props} />
  );
};
