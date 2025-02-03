import { useMemo } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { CSimpleTextFieldElement } from "./csimple-textfield";
import { CSimpleAutocompleteElement } from "./csimple-autocomplete";
import { useJob } from "../task-utils";

export interface CCP4i2CSimpleElementProps extends CCP4i2TaskElementProps {
  type: "int" | "float" | "text" | "checkbox";
}

export const CSimpleElement: React.FC<CCP4i2CSimpleElementProps> = (props) => {
  const { itemName, job } = props;
  const { getTaskItem } = useJob(job);
  const item = getTaskItem(itemName);

  const usingSelect = useMemo(() => {
    return item?._qualifiers?.onlyEnumerators;
  }, [item]);

  return usingSelect ? (
    <CSimpleAutocompleteElement {...props} />
  ) : (
    <CSimpleTextFieldElement {...props} />
  );
};
