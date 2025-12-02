import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import Feather from "@expo/vector-icons/Feather";

export default function JobDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { tasks, user, userMode, sendOffer, chooseHelper, jobOffers, cancelTask } = useApp();
  const router = useRouter();

  const task = tasks.find((t) => t.id === taskId);
  const offers = jobOffers.filter((o) => o.taskId === taskId);
  const [offerNote, setOfferNote] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [loading, setLoading] = useState(false);

  if (!task) {
    return (
      <View style={styles.container}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const handleSendOffer = async () => {
    if (!offerNote.trim()) {
      Alert.alert("Required", "Please add a note with your offer");
      return;
    }
    setLoading(true);
    try {
      await sendOffer(taskId || "", offerNote, proposedPrice ? parseFloat(proposedPrice) : undefined);
      Alert.alert("Success", "Offer sent!");
      setOfferNote("");
      setProposedPrice("");
    } catch (err) {
      Alert.alert("Error", "Failed to send offer");
    } finally {
      setLoading(false);
    }
  };

  const handleChooseHelper = async (offerId: string) => {
    setLoading(true);
    try {
      const result = await chooseHelper(taskId || "", offerId);
      if (result.checkoutUrl) {
        // Redirect to Stripe Checkout
        Alert.alert("Redirect", "In production, you would be redirected to Stripe Checkout");
      } else {
        Alert.alert("Success", "Helper chosen! Chat is now available.");
        router.back();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to choose helper");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log("❌ Cancel job pressed for task:", taskId);
    Alert.alert("Cancel Job", "Are you sure you want to cancel this job?", [
      { text: "No" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            console.log("❌ Canceling task:", taskId);
            await cancelTask(taskId || "", "poster");
            console.log("❌ Task canceled successfully");
            Alert.alert("Success", "Job cancelled");
            router.back();
          } catch (err) {
            console.error("Cancel error:", err);
            Alert.alert("Error", "Failed to cancel job. " + (err instanceof Error ? err.message : ""));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const isMyJob = task.posterId === user?.id;
  const canSeeFullAddress = isMyJob || task.helperId === user?.id;
  const canCancel = isMyJob && (task.status === "requested" || task.status === "accepted");

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        {canCancel && (
          <Pressable onPress={handleCancel} disabled={loading} style={styles.cancelIconButton}>
            <Feather name="x" size={24} color="#ff4444" />
          </Pressable>
        )}
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>${task.price}</Text>
        <Text style={styles.status}>{task.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.detail}>Category: {task.category}</Text>
        <Text style={styles.detail}>Zip: {task.zipCode}</Text>
        {task.areaDescription && <Text style={styles.detail}>Area: {task.areaDescription}</Text>}
        {canSeeFullAddress && task.fullAddress && <Text style={styles.detail}>Address: {task.fullAddress}</Text>}
        <Text style={styles.detail}>Photos Required: {task.photosRequired ? "Yes" : "No"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{task.description}</Text>
      </View>

      {isMyJob && offers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offers ({offers.length})</Text>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerName}>{offer.helperName}</Text>
                {offer.proposedPrice && <Text style={styles.offerPrice}>${offer.proposedPrice}</Text>}
              </View>
              <Text style={styles.offerNote}>{offer.note}</Text>
              {task.status === "requested" && offer.status === "pending" && (
                <Pressable style={styles.selectButton} onPress={() => handleChooseHelper(offer.id)} disabled={loading}>
                  <Text style={styles.selectButtonText}>{loading ? "Processing..." : "Choose"}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      {!isMyJob && userMode === "helper" && task.status === "requested" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send an Offer</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Tell them why you're a great fit..." value={offerNote} onChangeText={setOfferNote} multiline numberOfLines={3} editable={!loading} />
          <TextInput style={styles.input} placeholder="Proposed price (optional)" value={proposedPrice} onChangeText={setProposedPrice} keyboardType="decimal-pad" editable={!loading} />
          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOffer} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Offer</Text>}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    flex: 1,
  },
  cancelIconButton: {
    padding: 8,
    marginTop: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00B87C",
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  offerName: {
    fontSize: 14,
    fontWeight: "600",
  },
  offerPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00B87C",
  },
  offerNote: {
    fontSize: 13,
    color: "#333",
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: "#00B87C",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
  },
  selectButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#00B87C",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
