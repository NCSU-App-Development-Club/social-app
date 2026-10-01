import { type Theme } from "expo-router";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { buildNavigationTheme } from "./build-theme";
import { resolveScheme, staticColors, type AppColors, type ColorScheme } from "./colors";

export type AppTheme = {
  scheme: ColorScheme;
  colors: AppColors;
  theme: Theme;
};

export function useAppTheme(): AppTheme {
  const scheme = resolveScheme(useColorScheme());

  return useMemo(() => {
    const colors = staticColors(scheme);
    return { scheme, colors, theme: buildNavigationTheme(colors) };
  }, [scheme]);
}
