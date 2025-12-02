import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import Feather from "@expo/vector-icons/Feather";

export default function ModeSelectorScreen() {
  const { setUserMode } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleModeSelect = async (mode: "poster" | "helper") => {
    console.log(`🎯 Mode selected: ${mode}`);
    setLoading(true);
    try {
      await setUserMode(mode);
      console.log(`✅ Mode set to ${mode}, navigating to category`);
      router.replace("/(app)/category");
    } catch (err) {
      console.error(`❌ Error setting mode: ${err}`);
      Alert.alert("Error", "Failed to switch mode. Please try again.");
      setLoading(false);
    }
  };

  const handleProfile = () => {
    console.log("⚙️ Profile button pressed");
    router.push("/(app)/profile");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={handleProfile}
        activeOpacity={0.7}
      >
        <Feather name="settings" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>What would you like to do?</Text>

        <TouchableOpacity 
          style={[styles.card, styles.posterCard]}
          onPress={() => handleModeSelect("poster")}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Feather name="briefcase" size={32} color="#fff" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>I need help</Text>
          <Text style={styles.cardDescription}>Post a job and get offers from helpers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, styles.helperCard]}
          onPress={() => handleModeSelect("helper")}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Feather name="award" size={32} color="#fff" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>I'm helping</Text>
          <Text style={styles.cardDescription}>Browse jobs and send offers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  profileButton: {
    position: "absolute",
    top: 16,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 32,
    textAlign: "center",
    color: "#000",
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  posterCard: {
    backgroundColor: "#00c66f",
  },
  helperCard: {
    backgroundColor: "#4b63ff",
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  cardDescription: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },
});
