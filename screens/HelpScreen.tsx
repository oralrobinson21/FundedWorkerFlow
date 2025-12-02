import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { PLATFORM_FEE_PERCENT } from "@/types";

type HelpScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

interface SectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.primary + "20" }]}>
          <Feather name={icon as any} size={18} color={theme.primary} />
        </View>
        <ThemedText type="h4">{title}</ThemedText>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

function BulletPoint({ children }: { children: string }) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.bulletRow}>
      <Feather name="check-circle" size={14} color={theme.success} style={styles.bulletIcon} />
      <ThemedText type="body" style={{ flex: 1 }}>{children}</ThemedText>
    </View>
  );
}

export default function HelpScreen({ navigation }: HelpScreenProps) {
  const { theme } = useTheme();

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <ThemedText type="h2">Help & Support</ThemedText>
      </View>

      <Section icon="dollar-sign" title="About Payments">
        <BulletPoint>Posting a job is free</BulletPoint>
        <BulletPoint>Helpers apply for free</BulletPoint>
        <BulletPoint>You only pay when you select a helper</BulletPoint>
        <BulletPoint>{`CityTasks takes ${PLATFORM_FEE_PERCENT * 100}% of the entire job, including extra charges`}</BulletPoint>
        <BulletPoint>Tips always go 100% to the helper</BulletPoint>
        <BulletPoint>Payment is held until both parties confirm the job is complete</BulletPoint>
        <BulletPoint>Disputes require photo proof from both sides</BulletPoint>
        <BulletPoint>CityTasks will review and release or refund funds accordingly</BulletPoint>
      </Section>

      <Section icon="shield" title="Payment Security">
        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          Your payment is protected by Stripe, the industry-leading payment processor used by millions of businesses worldwide.
        </ThemedText>
        <BulletPoint>Funds are held securely until job completion</BulletPoint>
        <BulletPoint>Both poster and helper must confirm completion</BulletPoint>
        <BulletPoint>Automatic dispute resolution with photo evidence</BulletPoint>
      </Section>

      <Section icon="percent" title="Fee Breakdown">
        <View style={[styles.exampleCard, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>Example: $30 Job</ThemedText>
          <View style={styles.feeRow}>
            <ThemedText type="body">Poster pays:</ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>$30.00</ThemedText>
          </View>
          <View style={styles.feeRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>Platform fee ({PLATFORM_FEE_PERCENT * 100}%):</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>$4.50</ThemedText>
          </View>
          <View style={[styles.feeRow, styles.totalRow, { borderTopColor: theme.border }]}>
            <ThemedText type="body" style={{ fontWeight: "600", color: theme.success }}>Helper receives:</ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600", color: theme.success }}>$25.50</ThemedText>
          </View>
        </View>

        <View style={[styles.exampleCard, { backgroundColor: theme.backgroundSecondary, marginTop: Spacing.md }]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>Example: $10 Tip</ThemedText>
          <View style={styles.feeRow}>
            <ThemedText type="body">Tip amount:</ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>$10.00</ThemedText>
          </View>
          <View style={styles.feeRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>Platform fee:</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>$0.00</ThemedText>
          </View>
          <View style={[styles.feeRow, styles.totalRow, { borderTopColor: theme.border }]}>
            <ThemedText type="body" style={{ fontWeight: "600", color: theme.success }}>Helper receives:</ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600", color: theme.success }}>$10.00</ThemedText>
          </View>
        </View>
      </Section>

      <Section icon="alert-circle" title="Dispute Process">
        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          If there's a disagreement about job completion:
        </ThemedText>
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>1</ThemedText>
            </View>
            <ThemedText type="body" style={{ flex: 1 }}>Payment is paused immediately</ThemedText>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>2</ThemedText>
            </View>
            <ThemedText type="body" style={{ flex: 1 }}>Both parties submit photo evidence</ThemedText>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>3</ThemedText>
            </View>
            <ThemedText type="body" style={{ flex: 1 }}>CityTasks reviews all evidence</ThemedText>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>4</ThemedText>
            </View>
            <ThemedText type="body" style={{ flex: 1 }}>Decision made to release or refund funds</ThemedText>
          </View>
        </View>
      </Section>

      <Section icon="heart" title="Extra Work & Tips">
        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          Sometimes jobs require more work than expected:
        </ThemedText>
        <BulletPoint>Helpers can request extra payment for additional work</BulletPoint>
        <BulletPoint>Posters must approve any extra charges before payment</BulletPoint>
        <BulletPoint>{`Extra charges have the same ${PLATFORM_FEE_PERCENT * 100}% platform fee`}</BulletPoint>
        <BulletPoint>Tips are optional and go 100% to the helper</BulletPoint>
        <BulletPoint>Tips have zero platform fee - we don't take anything</BulletPoint>
      </Section>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          CityTasks collects a {PLATFORM_FEE_PERCENT * 100}% service fee from the posted job amount and any approved extra work. Tips are paid entirely to the helper. Stripe processing fees are deducted from the platform's share.
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionContent: {
    gap: Spacing.sm,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletIcon: {
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  exampleCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
