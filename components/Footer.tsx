import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { EmailModal } from "@/components/EmailModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

const SUPPORT_EMAIL = "citytask@outlook.com";

interface FooterProps {
  showNavLinks?: boolean;
  onNavigateInvestors?: () => void;
  onNavigateContact?: () => void;
}

export function Footer({ showNavLinks, onNavigateInvestors, onNavigateContact }: FooterProps) {
  const { theme } = useTheme();
  const [emailModalVisible, setEmailModalVisible] = useState(false);

  const handleEmailPress = () => {
    setEmailModalVisible(true);
  };

  return (
    <View style={[styles.footer, { borderTopColor: theme.border }]}>
      {showNavLinks ? (
        <View style={styles.navLinks}>
          <Pressable onPress={onNavigateInvestors} style={styles.navLink}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              Investors
            </ThemedText>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable onPress={onNavigateContact} style={styles.navLink}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              Contact
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
      
      <Pressable onPress={handleEmailPress} style={styles.emailContainer}>
        <Feather name="mail" size={14} color={theme.textSecondary} />
        <ThemedText type="caption" style={[styles.email, { color: theme.textSecondary }]}>
          citytask@outlook.com
        </ThemedText>
      </Pressable>
      
      <ThemedText type="caption" style={[styles.copyright, { color: theme.textSecondary }]}>
        CityTasks 2025. All rights reserved.
      </ThemedText>

      <EmailModal
        visible={emailModalVisible}
        email={SUPPORT_EMAIL}
        onClose={() => setEmailModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
    alignItems: "center",
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  navLink: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  divider: {
    width: 1,
    height: 16,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  email: {
    textDecorationLine: "underline",
  },
  copyright: {
    opacity: 0.7,
  },
});
