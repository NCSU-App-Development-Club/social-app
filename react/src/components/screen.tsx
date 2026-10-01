import { type PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useAppTheme } from "@/theme/use-app-theme";

export type ScreenProps = PropsWithChildren<{
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, edges, style }: ScreenProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.screen, { backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
