"use client";
import { DialogContent } from "@mui/material";
import SimpleDialog from "@mui/material/Dialog";
import { useEffect, useRef, useState } from "react";

const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
    const originScript = document.createElement("script");
    originScript.text =
      "if (!crossOriginIsolated) SharedArrayBuffer = ArrayBuffer;";
    originScript.onload = () => resolve(src);
    originScript.onerror = () =>
      reject(new Error("Failed to load crossOriginIsolated text script: "));
    document.head.appendChild(originScript);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error("Failed to load script: " + src));
    document.head.appendChild(script);
  });
};

interface ParseMtzProps {
  fileContent: ArrayBuffer | null;
  setFileContent: (file: ArrayBuffer | null) => void;
}

export const ParseMtz: React.FC<ParseMtzProps> = ({
  fileContent,
  setFileContent,
}) => {
  const [text, setText] = useState<string | null>(null);
  const scriptLoaded = useRef<boolean>(false);

  useEffect(() => {
    const asyncFunc = async () => {
      //@ts-ignore
      if (!window.Module) {
        const a = await loadScript("/convert.js");
        scriptLoaded.current = true;
        //@ts-ignore
        console.log(window.Module);
      }
      if (fileContent && fileContent.byteLength) {
        const arr = new Uint8Array(fileContent);
        const buffer = window.Module._malloc(arr.byteLength); // to be free'd in convert.js
        window.Module.writeArrayToMemory(arr, buffer);
        const ret = window.Module._mtz2cif(buffer, arr.byteLength);
        const size = window.Module._get_global_str_size();
        const bufarray = new Int8Array(window.Module.HEAP8.buffer, ret, size);
        const cifString = new TextDecoder("utf-8").decode(bufarray);
        const text = cifString
          .replace(/\r/g, "\n")
          .replace(/\n\n/g, "\n")
          .split("\n")
          .filter((line: string) => line.startsWith("# __"))
          .join("\n");
        console.log({ text });
        setText(text);
      }
    };
    asyncFunc();
  }, [fileContent]);
  return (
    <SimpleDialog
      open={fileContent != null}
      onClose={() => {
        setFileContent(null);
      }}
    >
      <DialogContent>{text}</DialogContent>
    </SimpleDialog>
  );
};
