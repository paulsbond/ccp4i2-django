import { ThemeProvider } from "@mui/material/styles";
import { PropsWithChildren } from "react";
import { DeleteDialogProvider } from "../contexts/delete-dialog";
import theme from "../theme";
import { CCP4i2App } from "../contexts/ccp4i2-app";
export const metadata = {
  title: "CCP4",
  description: "Software for Macromolecular X-Ray Crystallography",
};

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <DeleteDialogProvider>
            <CCP4i2App children={props.children} />
          </DeleteDialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
