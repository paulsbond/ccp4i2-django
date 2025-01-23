import { useMemo } from "react";
import { CCP4i2TaskElementProps } from "./task-element";
import { CSimpleTextFieldElement } from "./csimple-textfield";
import { CSimpleAutocompleteElement } from "./csimple-autocomplete";

export interface CCP4i2CSimpleElementProps extends CCP4i2TaskElementProps {
  type: "int" | "float" | "text";
}

export const CSimpleElement: React.FC<CCP4i2CSimpleElementProps> = (props) => {
  const { paramsXML, itemName, objectPath, job, mutate, type, qualifiers } =
    props;

  const usingSelect = useMemo(() => {
    if (qualifiers) {
      return Object.keys(qualifiers).includes("onlyEnumerators");
    }
    return false;
  }, [qualifiers]);

  return usingSelect ? (
    <CSimpleAutocompleteElement {...props} />
  ) : (
    <CSimpleTextFieldElement {...props} />
  );
};
