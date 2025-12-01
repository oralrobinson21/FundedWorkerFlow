import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { PLATFORM_FEE_PERCENT } from "@/types";

const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, tasks, logout, switchRole } = useApp();

  const isWorker = user?.role === "worker";
  
  const completedTasks = isWorker
    ? tasks.filter(task => task.workerId === user?.id && task.status === "completed")
    : tasks.filter(task => task.customerId === user?.id && task.status === "completed");

  const totalEarnings = isWorker
    ? completedTasks.reduce((sum, task) => sum + task.price * (1 - PLATFORM_FEE_PERCENT), 0)
    : completedTasks.reduce((sum, task) => sum + task.price * (1 + PLATFORM_FEE_PERCENT), 0);

  const handleSwitchRole = () => {
    Alert.alert(
      "Switch Role",
      `Switch to ${isWorker ? "Customer" : "Helper"} mode?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Switch", onPress: switchRole },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout },
      ]
    );
  };

  const avatarColor = user ? AVATAR_COLORS[user.avatarIndex % 6] : AVATAR_COLORS[0];

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <ThemedText type="h1" style={styles.avatarText}>
            {user?.name.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </View>
        <ThemedText type="h2" style={styles.name}>
          {user?.name || "User"}
        </ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: isWorker ? theme.secondary : theme.primary }]}>
          <Feather name={isWorker ? "tool" : "briefcase"} size={14} color="#FFFFFF" />
          <ThemedText type="caption" style={styles.roleBadgeText}>
            {isWorker ? "Helper" : "Customer"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {completedTasks.length}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {isWorker ? "Jobs Done" : "Tasks Posted"}
          </ThemedText>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h2" style={{ color: theme.primary }}>
            ${totalEarnings.toFixed(0)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {isWorker ? "Earned" : "Spent"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Account
        </ThemedText>
        
        <Pressable
          onPress={handleSwitchRole}
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: pressed ? theme.backgroundDefault : theme.backgroundRoot },
          ]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: theme.secondary + "20" }]}>
            <Feather name="repeat" size={20} color={theme.secondary} />
          </View>
          <View style={styles.menuContent}>
            <ThemedText type="body">Switch to {isWorker ? "Customer" : "Helper"}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {isWorker ? "Post tasks and get help" : "Accept jobs and earn money"}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: pressed ? theme.backgroundDefault : theme.backgroundRoot },
          ]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="credit-card" size={20} color={theme.primary} />
          </View>
          <View style={styles.menuContent}>
            <ThemedText type="body">Payment Methods</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Manage your cards
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Settings
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: pressed ? theme.backgroundDefault : theme.backgroundRoot },
          ]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: theme.textSecondary + "20" }]}>
            <Feather name="bell" size={20} color={theme.textSecondary} />
          </View>
          <ThemedText type="body" style={styles.menuText}>Notifications</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: pressed ? theme.backgroundDefault : theme.backgroundRoot },
          ]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: theme.textSecondary + "20" }]}>
            <Feather name="help-circle" size={20} color={theme.textSecondary} />
          </View>
          <ThemedText type="body" style={styles.menuText}>Help & Support</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: pressed ? theme.backgroundDefault : theme.backgroundRoot },
          ]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: theme.textSecondary + "20" }]}>
            <Feather name="shield" size={20} color={theme.textSecondary} />
          </View>
          <ThemedText type="body" style={styles.menuText}>Privacy Policy</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          { backgroundColor: theme.error + "15", opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Feather name="log-out" size={20} color={theme.error} />
        <ThemedText type="body" style={[styles.logoutText, { color: theme.error }]}>
          Log Out
        </ThemedText>
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 40,
  },
  name: {
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: -Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  separator: {
    height: 1,
    marginLeft: 56,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    fontWeight: "600",
  },
});
