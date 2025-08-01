"use client";
import { createTheme, ThemeOptions } from "@mui/material/styles";
import { paletteOptions } from './palette';
import { typographyOptions } from './typography';
import { createComponentVariants } from './variants';

// Base theme configuration
const baseThemeOptions: ThemeOptions = {
  palette: paletteOptions,
  typography: typographyOptions,
};

// Create the base theme first
const baseTheme = createTheme(baseThemeOptions);

// Create the final theme with component variants
export const theme = createTheme({
  ...baseTheme,
  components: createComponentVariants(baseTheme),
});

export default theme;
