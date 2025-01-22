import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { PropsWithChildren } from "react";
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

export default function RootLayout(props: PropsWithChildren) {
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
