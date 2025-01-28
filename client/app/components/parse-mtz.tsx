"use client";
import { DialogContent } from "@mui/material";
import SimpleDialog from "@mui/material/Dialog";
import { useEffect, useState } from "react";

async function getWasm() {
  try {
    const res = await fetch("/moorhen.js");
    // bytes from memory
    const buffer = await res.arrayBuffer();
    // this will create an object
    // WebAssembly is part of window api. so make sure you are on client side.
    const wasm = await WebAssembly.instantiate(buffer);
    console.log(wasm.instance.exports);
    // this is the method defined in wasm code
    // you need to know what methods are defined in your source code
  } catch (e) {
    console.log(e);
  }
}

const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error("Failed to load script: " + src));
    document.head.appendChild(script);
  });
};

interface ParseMtzProps {
  file: File | null;
  setFile: (file: File | null) => void;
}

export const ParseMtz: React.FC<ParseMtzProps> = ({ file, setFile }) => {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const asyncFunc = async () => {
      loadScript("/moorhen.js").then((src) => {
        console.log(src + " loaded 32-bit successfully (fallback).");
        window
          .createCootModule({
            print(t) {
              console.log(["output", t]);
            },
            printErr(t) {
              console.log(["output", t]);
            },
          })
          .then((returnedModule) => {
            window.cootModule = returnedModule;
            window.CCP4Module = returnedModule;
            const cootModuleAttachedEvent = new CustomEvent(
              "cootModuleAttached",
              {}
            );
            document.dispatchEvent(cootModuleAttachedEvent);
            setText(JSON.stringify(Object.keys(returnedModule)));
          })
          .catch((e) => {
            console.log(e);
          });
      });
    };
    asyncFunc();
  }, [file]);
  return (
    <SimpleDialog
      open={file != null}
      onClose={() => {
        setFile(null);
      }}
    >
      <DialogContent>{text}</DialogContent>
    </SimpleDialog>
  );
};
