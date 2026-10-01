import { getMaterialColors } from "@expo/ui/jetpack-compose";
import { type Theme } from "expo-router";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { buildNavigationTheme } from "./build-theme";
import { resolveScheme, type AppColors, type ColorScheme } from "./colors";

export type AppTheme = {
  scheme: ColorScheme;
  colors: AppColors;
  theme: Theme;
};

export function useAppTheme(): AppTheme {
  const scheme = resolveScheme(useColorScheme());

  return useMemo(() => {
    const material = getMaterialColors({ scheme });

    const colors: AppColors = {
      scheme,
      primary: material.primary,
      onPrimary: material.onPrimary,
      background: material.background,
      onBackground: material.onBackground,
      surface: material.surface,
      onSurface: material.onSurface,
      surfaceTint: material.surfaceTint,
      card: material.surfaceContainer,
      text: material.onBackground,
      border: material.outlineVariant,
      notification: material.error,
    };

    return { scheme, colors, theme: buildNavigationTheme(colors) };
  }, [scheme]);
}
