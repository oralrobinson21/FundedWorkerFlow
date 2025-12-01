import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Onboarding">;
};

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useApp();

  const handleSelectRole = async (role: "customer" | "worker") => {
    await login(
      role === "customer" ? "Customer User" : "Helper User",
      role === "customer" ? "customer@citytasks.app" : "helper@citytasks.app",
      role
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing["3xl"] }]}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <ThemedText type="h1" style={styles.title}>
          CityTasks
        </ThemedText>
        
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Get small jobs done. Help your neighbors.
        </ThemedText>

        <View style={styles.buttonsContainer}>
          <Pressable
            onPress={() => handleSelectRole("customer")}
            style={({ pressed }) => [
              styles.roleButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.roleButtonContent}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="briefcase" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.roleTextContainer}>
                <ThemedText type="h4" style={styles.roleButtonTitle}>
                  I need help with tasks
                </ThemedText>
                <ThemedText type="small" style={styles.roleButtonSubtitle}>
                  Post jobs and get things done
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={24} color="#FFFFFF" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleSelectRole("worker")}
            style={({ pressed }) => [
              styles.roleButton,
              { backgroundColor: theme.secondary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.roleButtonContent}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="dollar-sign" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.roleTextContainer}>
                <ThemedText type="h4" style={styles.roleButtonTitle}>
                  I want to earn money
                </ThemedText>
                <ThemedText type="small" style={styles.roleButtonSubtitle}>
                  Accept jobs and get paid
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={24} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <ThemedText type="caption" style={[styles.footerText, { color: theme.textSecondary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  buttonsContainer: {
    width: "100%",
    gap: Spacing.lg,
  },
  roleButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  roleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTextContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  roleButtonTitle: {
    color: "#FFFFFF",
    marginBottom: 2,
  },
  roleButtonSubtitle: {
    color: "rgba(255,255,255,0.8)",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  footerText: {
    textAlign: "center",
  },
});
