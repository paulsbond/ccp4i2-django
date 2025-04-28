import { useMemo } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { CSimpleTextFieldElement } from "./csimple-textfield";
import { CSimpleAutocompleteElement } from "./csimple-autocomplete";
import { useJob } from "../../../utils";

export interface CCP4i2CSimpleElementProps extends CCP4i2TaskElementProps {
  type: "int" | "float" | "text" | "checkbox";
}

export const CSimpleElement: React.FC<CCP4i2CSimpleElementProps> = (props) => {
  const { itemName, job, qualifiers } = props;
  const { getTaskItem } = useJob(job.id);
  const { item } = getTaskItem(itemName);

  const patchedQualifiers = useMemo(() => {
    if (item?._qualifiers) {
      try {
        const overriddenQualifiers = qualifiers
          ? { ...item._qualifiers, ...qualifiers }
          : item._qualifiers;
        return overriddenQualifiers;
      } catch (err) {
        console.log(`Error getting qualifiers on ${itemName}`);
      }
    }
    return qualifiers;
  }, [item, qualifiers, itemName]);

  const usingSelect = useMemo(() => {
    return (
      patchedQualifiers.onlyEnumerators &&
      patchedQualifiers.enumerators?.length > 0
    );
  }, [item]);

  const inferredVisibility = useMemo(() => {
    if (!props.visibility) return true;
    if (typeof props.visibility === "function") {
      return props.visibility();
    }
    return props.visibility;
  }, [props.visibility]);

  return usingSelect
    ? inferredVisibility && (
        <CSimpleAutocompleteElement {...props} qualifiers={patchedQualifiers} />
      )
    : inferredVisibility && (
        <CSimpleTextFieldElement {...props} qualifiers={patchedQualifiers} />
      );
};
