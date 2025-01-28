import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { PropsWithChildren, useEffect } from "react";
import { DeleteDialogProvider } from "./components/delete-dialog";
import theme from "./theme";
import MenuBar from "./components/menu-bar";
import { CCP4i2Context } from "./app-context";
import { Job, Project } from "./models";
import { CCP4i2App } from "./components/ccp4i2-app";

export const metadata = {
  title: "CCP4",
  description: "Software for Macromolecular X-Ray Crystallography",
};

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

export default function RootLayout(props: PropsWithChildren) {
  /* I am putting the loading of moorhen here, because (I think) the url here is "/" which allowsloading of "moorhen,js" which in turn loads "moorhen.wasm" */
  useEffect(() => {
    const asyncFunc = async () => {
      const a = await loadScript("/moorhen.js");
      scriptLoaded.current = true;
      //@ts-ignore
      console.log(window.Module);
    };
    asyncFunc();
  }, []);
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <DeleteDialogProvider>
              <CCP4i2App children={props.children} />
            </DeleteDialogProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
