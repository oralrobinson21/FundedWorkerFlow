import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { Footer } from "@/components/Footer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";

interface LandingScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Landing">;
}

const FEATURES = [
  {
    icon: "briefcase" as const,
    title: "Post a Job",
    description: "Need help with something? Post your task for free and get offers from local helpers.",
  },
  {
    icon: "users" as const,
    title: "Find Helpers",
    description: "Browse verified helpers in your area. See reviews, photos, and choose the best fit.",
  },
  {
    icon: "credit-card" as const,
    title: "Secure Payments",
    description: "Pay securely through Stripe. Your payment is held until the job is done right.",
  },
  {
    icon: "shield" as const,
    title: "Photo Proof",
    description: "Helpers submit photo proof of completed work. You approve before payment is released.",
  },
];

const CATEGORIES = [
  "Cleaning", "Moving", "Delivery", "Handyman", "Yardwork", "Errands",
  "Tech Help", "Pet Care", "Car Help", "Organizing", "Babysitting", "Beauty",
];

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const { theme } = useTheme();

  const handleGetStarted = () => {
    navigation.navigate("Onboarding");
  };

  const handleNavigateInvestors = () => {
    navigation.navigate("Investors");
  };

  const handleNavigateContact = () => {
    navigation.navigate("Contact");
  };

  return (
    <ScreenScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
          <Feather name="check-circle" size={40} color="#FFFFFF" />
        </View>
        
        <ThemedText type="h1" style={styles.heroTitle}>
          CityTasks
        </ThemedText>
        
        <ThemedText type="body" style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
          Your local marketplace for getting things done
        </ThemedText>
        
        <ThemedText type="small" style={[styles.regionBadge, { backgroundColor: theme.backgroundSecondary }]}>
          Serving NYC + North NJ
        </ThemedText>
      </View>

      <View style={styles.descriptionSection}>
        <ThemedText type="body" style={[styles.description, { color: theme.text }]}>
          CityTasks connects people who need help with local helpers ready to work. 
          Whether you need moving assistance, home cleaning, handyman services, or 
          just someone to run errands, find trusted help in your neighborhood.
        </ThemedText>
      </View>

      <View style={styles.featuresSection}>
        <ThemedText type="h2" style={styles.sectionTitle}>
          How It Works
        </ThemedText>
        
        {FEATURES.map((feature, index) => (
          <View
            key={index}
            style={[styles.featureCard, { backgroundColor: theme.backgroundSecondary }]}
          >
            <View style={[styles.featureIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name={feature.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.featureContent}>
              <ThemedText type="h4">{feature.title}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {feature.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.categoriesSection}>
        <ThemedText type="h2" style={styles.sectionTitle}>
          Popular Categories
        </ThemedText>
        
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category, index) => (
            <View
              key={index}
              style={[styles.categoryChip, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="small">{category}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.ctaSection}>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: theme.primary }]}
          onPress={handleGetStarted}
        >
          <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
            Get Started
          </ThemedText>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>
        
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Free to post. Only 15% fee when you hire.
        </ThemedText>
      </View>

      <Footer 
        showNavLinks 
        onNavigateInvestors={handleNavigateInvestors}
        onNavigateContact={handleNavigateContact}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 36,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  heroSubtitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  regionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  descriptionSection: {
    marginBottom: Spacing["2xl"],
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  featureCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  categoriesSection: {
    marginBottom: Spacing["2xl"],
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  ctaSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    width: "100%",
  },
});
