import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function SignedInBanner() {
  const { theme } = useTheme();
  const { isHelperMode } = useApp();
  
  const roleColor = isHelperMode ? theme.secondary : theme.primary;
  const roleText = isHelperMode ? "Task Helper" : "Task Poster";
  const roleIcon = isHelperMode ? "briefcase" : "clipboard";
  
  return (
    <View style={[styles.container, { backgroundColor: roleColor + "15", borderColor: roleColor + "30" }]}>
      <Feather name={roleIcon as any} size={16} color={roleColor} />
      <ThemedText type="caption" style={[styles.text, { color: roleColor }]}>
        {roleText} Account
      </ThemedText>
      <Feather name="lock" size={12} color={roleColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  text: {
    fontWeight: "600",
  },
});
