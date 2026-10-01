import { DarkTheme, DefaultTheme, type Theme } from "expo-router";

import type { AppColors } from "./colors";

export function buildNavigationTheme(colors: AppColors): Theme {
  const base = colors.scheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: colors.scheme === "dark",
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.notification,
    },
  };
}
