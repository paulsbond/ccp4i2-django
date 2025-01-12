"use client";
import { Roboto } from "next/font/google";
import { createTheme } from "@mui/material/styles";
import { bottomNavigationActionClasses } from "@mui/material";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  components: {
    MuiTooltip: {
      defaultProps: {
        disableInteractive: true,
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(to bottom, #FFFFFF,rgb(230, 230, 230))",
          color: "black",
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
    },
  },
});

export default theme;
