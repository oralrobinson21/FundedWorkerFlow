import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import Feather from "@expo/vector-icons/Feather";

export default function ProfileScreen() {
  const { user, logout } = useApp();
  const router = useRouter();

  const handleSwitchMode = async () => {
    console.log("🔄 Switch Mode pressed");
    try {
      router.replace("/(app)/mode-selector");
    } catch (err) {
      console.error("Switch mode error:", err);
      Alert.alert("Error", "Could not switch mode");
    }
  };

  const handlePaymentMethods = () => {
    console.log("💳 Payment Methods pressed");
    Alert.alert("Coming Soon", "Payment methods will be available soon.");
  };

  const handleHelpSupport = () => {
    console.log("❓ Help & Support pressed");
    Alert.alert("Help & Support", "Support information coming soon.");
  };

  const handlePrivacyPolicy = () => {
    console.log("🔒 Privacy Policy pressed");
    Alert.alert("Privacy Policy", "Our privacy policy is coming soon.");
  };

  const handleLogout = () => {
    console.log("🚪 Logout pressed");
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🚪 Executing logout...");
            await logout();
            console.log("🚪 Logout complete, navigating to login");
            router.replace("/(auth)/login");
          } catch (err) {
            console.error("Logout error:", err);
            Alert.alert("Error", "Failed to log out");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {user && (
        <View style={styles.userCard}>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userSubtext}>Account ID: {user.id.substring(0, 8)}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity style={styles.button} onPress={handleSwitchMode} activeOpacity={0.7}>
          <Feather name="repeat" size={20} color="#333" style={styles.icon} />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Switch Mode</Text>
            <Text style={styles.buttonSubtitle}>Switch between poster and helper</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handlePaymentMethods} activeOpacity={0.7}>
          <Feather name="credit-card" size={20} color="#333" style={styles.icon} />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Payment Methods</Text>
            <Text style={styles.buttonSubtitle}>Manage payment options</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.button} onPress={handleHelpSupport} activeOpacity={0.7}>
          <Feather name="help-circle" size={20} color="#333" style={styles.icon} />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Help & Support</Text>
            <Text style={styles.buttonSubtitle}>Get help with your account</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handlePrivacyPolicy} activeOpacity={0.7}>
          <Feather name="shield" size={20} color="#333" style={styles.icon} />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Privacy Policy</Text>
            <Text style={styles.buttonSubtitle}>View our privacy terms</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userSubtext: {
    fontSize: 13,
    color: "#999",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  icon: {
    marginRight: 12,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 40,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
