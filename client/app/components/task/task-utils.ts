import $ from "jquery";
import { useCallback, useMemo } from "react";
import { useApi } from "../../api";
import { errorsInValidation } from "./task-elements/task-element";
import { Job } from "../../models";

export const classOfDefItem = (
  item: HTMLElement
): string | null | undefined => {
  if (item) {
    const $classNode = $(item).find("className");
    return $classNode.get(0)?.textContent;
  }
  return null;
};

export const pathOfParamsItem = (item: HTMLElement): string => {
  const parentElements = $(item).parents().toArray();
  //console.log(parentElements);
  if (parentElements.at(-1)?.nodeName === `ccp4:ccp4i2`) parentElements.pop();
  if (parentElements.at(-1)?.nodeName === `ccp4i2_body`) parentElements.pop();
  const pathElements = parentElements.map(
    (element: HTMLElement) => element.nodeName
  );
  const reversedElements = pathElements.reverse();
  reversedElements.push(item.nodeName);
  return reversedElements.join(".");
};

export const valueOfItem = (
  item: HTMLElement | XMLDocument | JQuery<HTMLElement> | JQuery<XMLDocument>
): any => {
  const childItems = $(item).children();
  if (childItems.length > 0) {
    const result: any = {};
    childItems.toArray().forEach((element) => {
      result[element.nodeName] = valueOfItem(element);
    });
    return result;
  } else {
    return $(item).text();
  }
};

export const valueOfItemPath = (
  itemPath: string,
  paramsXML:
    | XMLDocument
    | JQuery<XMLDocument>
    | HTMLElement
    | JQuery<HTMLElement>
): any | null => {
  const itemPathElements = itemPath.split(".").reverse();
  let paramsXMLElement:
    | HTMLElement
    | XMLDocument
    | JQuery<XMLDocument>
    | JQuery<HTMLElement>
    | undefined = paramsXML;
  //console.log({ itemPathElements }, paramsXMLElement);
  while (itemPathElements.length > 0) {
    const lastPathElement = itemPathElements.pop();
    if (lastPathElement && paramsXMLElement) {
      //console.log(lastPathElement);
      paramsXMLElement = $(paramsXMLElement).find(`${lastPathElement}`).get(0);
      //console.log({ lastPathElement, paramsXMLElement });
    }
  }
  if (paramsXMLElement) {
    return valueOfItem(paramsXMLElement);
  }
  return null;
};

const findItems = (
  name: string,
  container: any,
  multiple: boolean = true,
  growingList?: any[]
): any[] => {
  const listToGrow = growingList ? growingList : [];
  const originalLength = listToGrow.length;
  if (container?._objectPath?.endsWith(name)) {
    listToGrow.push(container);
    if (!multiple) return listToGrow;
  } else if (container._baseClass === "CList") {
    container._value.forEach((item: any) => {
      if (item._objectPath.endsWith(name)) {
        listToGrow.push(item);
        if (!multiple) return listToGrow;
      } else {
        findItems(name, item, multiple, listToGrow);
        if (!multiple && listToGrow.length > originalLength) return listToGrow;
      }
    });
  } else if (container._value?.constructor == Object) {
    try {
      Object.keys(container._value).forEach((key: string) => {
        const item = container._value[key];
        if (item._objectPath.endsWith(name)) {
          listToGrow.push(item);
          if (!multiple) return listToGrow;
        } else {
          findItems(name, item, multiple, listToGrow);
          if (!multiple && listToGrow.length > originalLength)
            return listToGrow;
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
  return listToGrow;
};

export const itemsForName = (
  name: string,
  container: any,
  multiple: boolean = false
) => {
  const itemMatches = findItems(name, container, multiple);
  return itemMatches;
};

export const useTaskContainer = (container: any) => {
  return useMemo(() => {
    if (container)
      return (param_name: string) =>
        itemsForName(param_name, container)[0]?._value;
    return () => {};
  }, [container]);
};

export const useTaskItem = (container: any) => {
  return useMemo(() => {
    if (container)
      return (param_name: string) => itemsForName(param_name, container)[0];
    return (itemName: string) => {};
  }, [container]);
};

export interface SetParameterArg {
  object_path: string;
  value: any;
}
export const useJob = (job: Job) => {
  const api = useApi();
  const { data: container, mutate: mutateContainer } = api.container<any>(
    `jobs/${job.id}/container`
  );
  const { data: validation, mutate: mutateValidation } = api.container<any>(
    `jobs/${job.id}/validation`
  );
  return {
    useAsyncEffect: (effect: () => Promise<void>, dependencies: any[]) => {
      useEffect(() => {
        const executeEffect = async () => {
          await effect();
        };

        executeEffect();
      }, dependencies);
    },
    setParameter: useCallback(
      async (setParameterArg: SetParameterArg) => {
        if (job.status == 1) {
          const result = await api.post<Job>(
            `jobs/${job.id}/set_parameter`,
            setParameterArg
          );
          console.log(result);
          await mutateContainer();
          await mutateValidation();
          return result;
        } else
          console.log(
            "Alert attempting to edit interface of task not in pending state"
          );
      },
      [job, mutateContainer, mutateValidation]
    ),
    getTaskItem: useMemo(() => {
      return (param_name: string) => {
        if (param_name?.length == 0) return null;
        return itemsForName(param_name, container)[0];
      };
    }, [container]),
    getTaskValue: useMemo(() => {
      return (param_name: string) => {
        const item = itemsForName(param_name, container)[0];
        return valueForDispatch(item);
      };
    }, [container]),
    getValidationColor: useMemo(() => {
      return (param_name: string) => {
        const fieldErrors = errorsInValidation(param_name, validation);
        return validationColor(fieldErrors);
      };
    }, [validation]),
    container,
  };
};

export const readFilePromise = async (
  file: File,
  readAs: "Text" | "ArrayBuffer" | "File" = "Text"
): Promise<string | ArrayBuffer | null | File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject();
    reader.onerror = () => reject();
    reader.onloadend = () => {
      // Do whatever you want with the file contents
      const textOrBuffer = reader.result;
      return resolve(textOrBuffer);
    };
    if (readAs === "Text") {
      reader.readAsText(file);
    } else if (readAs === "ArrayBuffer") {
      reader.readAsArrayBuffer(file);
    } else if (readAs === "File") {
      return resolve(file);
    }
  });
};

export const valueForDispatch = (item: any): any => {
  if (!item) return null;
  else if (
    typeof item._value === "undefined" ||
    item._value === undefined ||
    item._value === null ||
    typeof item._value === "string" ||
    typeof item._value === "number" ||
    typeof item._value === "boolean"
  ) {
    return item._value;
  } else if (item._value.constructor == Object) {
    const result: any = {};
    Object.keys(item._value).forEach(
      (key: string) => (result[key] = valueForDispatch(item._value[key]))
    );
    return result;
  } else if (Array.isArray(item._value)) {
    if (item._value.length == 0) return [];
    const result: any[] = item._value.map((value: any) =>
      valueForDispatch(value)
    );
    return result;
  } else {
    console.log("Unknown item", item._value);
  }
};

export const useValidation = (jobId: number) => {
  const api = useApi();
  const { data: validation, mutate: mutateValidation } = api.container<any>(
    `jobs/${jobId}/validation`
  );
  return useMemo(() => {
    if (validation)
      return {
        getErrors: (param_name: string) =>
          errorsInValidation(param_name, validation),
        mutateValidation,
      };
    return {
      getErrors: (param_name: string) => [],
      mutateValidation: () => {},
    };
  }, [validation]);
};

export const validationColor = (fieldErrors: any[]): string => {
  return fieldErrors && fieldErrors.length == 0
    ? "success.light"
    : fieldErrors &&
      fieldErrors.some((fieldError) => fieldError.severity.includes("WARNING"))
    ? "warning.light"
    : "error.light";
};

import { useEffect, useRef } from "react";

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
