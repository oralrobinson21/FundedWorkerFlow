import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function JobListScreen() {
  const { tasks, userMode } = useApp();
  const router = useRouter();

  // For helpers: show only "requested" tasks
  const filteredTasks = userMode === "helper" ? tasks.filter((t) => t.status === "requested") : tasks.filter((t) => t.posterId !== tasks[0]?.posterId);

  const handleJobPress = (taskId: string) => {
    router.push({
      pathname: "/(app)/job-detail",
      params: { taskId },
    });
  };

  const renderJob = ({ item }) => (
    <Pressable style={styles.card} onPress={() => handleJobPress(item.id)}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>${item.price}</Text>
      </View>
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.zipCode}>{item.zipCode}</Text>
        {item.areaDescription && <Text style={styles.area}>{item.areaDescription}</Text>}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header2}>
        <Text style={styles.screenTitle}>{userMode === "helper" ? "Available Jobs" : "My Jobs"}</Text>
        {userMode === "poster" && (
          <Pressable style={styles.addButton} onPress={() => router.push("/(app)/create-task")}>
            <Text style={styles.addButtonText}>+ Post</Text>
          </Pressable>
        )}
      </View>

      {filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{userMode === "helper" ? "No jobs available" : "No jobs posted yet"}</Text>
        </View>
      ) : (
        <FlatList data={filteredTasks} renderItem={renderJob} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} scrollEnabled={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingTop: 16,
  },
  header2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#00B87C",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00B87C",
  },
  category: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: "#333",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 8,
  },
  zipCode: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  area: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
