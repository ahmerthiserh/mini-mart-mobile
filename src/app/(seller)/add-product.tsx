import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Text,
  Alert,
  Image,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/config/api";

const STATUS_OPTIONS = [
  { label: "Published", value: "published", color: "#10B981" },
  { label: "Draft", value: "draft", color: "#F59E0B" },
];

export default function AddProductScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [unitsList, setUnitsList] = useState<string[]>([]);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F9FAFB";
  const primaryColor = "#0284C7";

  useEffect(() => {
    // Fetch available categories
    fetch(api.ENDPOINTS.CATEGORIES)
      .then((res) => res.json())
      .then((data) => {
        const catList = Array.isArray(data) ? data : data.data && Array.isArray(data.data) ? data.data : [];
        setCategories(catList);
        if (catList.length > 0 && !categoryId) {
          setCategoryId(catList[0].id);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));

    // Fetch measurement units from database table
    fetch(api.ENDPOINTS.MEASUREMENT_UNITS)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data && Array.isArray(data.data) ? data.data : [];
        if (list.length > 0) {
          const unitNames = list.map((u: any) => (typeof u === "string" ? u : u.name || u.slug));
          setUnitsList(unitNames);
          if (unitNames.length > 0) {
            setUnit(unitNames[0]);
          }
        }
      })
      .catch((err) => console.error("Error fetching measurement units:", err));
  }, []);

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedCatName = selectedCat ? selectedCat.title || selectedCat.name : "";

  const filteredCategories = categories.filter((cat) => {
    const title = (cat.title || cat.name || "").toLowerCase();
    return title.includes(catSearchQuery.toLowerCase());
  });

  const filteredUnits = unitsList.filter((u) =>
    u.toLowerCase().includes(unitSearchQuery.toLowerCase())
  );

  const handlePickImage = async () => {
    if (images.length >= 3) {
      showToast("Maximum 3 product images allowed", "info");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast("Permission to access gallery is required", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 3 - images.length,
    });

    if (!result.canceled && result.assets) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 3));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async () => {
    if (images.length === 0) {
      showToast("At least 1 product image is required", "error");
      return;
    }
    if (!name.trim()) {
      showToast("Product name is required", "error");
      return;
    }
    if (!price || isNaN(Number(price))) {
      showToast("Valid base price is required", "error");
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("name", String(name).trim());
      formData.append(
        "category_id",
        String(categoryId || (categories.length > 0 ? categories[0].id : 1))
      );
      formData.append("description", String(description || ""));
      formData.append("base_price", String(price));
      formData.append("unit_quantity", "1");
      formData.append("base_quantity", String(quantity || "1"));
      formData.append("measurement_unit", String(unit || "item"));
      formData.append("status", String(status));

      if (images && images.length > 0) {
        images.forEach((img: any, idx: number) => {
          const rawUri = typeof img === "string" ? img : img?.uri;
          if (!rawUri || typeof rawUri !== "string") return;

          let cleanUri = rawUri;
          if (Platform.OS === "android" && !cleanUri.startsWith("file://") && !cleanUri.startsWith("content://")) {
            cleanUri = `file://${cleanUri}`;
          }

          const rawName = img?.fileName || cleanUri.split("/").pop() || `product_${Date.now()}_${idx}.jpg`;
          const cleanName = String(rawName).includes(".") ? String(rawName) : `${String(rawName)}.jpg`;
          const ext = cleanName.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = img?.mimeType || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");

          formData.append("images[]", {
            uri: cleanUri,
            name: cleanName,
            type: mimeType,
          } as any);
        });
      }

      const res = await new Promise<{ ok: boolean; status: number; data: any }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", api.ENDPOINTS.VENDOR.PRODUCTS);
        xhr.setRequestHeader("Accept", "application/json");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.onload = () => {
          let data: any = {};
          try {
            data = JSON.parse(xhr.responseText);
          } catch (e) {
            console.warn("XHR response not JSON:", xhr.responseText);
          }
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            data,
          });
        };

        xhr.onerror = () => reject(new Error("Network error submitting product"));
        xhr.ontimeout = () => reject(new Error("Request timeout submitting product"));
        xhr.send(formData);
      });

      const { ok, status: statusCode, data } = res;

      if (ok) {
        showToast("Product uploaded successfully!", "success");
        router.replace("/(seller)/seller-products" as any);
      } else {
        if (statusCode === 422 && data.message?.includes("upload limit reached")) {
          Alert.alert(
            "Upload Limit Reached",
            data.message,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Buy Slots",
                onPress: () => router.push("/(seller)/buy-slots" as any),
              },
            ]
          );
        } else {
          const errMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(", ") : null) || `Server Error (${statusCode})`;
          showToast(errMsg, "error");
        }
      }
    } catch (err: any) {
      console.error("Product upload exception:", err);
      showToast(err?.message ? `Upload Error: ${err.message}` : "Network error creating product", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 40, 60) },
        ]}
      >
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Add New Product</ThemedText>

          {/* PRODUCT IMAGES UPLOAD SECTION */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>
              Product Images (1 to 3) <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {images.map((img, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 3 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.uploadBox, { backgroundColor: inputBg, borderColor }]}
                  onPress={handlePickImage}
                >
                  <Ionicons name="camera-outline" size={24} color="#8E8E93" />
                  <Text style={styles.uploadText}>+ Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Product Name */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>
              Product Name <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" }]}
              placeholder="e.g. Fresh Organic Tomatoes"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>
              Category <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.pickerInput, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text
                style={[
                  styles.pickerInputText,
                  { color: selectedCatName ? (isDark ? "#FFF" : "#000") : "#8E8E93" },
                ]}
              >
                {selectedCatName || "Select Category..."}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Price & Quantity Row */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>
                Base Price (₦) <Text style={styles.requiredAsterisk}>*</Text>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" }]}
                placeholder="1000"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Stock Quantity</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" }]}
                placeholder="10"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          {/* Unit & Status Row */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>
                Unit <Text style={styles.requiredAsterisk}>*</Text>
              </ThemedText>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.pickerInput, { backgroundColor: inputBg, borderColor }]}
                onPress={() => setUnitModalVisible(true)}
              >
                <Text style={[styles.pickerInputText, { color: isDark ? "#FFF" : "#000" }]}>
                  {unit || "item"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Status</ThemedText>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.pickerInput, { backgroundColor: inputBg, borderColor }]}
                onPress={() => setStatusModalVisible(true)}
              >
                <View style={styles.statusBadgeInline}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: status === "published" ? "#10B981" : "#F59E0B" },
                    ]}
                  />
                  <Text style={[styles.pickerInputText, { color: isDark ? "#FFF" : "#000", textTransform: "capitalize" }]}>
                    {status}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" },
              ]}
              placeholder="Product details, features, specifications..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitBtn, { backgroundColor: primaryColor }]}
            onPress={handleCreateProduct}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>Save & Create Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CATEGORY SEARCH MODAL */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCategoryModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: cardBg,
                borderColor,
                paddingBottom: Math.max(insets.bottom + 20, 30),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Category</ThemedText>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Category Search Bar */}
            <View style={[styles.modalSearchBox, { backgroundColor: inputBg, borderColor }]}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <TextInput
                style={[styles.modalSearchInput, { color: isDark ? "#FFF" : "#000" }]}
                placeholder="Search categories..."
                placeholderTextColor="#8E8E93"
                value={catSearchQuery}
                onChangeText={setCatSearchQuery}
              />
              {catSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setCatSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Scroll List */}
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {filteredCategories.length === 0 ? (
                <View style={styles.noResultsBox}>
                  <ThemedText style={{ opacity: 0.6 }}>No categories found</ThemedText>
                </View>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  const catTitle = cat.title || cat.name || `Category ${cat.id}`;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      style={[
                        styles.modalItem,
                        { borderColor },
                        isSelected && { backgroundColor: isDark ? "#1E293B" : "#F0F9FF" },
                      ]}
                      onPress={() => {
                        setCategoryId(cat.id);
                        setCategoryModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: isDark ? "#FFF" : "#000" },
                          isSelected && { color: "#0284C7", fontWeight: "700" },
                        ]}
                      >
                        {catTitle}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color="#0284C7" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* UNIT PICKER MODAL */}
      <Modal
        visible={unitModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUnitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setUnitModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: cardBg,
                borderColor,
                paddingBottom: Math.max(insets.bottom + 20, 30),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Measurement Unit</ThemedText>
              <TouchableOpacity onPress={() => setUnitModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Unit Search Bar */}
            <View style={[styles.modalSearchBox, { backgroundColor: inputBg, borderColor }]}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <TextInput
                style={[styles.modalSearchInput, { color: isDark ? "#FFF" : "#000" }]}
                placeholder="Search measurement units..."
                placeholderTextColor="#8E8E93"
                value={unitSearchQuery}
                onChangeText={setUnitSearchQuery}
              />
              {unitSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setUnitSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {filteredUnits.length === 0 ? (
                <View style={styles.noResultsBox}>
                  <ThemedText style={{ opacity: 0.6 }}>No units found</ThemedText>
                </View>
              ) : (
                filteredUnits.map((u) => {
                  const isSelected = unit.toLowerCase() === u.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={u}
                      activeOpacity={0.7}
                      style={[
                        styles.modalItem,
                        { borderColor },
                        isSelected && { backgroundColor: isDark ? "#1E293B" : "#F0F9FF" },
                      ]}
                      onPress={() => {
                        setUnit(u);
                        setUnitModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: isDark ? "#FFF" : "#000" },
                          isSelected && { color: "#0284C7", fontWeight: "700" },
                        ]}
                      >
                        {u}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color="#0284C7" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* STATUS PICKER MODAL */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: cardBg,
                borderColor,
                paddingBottom: Math.max(insets.bottom + 20, 30),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Status</ThemedText>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, paddingVertical: 4 }}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    style={[
                      styles.modalItem,
                      { borderColor },
                      isSelected && { backgroundColor: isDark ? "#1E293B" : "#F0F9FF" },
                    ]}
                    onPress={() => {
                      setStatus(opt.value as any);
                      setStatusModalVisible(false);
                    }}
                  >
                    <View style={styles.statusBadgeInline}>
                      <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: isDark ? "#FFF" : "#000" },
                          isSelected && { color: "#0284C7", fontWeight: "700" },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#0284C7" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  requiredAsterisk: {
    color: "#EF4444",
    fontWeight: "700",
  },
  imageRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 4,
  },
  imagePreviewContainer: {
    position: "relative",
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  uploadText: {
    fontSize: 9,
    color: "#8E8E93",
    fontWeight: "600",
  },
  pickerInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerInputText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "75%",
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  modalList: {
    maxHeight: 350,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  noResultsBox: {
    paddingVertical: 30,
    alignItems: "center",
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 90,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  submitBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
