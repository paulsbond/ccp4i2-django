import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { PropsWithChildren } from "react";
import theme from "./theme";

export const metadata = {
  title: "CCP4",
  description: "Software for Macromolecular X-Ray Crystallography",
};

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
