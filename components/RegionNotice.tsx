import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface RegionNoticeProps {
  variant?: "inline" | "card";
}

export function RegionNotice({ variant = "card" }: RegionNoticeProps) {
  const { theme } = useTheme();

  if (variant === "inline") {
    return (
      <View style={styles.inlineContainer}>
        <Feather name="map-pin" size={12} color={theme.textSecondary} />
        <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
          Starting in NYC metro - the more you post, the faster we grow into new areas!
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.secondary + "10", borderColor: theme.secondary + "30" }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.secondary }]}>
        <Feather name="map-pin" size={16} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          Starting in NYC Metro - Growing Fast!
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          We're launching in the New York metro area and expanding quickly. The more tasks you post, the faster we grow into your neighborhood! Post a task today and help us reach new areas.
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.primary, marginTop: Spacing.xs, fontWeight: "500" }}>
          Add photos to your tasks for better matches!
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
});
