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
  const { user, userMode, tasks, chatThreads, completeTask, sendOffer, hasProfilePhoto } = useApp();

  const allTasks = tasks ?? [];
  const allThreads = chatThreads ?? [];
  
  const task = allTasks.find(t => t.id === initialTask.id) || initialTask;
  const isPoster = task.posterId === user?.id;
  const isHelper = task.helperId === user?.id;
  const isMyTask = isPoster || isHelper;

  const handleSendOffer = async () => {
    const hasPhoto = await hasProfilePhoto();
    if (!hasPhoto) {
      Alert.alert(
        "Profile Photo Required",
        "Please add a profile photo before sending offers. This helps build trust with posters.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Add Photo", 
            onPress: () => navigation.navigate("MainTabs", { screen: "Profile" } as any) 
          },
        ]
      );
      return;
    }
    
    Alert.alert(
      "Send an Offer",
      `Would you like to offer your help for "${task.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Offer",
          onPress: async () => {
            try {
              await sendOffer(task.id, "I'd like to help with this task!");
              Alert.alert("Offer Sent", "The poster will review your offer.");
            } catch (err) {
              Alert.alert("Error", "Failed to send offer. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleMarkJobDone = () => {
    navigation.navigate("CompletionPhoto", { task });
  };

  const handleApproveWork = () => {
    navigation.navigate("Approval", { task });
  };

  const handleMessage = () => {
    const thread = allThreads.find(t => t.taskId === task.id);
    if (!thread) {
      Alert.alert("No Chat Available", "A chat thread will be created once a helper is chosen and payment is complete.");
      return;
    }
    const otherUserName = isPoster ? (task.helperName || "Helper") : (task.posterName || "Poster");
    navigation.navigate("Chat", { threadId: thread.id, taskId: task.id, otherUserName });
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
      case "worker_marked_done":
        return "Waiting for approval";
      case "completed":
        return "Completed";
      case "disputed":
        return "Disputed";
      default:
        return task.status;
    }
  };

  const helperEarnings = task.price * (1 - PLATFORM_FEE_PERCENT);

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
              {task.areaDescription || task.zipCode || "Location not specified"}
            </ThemedText>
          </View>
          
          {(task.status === "assigned" || task.status === "worker_marked_done" || task.status === "completed") && task.fullAddress && isHelper ? (
            <View style={[styles.metaRow, { marginTop: Spacing.sm, backgroundColor: theme.backgroundSecondary, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm }]}>
              <Feather name="lock" size={14} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 2 }}>
                  Exact address (accepted helper only)
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.text, fontWeight: "500" }}>
                  {task.fullAddress}
                </ThemedText>
              </View>
            </View>
          ) : null}
          
          <View style={styles.metaRow}>
            <Feather name="tag" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {task.category}
            </ThemedText>
          </View>

          <View style={[styles.priceContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              ${task.price.toFixed(2)}
            </ThemedText>
            {isHelper ? (
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                You'll earn ${helperEarnings.toFixed(2)}
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

        {isPoster && task.fullAddress ? (
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>Full Address</ThemedText>
            <ThemedText type="body" style={{ color: theme.text, fontWeight: "500" }}>
              {task.fullAddress}
            </ThemedText>
          </View>
        ) : null}

        {(task.status === "assigned" || task.status === "completed") && task.helperName ? (
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {isPoster ? "Helper" : "Poster"}
            </ThemedText>
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[Math.floor(Math.random() * 6)] }]}>
                <ThemedText type="body" style={styles.avatarText}>
                  {(isPoster ? task.helperName : task.posterName)?.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.userInfo}>
                <ThemedText type="body">
                  {isPoster ? task.helperName : task.posterName}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {isPoster ? "Your helper" : "Task owner"}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={theme.primary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
            {isHelper
              ? "Payment is held securely and released to you once the poster confirms completion."
              : "Your payment is held securely until you confirm the task is complete."}
          </ThemedText>
        </View>
      </ScreenScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {task.status === "unpaid" && isPoster && isMyTask ? (
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

        {task.status === "paid_waiting" && userMode === "helper" && !isMyTask ? (
          <Pressable
            onPress={handleSendOffer}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.actionButtonText}>
              Send Offer
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
            
            {isPoster ? (
              <Pressable
                onPress={handleApproveWork}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.success, opacity: pressed ? 0.9 : 1, flex: 1 },
                ]}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
                <ThemedText type="body" style={styles.actionButtonText}>
                  Awaiting Completion
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleMarkJobDone}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1, flex: 1 },
                ]}
              >
                <Feather name="camera" size={20} color="#FFFFFF" />
                <ThemedText type="body" style={styles.actionButtonText}>
                  Mark Done
                </ThemedText>
              </Pressable>
            )}
          </View>
        ) : null}

        {task.status === "worker_marked_done" && isPoster && isMyTask ? (
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

            <Pressable
              onPress={handleApproveWork}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <Feather name="eye" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={styles.actionButtonText}>
                Review Work
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {task.status === "disputed" && isMyTask ? (
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <Feather name="message-circle" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={styles.actionButtonText}>
                Discuss with {isPoster ? "Helper" : "Poster"}
              </ThemedText>
            </Pressable>
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
