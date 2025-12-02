import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const { user, logout } = useApp();
  const router = useRouter();

  const handleSwitchMode = () => {
    router.replace("/(app)/mode-selector");
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/(auth)/login");
          } catch (err) {
            Alert.alert("Error", "Failed to log out");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Pressable style={styles.button} onPress={handleSwitchMode}>
          <Text style={styles.buttonText}>Switch Mode</Text>
          <Text style={styles.buttonSubtext}>Switch between poster and helper</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => Alert.alert("Coming Soon", "Payment methods will be available soon.")}>
          <Text style={styles.buttonText}>Payment Methods</Text>
          <Text style={styles.buttonSubtext}>Manage your payment options</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => Alert.alert("Help & Support", "Support information coming soon.")}>
          <Text style={styles.buttonText}>Help & Support</Text>
          <Text style={styles.buttonSubtext}>Get help with your account</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => Alert.alert("Privacy Policy", "Our privacy policy is coming soon.")}>
          <Text style={styles.buttonText}>Privacy Policy</Text>
          <Text style={styles.buttonSubtext}>View our privacy terms</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={[styles.buttonText, styles.logoutText]}>Log Out</Text>
      </Pressable>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    marginTop: 16,
  },
  userInfo: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  label: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 13,
    color: "#999",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    borderColor: "#ff4444",
    marginBottom: 40,
  },
  logoutText: {
    color: "#fff",
    marginBottom: 0,
  },
});
