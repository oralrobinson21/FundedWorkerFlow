import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function ModeSelectorScreen() {
  const { setUserMode } = useApp();
  const router = useRouter();

  const handleModeSelect = async (mode: "poster" | "helper") => {
    await setUserMode(mode);
    router.replace("/(app)/category");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What would you like to do?</Text>

      <Pressable style={styles.card} onPress={() => handleModeSelect("poster")}>
        <Text style={styles.cardTitle}>I need help</Text>
        <Text style={styles.cardDescription}>Post a job and get offers from helpers</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => handleModeSelect("helper")}>
        <Text style={styles.cardTitle}>I'm helping</Text>
        <Text style={styles.cardDescription}>Browse jobs and send offers</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
  },
});
