import $ from "jquery";
import { useMemo } from "react";

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
  if (container._objectPath.endsWith(name)) {
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
        itemsForName(param_name, container)[0]._value;
    return () => {};
  }, [container]);
};

export const valueForDispatch = (item: any): any => {
  if (
    !item ||
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
