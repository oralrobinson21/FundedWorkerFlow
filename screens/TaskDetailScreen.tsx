import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { Task, PLATFORM_FEE_PERCENT } from "@/types";

type TaskDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TaskDetail">;
  route: RouteProp<RootStackParamList, "TaskDetail">;
};

const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

export default function TaskDetailScreen({ navigation, route }: TaskDetailScreenProps) {
  const { task: initialTask } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, tasks, acceptTask, completeTask } = useApp();

  const task = tasks.find(t => t.id === initialTask.id) || initialTask;
  const isCustomer = user?.role === "customer";
  const isWorker = user?.role === "worker";
  const isMyTask = task.customerId === user?.id || task.workerId === user?.id;

  const handleAcceptJob = () => {
    Alert.alert(
      "Accept Job",
      `Accept "${task.title}" for $${task.price.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            await acceptTask(task.id);
            Alert.alert("Job Accepted", "You can now message the customer.");
          },
        },
      ]
    );
  };

  const handleCompleteTask = () => {
    Alert.alert(
      "Mark as Complete",
      "Confirm that this task has been completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            await completeTask(task.id);
            Alert.alert("Task Completed", "Payment will be released to the helper.");
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    const otherUserName = isCustomer ? task.workerName : task.customerName;
    if (otherUserName) {
      navigation.navigate("Chat", { taskId: task.id, otherUserName });
    }
  };

  const handleGoToPayment = () => {
    navigation.navigate("Payment", { task });
  };

  const getStatusBannerStyle = () => {
    switch (task.status) {
      case "paid_waiting":
        return { backgroundColor: theme.funded, borderColor: theme.fundedText };
      case "assigned":
        return { backgroundColor: theme.assigned, borderColor: theme.assignedText };
      case "completed":
        return { backgroundColor: theme.completed, borderColor: theme.completedText };
      default:
        return { backgroundColor: theme.backgroundDefault, borderColor: theme.textSecondary };
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case "unpaid":
        return "Payment Required";
      case "paid_waiting":
        return "Funded - Waiting for helper";
      case "assigned":
        return "Helper assigned";
      case "completed":
        return "Completed";
      default:
        return task.status;
    }
  };

  const workerEarnings = task.price * (1 - PLATFORM_FEE_PERCENT);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h4" numberOfLines={1} style={styles.headerTitle}>
          Task Details
        </ThemedText>
        <View style={styles.headerButton} />
      </View>

      <ScreenScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusBanner, getStatusBannerStyle()]}>
          <StatusBadge status={task.status} />
          <ThemedText type="small" style={{ color: getStatusBannerStyle().borderColor }}>
            {getStatusText()}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h3" style={styles.taskTitle}>{task.title}</ThemedText>
          
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {task.neighborhood}
            </ThemedText>
          </View>
          
          <View style={styles.metaRow}>
            <Feather name="clock" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {task.timeWindow}
            </ThemedText>
          </View>

          <View style={[styles.priceContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              ${task.price.toFixed(2)}
            </ThemedText>
            {isWorker ? (
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                You'll earn ${workerEarnings.toFixed(2)}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>Description</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {task.description}
          </ThemedText>
        </View>

        {(task.status === "assigned" || task.status === "completed") && task.workerName ? (
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {isCustomer ? "Helper" : "Customer"}
            </ThemedText>
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[Math.floor(Math.random() * 6)] }]}>
                <ThemedText type="body" style={styles.avatarText}>
                  {(isCustomer ? task.workerName : task.customerName)?.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.userInfo}>
                <ThemedText type="body">
                  {isCustomer ? task.workerName : task.customerName}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {isCustomer ? "Your helper" : "Task owner"}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={theme.primary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
            {isWorker
              ? "Payment is held securely and released to you once the customer confirms completion."
              : "Your payment is held securely until you confirm the task is complete."}
          </ThemedText>
        </View>
      </ScreenScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {task.status === "unpaid" && isCustomer && isMyTask ? (
          <Pressable
            onPress={handleGoToPayment}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Feather name="credit-card" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.actionButtonText}>
              Pay & Post Task
            </ThemedText>
          </Pressable>
        ) : null}

        {task.status === "paid_waiting" && isWorker && !isMyTask ? (
          <Pressable
            onPress={handleAcceptJob}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Feather name="check-circle" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.actionButtonText}>
              Accept This Job
            </ThemedText>
          </Pressable>
        ) : null}

        {task.status === "assigned" && isMyTask ? (
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="message-circle" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
                Message
              </ThemedText>
            </Pressable>
            
            {isCustomer ? (
              <Pressable
                onPress={handleCompleteTask}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.success, opacity: pressed ? 0.9 : 1, flex: 1 },
                ]}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
                <ThemedText type="body" style={styles.actionButtonText}>
                  Mark Complete
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {task.status === "completed" ? (
          <View style={[styles.completedBanner, { backgroundColor: theme.success + "15" }]}>
            <Feather name="check-circle" size={24} color={theme.success} />
            <ThemedText type="body" style={{ color: theme.success, fontWeight: "600" }}>
              Task Completed Successfully
            </ThemedText>
          </View>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerButton: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  content: {
    paddingTop: 0,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  taskTitle: {
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  priceContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  userInfo: {
    marginLeft: Spacing.md,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  actionButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  secondaryButton: {
    height: Spacing.buttonHeight,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
