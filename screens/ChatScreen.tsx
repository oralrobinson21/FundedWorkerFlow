import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MessagesStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { ChatMessage } from "@/types";

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, "Chat">;
  route: RouteProp<MessagesStackParamList, "Chat">;
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const { taskId, otherUserName } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, chatThreads, chatMessages, sendChatMessage } = useApp();

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Find the thread for this task
  const thread = chatThreads.find(t => t.taskId === taskId);
  const threadId = thread?.id || "";
  
  // Get messages for this thread
  const messages = threadId ? (chatMessages[threadId] || []) : [];

  useEffect(() => {
    navigation.setOptions({
      title: otherUserName,
    });
  }, [navigation, otherUserName]);

  const handleSend = async () => {
    if (!inputText.trim() || !threadId) return;
    
    const messageText = inputText.trim();
    setInputText("");
    
    try {
      await sendChatMessage(threadId, messageText);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const showTimestamp = index === 0 || 
      new Date(item.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000;

    return (
      <View style={styles.messageWrapper}>
        {showTimestamp ? (
          <ThemedText type="caption" style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTime(item.createdAt)}
          </ThemedText>
        ) : null}
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? [styles.myMessage, { backgroundColor: theme.primary }]
              : [styles.otherMessage, { backgroundColor: theme.backgroundDefault }],
          ]}
        >
          {item.imageUrl ? (
            <ThemedText type="body" style={[styles.messageText, { color: isMyMessage ? "#FFFFFF" : theme.text }]}>
              [Image attached]
            </ThemedText>
          ) : null}
          {item.text ? (
            <ThemedText
              type="body"
              style={[
                styles.messageText,
                { color: isMyMessage ? "#FFFFFF" : theme.text },
              ]}
            >
              {item.text}
            </ThemedText>
          ) : null}
          {item.isProof ? (
            <View style={styles.proofBadge}>
              <Feather name="check-circle" size={12} color={isMyMessage ? "#FFFFFF" : theme.primary} />
              <ThemedText type="caption" style={{ color: isMyMessage ? "#FFFFFF" : theme.primary, marginLeft: 4 }}>
                Proof of completion
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="message-circle" size={32} color={theme.textSecondary} />
      </View>
      <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
        Start the conversation
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="h4">{otherUserName}</ThemedText>
        </View>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmpty}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundDefault }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={1000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || !threadId}
              style={({ pressed }) => [
                styles.sendButton,
                { 
                  backgroundColor: inputText.trim() && threadId ? theme.primary : theme.backgroundSecondary,
                  opacity: pressed && inputText.trim() ? 0.8 : 1,
                },
              ]}
            >
              <Feather 
                name="send" 
                size={18} 
                color={inputText.trim() && threadId ? "#FFFFFF" : theme.textSecondary} 
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
  },
  messageWrapper: {
    marginBottom: Spacing.sm,
  },
  timestamp: {
    textAlign: "center",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: Spacing.xs,
  },
  otherMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {},
  proofBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  inputContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.xl,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
