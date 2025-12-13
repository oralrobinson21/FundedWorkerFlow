import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { API_BASE_URL } from "@/utils/api";

type CompleteProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CompleteProfile">;
};

export default function CompleteProfileScreen({ navigation }: CompleteProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, updateUserProfileFull } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const isValid = name.trim().length >= 2 && 
                  phone.replace(/\D/g, "").length === 10 && 
                  zipCode.trim().length >= 5;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateUserProfileFull(name.trim(), phone.replace(/\D/g, ""), zipCode.trim());
      
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (error) {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundDefault,
      color: theme.text,
      borderColor: theme.border,
    },
  ];

  const ScrollComponent = Platform.OS === "web" ? ScrollView : KeyboardAwareScrollView;

  return (
    <ThemedView style={styles.container}>
      <ScrollComponent
        style={[styles.scrollView, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.buttonHeight + Spacing["2xl"] }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="user" size={32} color={theme.primary} />
        </View>

        <ThemedText type="h2" style={styles.title}>
          Complete Your Profile
        </ThemedText>

        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Please provide your details to continue. This helps build trust with other users.
        </ThemedText>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Full Name *</ThemedText>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Phone Number *</ThemedText>
          <TextInput
            style={inputStyle}
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            placeholder="(555) 123-4567"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            maxLength={14}
          />
          <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
            Your phone number is kept private until you are hired for a job.
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Zip Code *</ThemedText>
          <TextInput
            style={inputStyle}
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="e.g., 10451"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={10}
          />
          <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
            Used to show you jobs and helpers in your area.
          </ThemedText>
        </View>

        <View style={[styles.privacyNote, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="lock" size={16} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
            Your personal information is protected and only shared as needed for task completion.
          </ThemedText>
        </View>
      </ScrollComponent>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            { 
              backgroundColor: theme.primary,
              opacity: !isValid || isSubmitting ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <ThemedText type="body" style={styles.submitButtonText}>
            {isSubmitting ? "Saving..." : "Continue"}
          </ThemedText>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: Spacing["2xl"],
    textAlign: "center",
    lineHeight: 22,
  },
  field: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
  },
  hint: {
    marginTop: Spacing.xs,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
