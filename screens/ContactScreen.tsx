import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, TextInput, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { Footer } from "@/components/Footer";
import { EmailModal } from "@/components/EmailModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { apiRequest } from "@/utils/api";

interface ContactScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Contact">;
}

const CONTACT_EMAIL = "citytask@outlook.com";

export default function ContactScreen({ navigation }: ContactScreenProps) {
  const { theme } = useTheme();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);

  const handleBack = () => {
    navigation.navigate("Landing");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert("Missing Information", "Please fill in your name, email, and message.");
      return;
    }

    setSending(true);

    try {
      const response = await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || "General Inquiry",
          message: message.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Message Sent",
          "Thank you for reaching out. We will get back to you soon.",
          [{ text: "OK", onPress: () => navigation.navigate("Landing") }]
        );
      } else {
        Alert.alert("Error", "Failed to send message. Please try emailing us directly at citytask@outlook.com");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send message. Please try emailing us directly at citytask@outlook.com");
    } finally {
      setSending(false);
    }
  };

  const handleEmailPress = () => {
    setEmailModalVisible(true);
  };

  const handleNavigateInvestors = () => {
    navigation.replace("Investors");
  };

  return (
    <ScreenKeyboardAwareScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">Contact Us</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.introSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="mail" size={32} color={theme.primary} />
        </View>
        
        <ThemedText type="h1" style={styles.title}>
          Get in Touch
        </ThemedText>
        
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Have a question, feedback, or need support? We would love to hear from you.
        </ThemedText>
      </View>

      <View style={[styles.directContact, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText type="h4">Email Us Directly</ThemedText>
        <Pressable onPress={handleEmailPress} style={styles.emailButton}>
          <Feather name="mail" size={20} color={theme.primary} />
          <ThemedText type="body" style={{ color: theme.primary }}>
            {CONTACT_EMAIL}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.formSection}>
        <ThemedText type="h3" style={styles.formTitle}>
          Or Send a Message
        </ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Your Name *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Your Email *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Subject
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            value={subject}
            onChangeText={setSubject}
            placeholder="How can we help?"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Message *
          </ThemedText>
          <TextInput
            style={[
              styles.textArea,
              { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us what's on your mind..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: theme.primary },
            sending ? { opacity: 0.7 } : null,
          ]}
          onPress={handleSubmit}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="send" size={20} color="#FFFFFF" />
              <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                Send Message
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>

      <Footer 
        showNavLinks
        onNavigateInvestors={handleNavigateInvestors}
        onNavigateContact={() => {}}
      />

      <EmailModal
        visible={emailModalVisible}
        email={CONTACT_EMAIL}
        onClose={() => setEmailModalVisible(false)}
      />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  introSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
  },
  directContact: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.md,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  formSection: {
    marginBottom: Spacing["2xl"],
  },
  formTitle: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
});
