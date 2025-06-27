import { useEffect, useMemo, useState } from "react";
import $ from "jquery";
import { CCP4i2RVAPITable } from "./CCP4i2RVAPITable";
import { CCP4i2ReportElementProps } from "./CCP4i2ReportElement";
import { parse } from "acorn";

export const CCP4i2ReportGeneric: React.FC<CCP4i2ReportElementProps> = (
  props
) => {
  const isRVAPITable = useMemo(() => {
    return $(props.item).children("table.rvapi-page").length > 0;
  }, [props.item, props.job]);

  const tableBody = useMemo(() => {
    const tableBody = $(props.item).find("tbody").get(0);
    return tableBody;
  }, [props.item]);

  // Clean up SVG namespaces for rendering
  const cleanedInnerHTML = useMemo(() => {
    let html = props.item.innerHTML;
    // Remove all namespace prefixes like ns0:
    html = html.replace(/<\s*\/?\s*ns\d*:/g, (match) =>
      match.replace(/ns\d*:/, "")
    );
    // Remove xmlns:ns0="..." attributes
    html = html.replace(/xmlns:ns\d+="[^"]*"/g, "");

    return html;
  }, [props.item.innerHTML]);

  const interactiveSVG: string | null = useMemo(() => {
    try {
      // Parse the SVG string
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanedInnerHTML, "image/svg+xml");

      // Extract the script content
      const script = doc.querySelector("script");
      let scriptContent = "";
      if (script) {
        scriptContent = script.textContent || "";
        script.parentNode?.removeChild(script); // Remove script from SVG
      }

      // Serialize the cleaned SVG back to a string
      const cleanedSVG = new XMLSerializer().serializeToString(doc);

      // Insert the SVG into the DOM (e.g., using dangerouslySetInnerHTML)
      // <div dangerouslySetInnerHTML={{ __html: cleanedSVG }} />

      // Execute the script (if any)
      if (scriptContent) {
        // WARNING: Only do this if you trust the SVG source!
        // eslint-disable-next-line no-new-func
        // Parse the script
        const ast = parse(scriptContent, { ecmaVersion: 2020 });
        // Collect top-level symbols
        const symbols = [];
        for (const node of ast.body) {
          if (node.type === "VariableDeclaration") {
            for (const decl of node.declarations) {
              if (decl.id.type === "Identifier") {
                symbols.push(decl.id.name);
              }
            }
          } else if (node.type === "FunctionDeclaration" && node.id) {
            symbols.push(node.id.name);
          }
          console.log({ symbols });
        }
        for (const symbol of symbols) {
          scriptContent = scriptContent + `\nwindow.${symbol} = ${symbol};\n`;
        }
        new Function(scriptContent)();
        console.log(window.handleSegment);
      }
      return cleanedSVG;
    } catch (error) {
      console.error("Error processing SVG:", error);
      return null;
    }
  }, [cleanedInnerHTML]);

  return isRVAPITable && tableBody ? (
    <CCP4i2RVAPITable iItem={props.iItem} item={tableBody} job={props.job} />
  ) : (
    <div
      dangerouslySetInnerHTML={{ __html: interactiveSVG || cleanedInnerHTML }}
    />
  );
};
