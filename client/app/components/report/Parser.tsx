import { parseStringPromise } from "xml2js";

export interface CCP4ApplicationOutput {
  CCP4Table?: CCP4Table[];
  Fonts?: Fonts;
  CCP4Surface?: Surface;
  title?: string;
}

export interface CCP4Table {
  headers?: Header[];
  data?: Data[];
  plot?: Plot[];
  title?: string;
}

export interface Header {
  _: string;
  separator?: string;
}

export interface Data {
  _: string;
  separator?: string;
  id?: string;
}

export interface Plot {
  title?: string;
  plotline?: PlotLine[] | PlotLine;
  histogram?: Histogram[];
  barchart?: BarChart[];
  xlabel?: string;
  ylabel?: string;
  description?: string;
  xintegral?: string;
  xrange?: { min?: number; max?: number };
  yrange?: { min?: number; max?: number };
}

export interface PlotLine {
  xcol: number;
  ycol: number;
  dataid?: string;
  rightaxis?: string;
  colour?: string;
}

export interface Histogram {
  col: number;
  colour?: string;
  nbins?: number;
  binwidth?: number;
}

export interface BarChart {
  col: number;
  tcol?: number;
  colour?: string;
  width?: string;
}

export interface Fonts {
  titleFont?: FontLine;
  legendFont?: FontLine;
  axesTickerFont?: FontLine;
}

export interface FontLine {
  _: string;
  family?: string;
  size?: number;
  weight?: string;
  slant?: string;
}

export interface Surface {
  _: string;
  rows?: number;
  columns?: number;
  title?: string;
}

export const parseXML = async (xml: string): Promise<CCP4ApplicationOutput> => {
  const nsStripped = stripNamespaces(xml);
  const tablised = changeTagName(nsStripped, "ccp4_data", "CCP4Table");
  const result = await parseStringPromise(tablised, {
    explicitArray: false,
    mergeAttrs: true,
  });
  return result as CCP4ApplicationOutput;
};

function stripNamespaces(xmlString: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  console.log("Before", { xmlDoc });
  function processNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Create a new element without namespace
      const newElement = xmlDoc.createElement(element.localName);

      // Copy attributes (without namespace)
      Array.from(element.attributes).forEach((attr) => {
        newElement.setAttribute(attr.name, attr.value);
      });

      // Move child nodes
      while (element.firstChild) {
        newElement.appendChild(element.firstChild);
      }

      // Replace the old element with the new one
      const parent = element.parentNode;
      if (parent) {
        parent.replaceChild(newElement, element);
        // Process child nodes
        newElement.childNodes.forEach(processNode);
      }
    }
  }

  processNode(xmlDoc);

  // Serialize back to string
  const serializer = new XMLSerializer();
  console.log("After", { xmlDoc });

  return serializer.serializeToString(xmlDoc);
}

function changeTagNameNS(
  xmlString: string,
  namespaceURI: string,
  oldTagName: string,
  newTagName: string
): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  console.log({ xmlDoc });
  // Get all elements with the old tag name in the namespace
  const oldElements = xmlDoc.getElementsByTagNameNS(namespaceURI, oldTagName);
  console.log({ oldElements });

  // Convert NodeList to array (since NodeList is live)
  const elementsArray: Element[] = Array.from(oldElements);

  elementsArray.forEach((oldElement) => {
    // Create a new element with the same namespace
    const newElement = xmlDoc.createElementNS(namespaceURI, newTagName);

    // Copy attributes
    Array.from(oldElement.attributes).forEach((attr) => {
      newElement.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
    });

    // Move child nodes to the new element
    while (oldElement.firstChild) {
      newElement.appendChild(oldElement.firstChild);
    }

    // Replace the old element with the new one
    const parent = oldElement.parentNode;
    if (parent) {
      parent.replaceChild(newElement, oldElement);
    }
  });

  // Serialize XML back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

function changeTagName(
  xmlString: string,
  oldTagName: string,
  newTagName: string,
  namespaceURI?: string
): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  console.log("In changeTagName", { xmlDoc });
  function processNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Check if the element matches the old tag name and optional namespace
      if (
        element.localName === oldTagName &&
        (!namespaceURI || element.namespaceURI === namespaceURI)
      ) {
        const newElement = namespaceURI
          ? xmlDoc.createElementNS(namespaceURI, newTagName) // Preserve namespace if provided
          : xmlDoc.createElement(newTagName); // Otherwise, create without namespace

        // Copy attributes
        Array.from(element.attributes).forEach((attr) => {
          newElement.setAttribute(attr.name, attr.value);
        });

        // Move child nodes
        while (element.firstChild) {
          newElement.appendChild(element.firstChild);
        }

        // Replace the old element with the new one
        const parent = element.parentNode;
        if (parent) {
          parent.replaceChild(newElement, element);
          processNode(newElement); // Recursive call to process children
        }
      }
    }

    // Process child nodes
    node.childNodes.forEach(processNode);
  }

  processNode(xmlDoc.documentElement);

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}
