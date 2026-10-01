import { type PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

export type ScreenProps = PropsWithChildren<{
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, edges, style }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
