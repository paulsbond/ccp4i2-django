import "./globals.css";
import { ThemeProvider } from "@mui/material/styles";
import { PropsWithChildren } from "react";
import { DeleteDialogProvider } from "../providers/delete-dialog";
import theme from "../theme";
import { CCP4i2App } from "../providers/ccp4i2-app";
import AuthProvider from "../components/auth-provider";
import { ProtectedCCP4i2App } from "../components/protected-ccp4-app";
export const metadata = {
  title: "CCP4",
  description: "Software for Macromolecular X-Ray Crystallography",
};

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <DeleteDialogProvider>
              <ProtectedCCP4i2App>{props.children}</ProtectedCCP4i2App>
            </DeleteDialogProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
