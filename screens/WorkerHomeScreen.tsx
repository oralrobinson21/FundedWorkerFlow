import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { TaskCard } from "@/components/TaskCard";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { Task } from "@/types";

type WorkerHomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function WorkerHomeScreen({ navigation }: WorkerHomeScreenProps) {
  const { theme } = useTheme();
  const { tasks } = useApp();

  const availableTasks = tasks.filter(task => task.status === "paid_waiting");

  const renderItem = ({ item }: { item: Task }) => (
    <>
      <TaskCard
        task={item}
        isCustomerView={false}
        onPress={() => navigation.navigate("TaskDetail", { task: item })}
      />
      <Spacer height={Spacing.md} />
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="search" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No jobs available
      </ThemedText>
      <ThemedText type="body" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Check back soon for new funded jobs in your area
      </ThemedText>
    </View>
  );

  return (
    <ScreenFlatList
      data={availableTasks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={
        availableTasks.length > 0 ? (
          <View style={styles.header}>
            <ThemedText type="h3">Available Jobs</ThemedText>
            <View style={[styles.countBadge, { backgroundColor: theme.funded }]}>
              <ThemedText type="caption" style={{ color: theme.fundedText, fontWeight: "600" }}>
                {availableTasks.length} funded
              </ThemedText>
            </View>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  countBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
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
