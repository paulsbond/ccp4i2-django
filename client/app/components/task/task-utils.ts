import $ from "jquery";

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
  console.log(parentElements);
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
  paramsXML: XMLDocument | JQuery<XMLDocument>
): any | null => {
  const itemPathElements = itemPath.split(".").reverse();
  let paramsXMLElement:
    | HTMLElement
    | XMLDocument
    | JQuery<XMLDocument>
    | JQuery<HTMLElement>
    | undefined = paramsXML;
  console.log({ itemPathElements });
  while (itemPathElements.length > 0) {
    const lastPathElement = itemPathElements.pop();
    if (lastPathElement && paramsXMLElement) {
      paramsXMLElement = $(paramsXMLElement).find(`${lastPathElement}`).get(0);
    }
  }
  if (paramsXMLElement) {
    return valueOfItem(paramsXMLElement);
  }
  return null;
};
