import React, { useState } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type EmailModalProps = {
  visible: boolean;
  email: string;
  onClose: () => void;
};

export function EmailModal({ visible, email, onClose }: EmailModalProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(email);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={24} color={theme.textSecondary} />
          </Pressable>

          <View style={styles.emailContainer}>
            <View
              style={[
                styles.emailIconCircle,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="mail" size={32} color={theme.primary} />
            </View>

            <ThemedText type="h3" style={styles.emailText}>
              {email}
            </ThemedText>

            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [
                styles.copyButton,
                {
                  backgroundColor: copied ? theme.primary : theme.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather
                name={copied ? "check" : "copy"}
                size={20}
                color="#FFFFFF"
              />
              <ThemedText style={styles.copyButtonText}>
                {copied ? "Copied!" : "Tap to Copy"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    width: "85%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingTop: Spacing["3xl"],
  },
  closeButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
    zIndex: 1,
  },
  emailContainer: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  emailIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emailText: {
    textAlign: "center",
    fontSize: 18,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
