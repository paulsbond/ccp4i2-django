import { useMemo } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { CSimpleTextFieldElement } from "./csimple-textfield";
import { CSimpleAutocompleteElement } from "./csimple-autocomplete";
import { useJob } from "../../../utils";

export interface CCP4i2CSimpleElementProps extends CCP4i2TaskElementProps {
  type: "int" | "float" | "text" | "checkbox";
}

export const CSimpleElement: React.FC<CCP4i2CSimpleElementProps> = (props) => {
  const { itemName, job } = props;
  const { getTaskItem } = useJob(job.id);
  const item = getTaskItem(itemName);

  const usingSelect = useMemo(() => {
    return item?._qualifiers?.onlyEnumerators;
  }, [item]);

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  return usingSelect
    ? inferredVisibility && <CSimpleAutocompleteElement {...props} />
    : inferredVisibility && <CSimpleTextFieldElement {...props} />;
};
