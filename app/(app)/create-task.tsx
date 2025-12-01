import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { CATEGORIES, TaskCategory } from "@/types";

export default function CreateTaskScreen() {
  const { createTask, user } = useApp();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Cleaning");
  const [zipCode, setZipCode] = useState(user?.defaultZipCode || "");
  const [areaDescription, setAreaDescription] = useState("");
  const [price, setPriceStr] = useState("");
  const [photosRequired, setPhotosRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!title.trim() || !description.trim() || !zipCode.trim() || !price.trim()) {
      Alert.alert("Missing fields", "Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await createTask({
        title,
        description,
        category,
        zipCode,
        areaDescription: areaDescription || null,
        fullAddress: null,
        price: parseFloat(price),
        photosRequired,
      });
      Alert.alert("Success", "Job posted!");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Post a Job</Text>

      <Text style={styles.label}>Job Title</Text>
      <TextInput style={styles.input} placeholder="e.g., Apartment Cleaning" value={title} onChangeText={setTitle} editable={!loading} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="Describe what needs to be done..." value={description} onChangeText={setDescription} multiline numberOfLines={4} editable={!loading} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Pressable key={cat} style={[styles.categoryBadge, category === cat && styles.categoryActive]} onPress={() => setCategory(cat)} disabled={loading}>
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Zip Code</Text>
      <TextInput style={styles.input} placeholder="12345" value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" editable={!loading} />

      <Text style={styles.label}>Area Description (visible to all)</Text>
      <TextInput style={styles.input} placeholder="e.g., Downtown, near Park Ave" value={areaDescription} onChangeText={setAreaDescription} editable={!loading} />

      <Text style={styles.label}>Budget ($)</Text>
      <TextInput style={styles.input} placeholder="50" value={price} onChangeText={setPriceStr} keyboardType="decimal-pad" editable={!loading} />

      <Pressable style={[styles.checkboxContainer, loading && styles.disabled]} onPress={() => setPhotosRequired(!photosRequired)} disabled={loading}>
        <View style={[styles.checkbox, photosRequired && styles.checkboxChecked]} />
        <Text style={styles.checkboxLabel}>Require proof photo</Text>
      </Pressable>

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreateTask} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post Job</Text>}
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: "#00B87C",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryActive: {
    backgroundColor: "#00B87C",
  },
  categoryText: {
    fontSize: 12,
    color: "#00B87C",
  },
  categoryTextActive: {
    color: "#fff",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#00B87C",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#00B87C",
  },
  checkboxLabel: {
    fontSize: 14,
  },
  button: {
    backgroundColor: "#00B87C",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
