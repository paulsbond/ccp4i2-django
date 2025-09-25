import "./globals.css";
import { ThemeProvider } from "@mui/material/styles";
import { PropsWithChildren } from "react";
import { DeleteDialogProvider } from "../providers/delete-dialog";
import theme from "../theme";
import { CCP4i2App } from "../providers/ccp4i2-app";
import AuthProvider from "../components/msal/auth-provider";
import { ProtectedCCP4i2App } from "../components/msal/protected-ccp4-app";
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
            <AuthProvider>
              <ProtectedCCP4i2App>{props.children}</ProtectedCCP4i2App>
            </AuthProvider>
          </DeleteDialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
