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
  palette: {
    success: { main: "rgb(64, 123, 67)", light: "rgb(112, 173, 114)" },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  components: {
    MuiTooltip: {
      defaultProps: {
        disableInteractive: true,
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: "head" },
              style: {
                backgroundColor: "rgb(123, 198, 219)",
                paddingTop: 0,
                paddingBottom: 0,
              },
            },
            {
              props: { variant: "body" },
              style: {
                paddingTop: 0,
                paddingBottom: 0,
              },
            },
          ],
        },
      },
      defaultProps: {
        variant: "body", // Default variant if none is specified
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: "primary" },
              style: ({ theme }) => ({
                py: 0,
                my: 0,
                fontWeight: "bold",
                backgroundColor: theme.palette.primary.main, // Use the primary color
                color: theme.palette.primary.contrastText,
              }),
            },
            {
              props: { variant: "secondary" },
              style: ({ theme }) => ({
                py: 0,
                my: 0,
                fontWeight: "bolder",
                color: "rgb(34, 97, 124)",
              }),
            },
          ],
        },
      },
      defaultProps: {
        disableTypography: false,
        titleTypographyProps: {
          variant: "n6",
        },
        subheaderTypographyProps: {
          variant: "subtitle2",
        },
        variant: "secondary",
      },
    },
  },
});

export default theme;
