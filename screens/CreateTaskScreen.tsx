import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Modal, Alert, Platform, Image, ActionSheetIOS, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PaymentReminderNote } from "@/components/InfoBanner";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useApp } from "@/context/AppContext";
import { NEIGHBORHOODS, CATEGORIES, TaskCategory } from "@/types";

const MAX_PHOTOS = 10;

type CreateTaskScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CreateTask">;
};

const neighborhoods = NEIGHBORHOODS ?? [];

export default function CreateTaskScreen({ navigation }: CreateTaskScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { createTask, user, hasProfilePhoto } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Other");
  const [neighborhood, setNeighborhood] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [areaDescription, setAreaDescription] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [price, setPrice] = useState("20");
  const [photosRequired, setPhotosRequired] = useState(false);
  const [toolsRequired, setToolsRequired] = useState(false);
  const [toolsProvided, setToolsProvided] = useState(false);
  const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const isValid = title.trim() && description.trim() && category && zipCode.trim() && areaDescription.trim() && fullAddress.trim() && parseFloat(price) >= 7;

  const pickImage = async (useCamera: boolean) => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Maximum Photos", `You can only add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    try {
      let result;
      
      if (useCamera) {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert("Permission Required", "Camera access is needed to take photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
          Alert.alert("Permission Required", "Photo library access is needed to select photos.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
          selectionLimit: MAX_PHOTOS - photos.length,
        });
      }

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos = result.assets.map((asset) => asset.uri);
        setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select photo. Please try again.");
    }
  };

  const showPhotoOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImage(true);
          else if (buttonIndex === 2) pickImage(false);
        }
      );
    } else {
      Alert.alert(
        "Add Photo",
        "Choose an option",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: () => pickImage(true) },
          { text: "Choose from Library", onPress: () => pickImage(false) },
        ]
      );
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    
    const hasPhoto = await hasProfilePhoto();
    if (!hasPhoto) {
      Alert.alert(
        "Profile Photo Required",
        "Please add a profile photo before posting a task. This helps build trust with helpers.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Add Photo", 
            onPress: () => navigation.goBack()
          },
        ]
      );
      return;
    }
    
    setIsSubmitting(true);
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        zipCode: zipCode.trim(),
        areaDescription: areaDescription.trim(),
        fullAddress: fullAddress.trim(),
        price: parseFloat(price),
        photosRequired,
        toolsRequired,
        toolsProvided,
        photos,
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
          <View style={styles.photoHeader}>
            <ThemedText type="small" style={styles.label}>
              Photos (optional)
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {photos.length} / {MAX_PHOTOS}
            </ThemedText>
          </View>
          <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
            Add photos to help helpers understand the job
          </ThemedText>
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={`photo-${index}`} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                <Pressable
                  onPress={() => removePhoto(index)}
                  style={[styles.removePhotoButton, { backgroundColor: theme.error }]}
                >
                  <Feather name="x" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <Pressable
                onPress={showPhotoOptions}
                style={[styles.addPhotoButton, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}
              >
                <Feather name="camera" size={24} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Add
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
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
          <ThemedText type="small" style={styles.label}>Area / Neighborhood</ThemedText>
          <TextInput
            style={inputStyle}
            value={areaDescription}
            onChangeText={setAreaDescription}
            placeholder="e.g., Bronx – 170th & Grand Concourse"
            placeholderTextColor={theme.textSecondary}
            maxLength={100}
          />
          <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
            This is shown to helpers before they accept
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Full Address</ThemedText>
          <TextInput
            style={inputStyle}
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="123 Main St, Apt 4B"
            placeholderTextColor={theme.textSecondary}
            maxLength={200}
          />
          <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
            Only shown to helper after they accept
          </ThemedText>
        </View>

        <PaymentReminderNote />

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
            Minimum $7. A 15% platform fee will be applied.
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Category</ThemedText>
          <Pressable
            onPress={() => setShowCategoryPicker(true)}
            style={[inputStyle, styles.picker]}
          >
            <ThemedText type="body" style={styles.pickerText}>
              {category}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>Zip Code</ThemedText>
          <TextInput
            style={inputStyle}
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="e.g., 10451"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.field}>
          <Pressable
            onPress={() => setToolsRequired(!toolsRequired)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: toolsRequired ? theme.primary : 'transparent' }]}>
              {toolsRequired ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
            </View>
            <ThemedText type="body">Tools required for this job</ThemedText>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Pressable
            onPress={() => setToolsProvided(!toolsProvided)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: toolsProvided ? theme.primary : 'transparent' }]}>
              {toolsProvided ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
            </View>
            <ThemedText type="body">I will provide tools</ThemedText>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Pressable
            onPress={() => setPhotosRequired(!photosRequired)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: photosRequired ? theme.primary : 'transparent' }]}>
              {photosRequired ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
            </View>
            <ThemedText type="body">Require completion photo</ThemedText>
          </Pressable>
        </View>
      </ScrollComponent>

      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Category</ThemedText>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.neighborhoodList}>
              {CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryPicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.neighborhoodItem,
                    { 
                      backgroundColor: item === category ? `${theme.primary}20` : (pressed ? theme.backgroundSecondary : 'transparent'),
                      borderColor: item === category ? theme.primary : 'transparent',
                    }
                  ]}
                >
                  <ThemedText type="body" style={{ fontWeight: item === category ? '600' : '400' }}>
                    {item}
                  </ThemedText>
                  {item === category ? <Feather name="check" size={18} color={theme.primary} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              {neighborhoods.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setNeighborhood(item);
                    setAreaDescription(item);
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  photoContainer: {
    width: 80,
    height: 80,
    position: "relative",
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  removePhotoButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
});
