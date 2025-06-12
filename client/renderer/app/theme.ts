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
    success: { main: "rgb(70, 164, 75)", light: "rgb(193, 226, 214)" },
    primary: {
      main: "rgb(123, 198, 219)",
      dark: "rgb(71, 113, 125)",
      contrastText: "rgb(0, 0, 0)",
    },
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
    MuiTextField: {
      styleOverrides: {
        root: {
          marginTop: "0.5rem", // Add a gap of 0.5rem at the top
          marginBottom: "0.5rem",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          marginTop: "0.5rem", // Add a gap of 0.5rem at the top
          marginBottom: "0.5rem",
        },
      },
    },
    MuiIcon: { styleOverrides: { root: { mx: 0, my: 0 } } },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: "primary" },
              defaultProps: {
                disableTypography: false,
                titleTypographyProps: {
                  variant: "body1",
                },
                subheaderTypographyProps: {
                  variant: "subtitle2",
                },
              },
              style: ({ theme }) => ({
                paddingTop: theme.spacing(0.5),
                paddingBottom: theme.spacing(0.5),
                fontWeight: "bold",
                backgroundColor: theme.palette.primary.main, // Use the primary color
                color: theme.palette.primary.contrastText,
              }),
            },
            {
              props: { variant: "secondary" },
              defaultProps: {
                disableTypography: false,
                titleTypographyProps: {
                  variant: "body1",
                },
                subheaderTypographyProps: {
                  variant: "subtitle2",
                },
              },
              style: ({ theme }) => ({
                paddingTop: theme.spacing(0.5),
                paddingBottom: theme.spacing(0.5),
                fontWeight: "bolder",
                color: "theme.palette.primary.dark",
              }),
            },
          ],
        },
      },
      defaultProps: {
        disableTypography: false,
        titleTypographyProps: {
          variant: "body1",
        },
        subheaderTypographyProps: {
          variant: "subtitle2",
        },
        //@ts-ignore
        variant: "secondary",
      },
    },
  },
});

export default theme;
