import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { CATEGORIES, TaskCategory } from "@/types";

export default function CategoryScreen() {
  const { userMode } = useApp();
  const router = useRouter();

  const handleCategorySelect = (category: TaskCategory) => {
    // Navigate to job list with category filter
    router.replace("/(app)/job-list");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>What do you need help with?</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <Pressable key={category} style={styles.categoryCard} onPress={() => handleCategorySelect(category)}>
            <Text style={styles.categoryText}>{category}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    marginTop: 16,
  },
  grid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
