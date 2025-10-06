import "./globals.css";
import { ThemeProvider } from "@mui/material/styles";
import { PropsWithChildren } from "react";
import { DeleteDialogProvider } from "../providers/delete-dialog";
import theme from "../theme";
import { CCP4i2App } from "../providers/ccp4i2-app";
import AuthProvider from "../components/auth-provider";
import RequireAuth from "../components/require-auth";
export const metadata = {
  title: "CCP4",
  description: "Software for Macromolecular X-Ray Crystallography",
};

const REQUIRE_AUTH = process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true';

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        {REQUIRE_AUTH ? (
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <DeleteDialogProvider>
                <RequireAuth>
                  <CCP4i2App>{props.children}</CCP4i2App>
                </RequireAuth>
              </DeleteDialogProvider>
            </ThemeProvider>
          </AuthProvider>
        ) : (
          <ThemeProvider theme={theme}>
            <DeleteDialogProvider>
              <CCP4i2App>{props.children}</CCP4i2App>
            </DeleteDialogProvider>
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
