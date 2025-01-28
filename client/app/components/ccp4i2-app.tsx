"use client";
import { PropsWithChildren, useEffect, useState } from "react";
import { CCP4i2Context } from "../app-context";
import { CssBaseline } from "@mui/material";
import MenuBar from "./menu-bar";

const loadScript = async (src: string) => {
  //The semi magical ShaerdArrayBuffer line
  const originScript = document.createElement("script");
  originScript.text =
    "if (!crossOriginIsolated) SharedArrayBuffer = ArrayBuffer;";
  document.head.appendChild(originScript);
  // and now the moorhen.js, redirecting from moorhen.wasm to /moorhen.wasm
  const scriptString = await fetch(src, { credentials: "same-origin" }).then(
    (response) => response.text()
  );
  const script = document.createElement("script");
  script.text = scriptString.replace("moorhen.wasm", "/moorhen.wasm");
  document.head.appendChild(script);
  return Promise.resolve(src);
};

const createArgs = {
  print(t: string) {
    console.log(["output", t]);
  },
  printErr(t: string) {
    console.error(["output", t]);
  },
};

const loadMoorhen = async (moorhenJs: string) => {
  const src = await loadScript(moorhenJs);
  console.log(`${src} - loaded ${moorhenJs}`);
  let returnedModule;
  if (moorhenJs.includes("64")) {
    returnedModule = await createCoot64Module(createArgs);
  } else {
    returnedModule = await createCootModule(createArgs);
  }
  try {
    console.log({ returnedModule });
    window.cootModule = returnedModule;
    window.CCP4Module = returnedModule;
    const cootModuleAttachedEvent = new CustomEvent("cootModuleAttached", {});
    document.dispatchEvent(cootModuleAttachedEvent);
  } catch (e) {
    console.log(e);
    console.log("There was a problem creating Coot64Module...");
  }
};

export const CCP4i2App = (props: PropsWithChildren) => {
  const [projectId, setProjectId] = useState<Number | null>(null);
  const [jobId, setJobId] = useState<Number | null>(null);

  /* I am putting the loading of moorhen here, because (I think) the url here is "/" which allowsloading of "moorhen,js" which in turn loads "moorhen.wasm" */
  useEffect(() => {
    const asyncFunc = async () => {
      const memory64 = WebAssembly.validate(
        new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 5, 3, 1, 4, 1])
      );
      loadMoorhen("/moorhen.js");
      /*
      if (memory64) {
        try {
          loadMoorhen("/moorhen64.js");
        } catch (error) {
          loadMoorhen("/moorhen.js");
        }
      } else {
        loadMoorhen("/moorhen.js");
      }
        */
    };
    asyncFunc();
  }, []);

  return (
    <CCP4i2Context.Provider
      value={{ projectId, setProjectId, jobId, setJobId }}
    >
      <CssBaseline />
      <MenuBar />
      {props.children}
    </CCP4i2Context.Provider>
  );
};
