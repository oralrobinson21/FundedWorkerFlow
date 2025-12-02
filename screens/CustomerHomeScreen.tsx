import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { TaskCard } from "@/components/TaskCard";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import Spacer from "@/components/Spacer";
import { InfoBanner } from "@/components/InfoBanner";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { Task } from "@/types";

type CustomerHomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function CustomerHomeScreen({ navigation }: CustomerHomeScreenProps) {
  const { theme } = useTheme();
  const { user, tasks } = useApp();
  const [showBanner, setShowBanner] = useState(true);

  const myTasks = tasks.filter(task => task.posterId === user?.id);

  const renderItem = ({ item }: { item: Task }) => (
    <>
      <TaskCard
        task={item}
        isCustomerView={true}
        onPress={() => navigation.navigate("TaskDetail", { task: item })}
      />
      <Spacer height={Spacing.md} />
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="clipboard" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No tasks yet
      </ThemedText>
      <ThemedText type="body" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Post your first task and get help from nearby helpers
      </ThemedText>
      <Pressable
        onPress={() => navigation.navigate("CreateTask")}
        style={({ pressed }) => [
          styles.emptyButton,
          { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText type="body" style={styles.emptyButtonText}>
          Post a Task
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ScreenFlatList
      data={myTasks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={
        <View>
          {showBanner ? (
            <InfoBanner 
              variant="compact" 
              showDismiss 
              onDismiss={() => setShowBanner(false)}
              onLearnMore={() => navigation.navigate("Help")}
            />
          ) : null}
          {myTasks.length > 0 ? (
            <View style={styles.header}>
              <ThemedText type="h3">Your Tasks</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {myTasks.length} task{myTasks.length !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          ) : null}
        </View>
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
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
