import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MessagesStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { Conversation } from "@/types";

type MessagesScreenProps = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, "Messages">;
};

const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

export default function MessagesScreen({ navigation }: MessagesScreenProps) {
  const { theme } = useTheme();
  const { chatThreads, user } = useApp();

  // Convert chatThreads to conversation format
  const conversations = (chatThreads ?? []).map(thread => ({
    id: thread.id,
    taskId: thread.taskId,
    otherUserId: thread.posterId === user?.id ? thread.helperId : thread.posterId,
    otherUserName: thread.posterId === user?.id ? "Helper" : "Poster",
    otherUserAvatarIndex: 0,
    unreadCount: 0,
    lastMessageTime: thread.createdAt,
    taskTitle: "Ongoing Task",
    lastMessage: "No messages yet"
  }));

  const userConversations = conversations.filter(conv => 
    conv.otherUserId !== user?.id
  );

  const renderItem = ({ item }: { item: Conversation }) => (
    <Pressable
      onPress={() => navigation.navigate("Chat", { taskId: item.taskId, otherUserName: item.otherUserName })}
      style={({ pressed }) => [
        styles.conversationItem,
        { 
          backgroundColor: pressed ? theme.backgroundDefault : theme.backgroundRoot,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[item.otherUserAvatarIndex % 6] }]}>
        <ThemedText type="h4" style={styles.avatarText}>
          {item.otherUserName.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <ThemedText 
            type="body" 
            style={[styles.conversationName, item.unreadCount > 0 && styles.unread]}
            numberOfLines={1}
          >
            {item.otherUserName}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatTime(item.lastMessageTime)}
          </ThemedText>
        </View>
        <View style={styles.conversationPreview}>
          <ThemedText 
            type="caption" 
            style={[styles.taskTitle, { color: theme.primary }]}
            numberOfLines={1}
          >
            {item.taskTitle}
          </ThemedText>
        </View>
        <ThemedText 
          type="small" 
          style={[styles.lastMessage, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </ThemedText>
      </View>
      {item.unreadCount > 0 ? (
        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
          <ThemedText type="caption" style={styles.unreadBadgeText}>
            {item.unreadCount}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="message-circle" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No messages yet
      </ThemedText>
      <ThemedText type="body" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Messages will appear here when you have active tasks
      </ThemedText>
    </View>
  );

  return (
    <ScreenFlatList
      data={userConversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: -Spacing.xl,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  conversationName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  unread: {
    fontWeight: "700",
  },
  conversationPreview: {
    marginBottom: 2,
  },
  taskTitle: {
    fontWeight: "500",
  },
  lastMessage: {},
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  separator: {
    height: 1,
    marginLeft: 76,
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
