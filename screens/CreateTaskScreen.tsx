import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Modal, Alert, Platform } from "react-native";
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
import { NEIGHBORHOODS } from "@/types";

type CreateTaskScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CreateTask">;
};

export default function CreateTaskScreen({ navigation }: CreateTaskScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { createTask } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [price, setPrice] = useState("20");
  const [timeWindow, setTimeWindow] = useState("Today, Next 3 hours");
  const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim() && description.trim() && neighborhood && parseFloat(price) >= 5;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim(),
        neighborhood,
        price: parseFloat(price),
        timeWindow,
      });
      navigation.replace("Payment", { task });
    } catch (error) {
      Alert.alert("Error", "Failed to create task. Please try again.");
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
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText type="body" style={{ color: theme.primary }}>Cancel</ThemedText>
        </Pressable>
        <ThemedText type="h4">Post a Task</ThemedText>
        <View style={styles.headerButton} />
      </View>

      <ScrollComponent 
        style={[styles.scrollView, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.buttonHeight + Spacing["2xl"] }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Title</ThemedText>
          <TextInput
            style={inputStyle}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Take 3 bags to curb"
            placeholderTextColor={theme.textSecondary}
            maxLength={100}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Description</ThemedText>
          <TextInput
            style={[inputStyle, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What needs to be done?"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Neighborhood</ThemedText>
          <Pressable
            onPress={() => setShowNeighborhoodPicker(true)}
            style={[inputStyle, styles.picker]}
          >
            <ThemedText 
              type="body" 
              style={[styles.pickerText, !neighborhood && { color: theme.textSecondary }]}
            >
              {neighborhood || "Select neighborhood"}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Price ($)</ThemedText>
          <View style={[inputStyle, styles.priceInput]}>
            <ThemedText type="h3" style={{ color: theme.primary }}>$</ThemedText>
            <TextInput
              style={[styles.priceTextInput, { color: theme.text }]}
              value={price}
              onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              maxLength={6}
            />
          </View>
          <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
            Minimum $5. You'll pay a small 8% service fee.
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Time Window</ThemedText>
          <TextInput
            style={inputStyle}
            value={timeWindow}
            onChangeText={setTimeWindow}
            placeholder="e.g., Today 2-5pm"
            placeholderTextColor={theme.textSecondary}
          />
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
            {isSubmitting ? "Creating..." : "Continue to Payment"}
          </ThemedText>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <Modal
        visible={showNeighborhoodPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNeighborhoodPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Neighborhood</ThemedText>
              <Pressable onPress={() => setShowNeighborhoodPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.neighborhoodList}>
              {NEIGHBORHOODS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setNeighborhood(item);
                    setShowNeighborhoodPicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.neighborhoodItem,
                    { 
                      backgroundColor: pressed ? theme.backgroundDefault : theme.backgroundRoot,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <ThemedText type="body">{item}</ThemedText>
                  {neighborhood === item ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
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
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  field: {
    marginBottom: Spacing.xl,
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
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    flex: 1,
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
  },
  hint: {
    marginTop: Spacing.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  neighborhoodList: {
    flex: 1,
  },
  neighborhoodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
  },
});
