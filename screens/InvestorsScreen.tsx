import React from "react";
import { View, StyleSheet, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { Footer } from "@/components/Footer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";

interface InvestorsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Investors">;
}

const METRICS = [
  { label: "Target Market", value: "NYC + North NJ" },
  { label: "Platform Fee", value: "15%" },
  { label: "Categories", value: "13+" },
  { label: "Min Job Price", value: "$7" },
];

const HIGHLIGHTS = [
  {
    icon: "trending-up" as const,
    title: "Growing Market",
    description: "The gig economy continues to expand with increasing demand for local services.",
  },
  {
    icon: "shield" as const,
    title: "Trust & Safety",
    description: "Photo verification, phone verification, and secure Stripe payments protect all parties.",
  },
  {
    icon: "zap" as const,
    title: "Low Friction",
    description: "Free to post jobs, simple OTP login, and Stripe Connect for instant helper payouts.",
  },
  {
    icon: "users" as const,
    title: "Two-Sided Network",
    description: "Connecting job posters with local helpers creates strong network effects.",
  },
];

export default function InvestorsScreen({ navigation }: InvestorsScreenProps) {
  const { theme } = useTheme();

  const handleBack = () => {
    navigation.navigate("Landing");
  };

  const handleContact = () => {
    Linking.openURL("mailto:citytask@outlook.com?subject=Investor%20Inquiry");
  };

  const handleNavigateContact = () => {
    navigation.replace("Contact");
  };

  return (
    <ScreenScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">Investor Relations</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.introSection}>
        <ThemedText type="h1" style={styles.title}>
          Building the Future of Local Services
        </ThemedText>
        
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          CityTasks is a mobile-first marketplace connecting people who need help 
          with trusted local helpers. We are revolutionizing how communities get things done.
        </ThemedText>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.metricsGrid}>
          {METRICS.map((metric, index) => (
            <View
              key={index}
              style={[styles.metricCard, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="h2" style={{ color: theme.primary }}>
                {metric.value}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {metric.label}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.highlightsSection}>
        <ThemedText type="h2" style={styles.sectionTitle}>
          Investment Highlights
        </ThemedText>
        
        {HIGHLIGHTS.map((highlight, index) => (
          <View
            key={index}
            style={[styles.highlightCard, { backgroundColor: theme.backgroundSecondary }]}
          >
            <View style={[styles.highlightIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name={highlight.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.highlightContent}>
              <ThemedText type="h4">{highlight.title}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {highlight.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.businessModelSection}>
        <ThemedText type="h2" style={styles.sectionTitle}>
          Business Model
        </ThemedText>
        
        <View style={[styles.modelCard, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="body" style={{ lineHeight: 24 }}>
            CityTasks operates a transaction-based revenue model, collecting a 15% platform 
            fee on completed jobs. This aligns our success with the success of our users.
          </ThemedText>
          
          <View style={styles.modelPoints}>
            <View style={styles.modelPoint}>
              <Feather name="check" size={16} color={theme.success} />
              <ThemedText type="small">Free job posting for customers</ThemedText>
            </View>
            <View style={styles.modelPoint}>
              <Feather name="check" size={16} color={theme.success} />
              <ThemedText type="small">Free sign-up for helpers</ThemedText>
            </View>
            <View style={styles.modelPoint}>
              <Feather name="check" size={16} color={theme.success} />
              <ThemedText type="small">Stripe Connect Express payouts</ThemedText>
            </View>
            <View style={styles.modelPoint}>
              <Feather name="check" size={16} color={theme.success} />
              <ThemedText type="small">Photo proof verification system</ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.contactSection}>
        <ThemedText type="h2" style={styles.sectionTitle}>
          Get in Touch
        </ThemedText>
        
        <ThemedText type="body" style={[styles.contactText, { color: theme.textSecondary }]}>
          Interested in learning more about investment opportunities? 
          We would love to hear from you.
        </ThemedText>
        
        <Pressable
          style={[styles.contactButton, { backgroundColor: theme.primary }]}
          onPress={handleContact}
        >
          <Feather name="mail" size={20} color="#FFFFFF" />
          <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
            Contact Us
          </ThemedText>
        </Pressable>
      </View>

      <Footer 
        showNavLinks
        onNavigateInvestors={() => {}}
        onNavigateContact={handleNavigateContact}
      />
    </ScreenScrollView>
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
    marginBottom: Spacing["2xl"],
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
  metricsSection: {
    marginBottom: Spacing["2xl"],
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  highlightsSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  highlightCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  businessModelSection: {
    marginBottom: Spacing["2xl"],
  },
  modelCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  modelPoints: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  modelPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  contactSection: {
    marginBottom: Spacing["2xl"],
    alignItems: "center",
  },
  contactText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
  },
});
