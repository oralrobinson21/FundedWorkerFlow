import React from "react";
import { View, StyleSheet, SectionList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TaskCard } from "@/components/TaskCard";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { Task, PLATFORM_FEE_PERCENT } from "@/types";

type ActivityScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

interface Section {
  title: string;
  data: Task[];
}

export default function ActivityScreen({ navigation }: ActivityScreenProps) {
  const { theme } = useTheme();
  const { user, tasks } = useApp();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const isWorker = user?.role === "worker";

  const relevantTasks = isWorker
    ? tasks.filter(task => task.workerId === user?.id)
    : tasks.filter(task => task.customerId === user?.id);

  const activeTasks = relevantTasks.filter(
    task => task.status === "assigned" || task.status === "paid_waiting"
  );
  const completedTasks = relevantTasks.filter(task => task.status === "completed");

  const sections: Section[] = [];
  if (activeTasks.length > 0) {
    sections.push({ title: "Active", data: activeTasks });
  }
  if (completedTasks.length > 0) {
    sections.push({ title: "Completed", data: completedTasks });
  }

  const totalEarnings = isWorker
    ? completedTasks.reduce((sum, task) => sum + task.price * (1 - PLATFORM_FEE_PERCENT), 0)
    : 0;

  const renderItem = ({ item }: { item: Task }) => (
    <>
      <TaskCard
        task={item}
        isCustomerView={!isWorker}
        onPress={() => navigation.navigate("TaskDetail", { task: item })}
      />
      <Spacer height={Spacing.md} />
    </>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundRoot }]}>
      <ThemedText type="h4">{section.title}</ThemedText>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {section.data.length} task{section.data.length !== 1 ? "s" : ""}
      </ThemedText>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="activity" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No activity yet
      </ThemedText>
      <ThemedText type="body" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {isWorker
          ? "Jobs you accept will appear here"
          : "Tasks you post will appear here"}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {isWorker && completedTasks.length > 0 ? (
        <View style={[styles.earningsCard, { backgroundColor: theme.primary, marginTop: headerHeight + Spacing.xl }]}>
          <View>
            <ThemedText type="small" style={styles.earningsLabel}>
              Total Earnings
            </ThemedText>
            <ThemedText type="h1" style={styles.earningsAmount}>
              ${totalEarnings.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.earningsIcon}>
            <Feather name="trending-up" size={32} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      ) : null}
      
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingTop: isWorker && completedTasks.length > 0 ? Spacing.lg : headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        stickySectionHeadersEnabled={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  earningsCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsLabel: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  earningsAmount: {
    color: "#FFFFFF",
  },
  earningsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["3xl"],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
