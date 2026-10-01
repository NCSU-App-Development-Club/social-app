import type { ColorSchemeName } from "react-native";

export type ColorScheme = "light" | "dark";

export type AppColors = {
  scheme: ColorScheme;
  primary: string;
  onPrimary: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceTint: string;
  card: string;
  text: string;
  border: string;
  notification: string;
};

export const lightColors: AppColors = {
  scheme: "light",
  primary: "#6750A4",
  onPrimary: "#FFFFFF",
  background: "#FFFBFE",
  onBackground: "#1C1B1F",
  surface: "#FFFBFE",
  onSurface: "#1C1B1F",
  surfaceTint: "#6750A4",
  card: "#F3EDF7",
  text: "#1C1B1F",
  border: "#79747E",
  notification: "#B3261E",
};

export const darkColors: AppColors = {
  scheme: "dark",
  primary: "#D0BCFF",
  onPrimary: "#381E72",
  background: "#1C1B1F",
  onBackground: "#E6E1E5",
  surface: "#1C1B1F",
  onSurface: "#E6E1E5",
  surfaceTint: "#D0BCFF",
  card: "#211F26",
  text: "#E6E1E5",
  border: "#938F99",
  notification: "#F2B8B5",
};

export function resolveScheme(colorScheme: ColorSchemeName): ColorScheme {
  return colorScheme === "dark" ? "dark" : "light";
}

export function staticColors(scheme: ColorScheme): AppColors {
  return scheme === "dark" ? darkColors : lightColors;
}
