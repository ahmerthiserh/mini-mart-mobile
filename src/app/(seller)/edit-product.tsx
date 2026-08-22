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
  Image,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAlert } from "@/context/AlertContext";
import api from "@/config/api";

const STATUS_OPTIONS = [
  { label: "Published", value: "published", color: "#10B981" },
  { label: "Draft", value: "draft", color: "#F59E0B" },
];

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string; id?: string }>();
  const productId = params.productId || params.id;

  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
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
  const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [removeImages, setRemoveImages] = useState<number[]>([]);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F9FAFB";
  const primaryColor = "#0284C7";

  useEffect(() => {
    // Fetch categories
    fetch(api.ENDPOINTS.CATEGORIES)
      .then((res) => res.json())
      .then((data) => {
        const catList = Array.isArray(data)
          ? data
          : data.data && Array.isArray(data.data)
          ? data.data
          : [];
        setCategories(catList);
      })
      .catch((err) => console.error("Error fetching categories:", err));

    // Fetch measurement units
    fetch(api.ENDPOINTS.MEASUREMENT_UNITS)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data.data && Array.isArray(data.data)
          ? data.data
          : [];
        if (list.length > 0) {
          const unitNames = list.map((u: any) =>
            typeof u === "string" ? u : u.name || u.slug
          );
          setUnitsList(unitNames);
        }
      })
      .catch((err) => console.error("Error fetching measurement units:", err));
  }, []);

  // Fetch Product Details for Edit
  useEffect(() => {
    if (productId && token) {
      setFetchingProduct(true);
      api.fetchWithTimeout(api.ENDPOINTS.VENDOR.PRODUCT_DETAILS(productId), {
        headers: api.getHeaders(token),
      })
        .then((res: Response) => res.json())
        .then((data: any) => {
          if (data) {
            setName(data.name || "");
            setCategoryId(
              data.category_id || (data.category ? data.category.id : null)
            );
            setDescription(data.description || "");
            setPrice(data.base_price ? String(data.base_price) : "");
            setQuantity(
              data.inventory && data.inventory.length > 0
                ? String(data.inventory[0].quantity)
                : "10"
            );
            setUnit(data.measurement_unit || "item");
            setStatus(data.status === "published" ? "published" : "draft");
            if (data.images && Array.isArray(data.images)) {
              setExistingImages(data.images);
            }
          }
        })
        .catch((err: any) => {
          console.error("Error fetching product for edit:", err);
          showToast("Failed to load product details", "error");
        })
        .finally(() => setFetchingProduct(false));
    } else {
      setFetchingProduct(false);
    }
  }, [productId, token]);

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedCatName = selectedCat
    ? selectedCat.title || selectedCat.name
    : "";

  const filteredCategories = categories.filter((cat) => {
    const title = (cat.title || cat.name || "").toLowerCase();
    return title.includes(catSearchQuery.toLowerCase());
  });

  const filteredUnits = unitsList.filter((u) =>
    u.toLowerCase().includes(unitSearchQuery.toLowerCase())
  );

  const totalImageCount = existingImages.length + newImages.length;

  const handlePickImage = async () => {
    if (totalImageCount >= 5) {
      showToast("Maximum 5 product images allowed", "info");
      return;
    }

    const { status: permStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== "granted") {
      showToast("Permission to access photo gallery is required", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewImages((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (id: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setRemoveImages((prev) => [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Product name is required", "error");
      return;
    }
    if (!price || isNaN(Number(price))) {
      showToast("Valid base price is required", "error");
      return;
    }
    if (!productId) {
      showToast("Product ID missing", "error");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
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

      if (removeImages.length > 0) {
        removeImages.forEach((id) => {
          formData.append("remove_images[]", String(id));
        });
      }

      if (newImages && newImages.length > 0) {
        newImages.forEach((img: any, idx: number) => {
          const rawUri = typeof img === "string" ? img : img?.uri;
          if (!rawUri || typeof rawUri !== "string") return;

          let cleanUri = rawUri;
          if (
            Platform.OS === "android" &&
            !cleanUri.startsWith("file://") &&
            !cleanUri.startsWith("content://")
          ) {
            cleanUri = `file://${cleanUri}`;
          }

          const rawName =
            img?.fileName ||
            cleanUri.split("/").pop() ||
            `product_${Date.now()}_${idx}.jpg`;
          const cleanName = String(rawName).includes(".")
            ? String(rawName)
            : `${String(rawName)}.jpg`;
          const ext = cleanName.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType =
            img?.mimeType ||
            (ext === "png"
              ? "image/png"
              : ext === "webp"
              ? "image/webp"
              : "image/jpeg");

          formData.append("images[]", {
            uri: cleanUri,
            name: cleanName,
            type: mimeType,
          } as any);
        });
      }

      const res = await new Promise<{ ok: boolean; status: number; data: any }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", api.ENDPOINTS.VENDOR.PRODUCT_DETAILS(productId));
          xhr.setRequestHeader("Accept", "application/json");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.onload = () => {
            let data: any = {};
            try {
              data = JSON.parse(xhr.responseText);
            } catch (e) {}
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              data,
            });
          };

          xhr.onerror = () => reject(new Error("Network error updating product"));
          xhr.send(formData);
        }
      );

      if (res.ok) {
        showToast("Product updated successfully!", "success");
        router.replace("/(seller)/manage-store" as any);
      } else {
        const errMsg =
          res.data.message ||
          (res.data.errors
            ? Object.values(res.data.errors).flat().join(", ")
            : null) ||
          `Server Error (${res.status})`;
        showToast(errMsg, "error");
      }
    } catch (err: any) {
      console.error("Product update exception:", err);
      showToast(err?.message ? `Error: ${err.message}` : "Network error updating product", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={{ marginTop: 12, opacity: 0.7 }}>
          Loading product details...
        </ThemedText>
      </ThemedView>
    );
  }

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
          <ThemedText style={styles.sectionTitle}>Edit Product</ThemedText>

          {/* PRODUCT IMAGES */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Product Images (up to 5)</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {existingImages.map((img) => (
                <View key={`existing-${img.id}`} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img.image_url }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveExistingImage(img.id)}
                  >
                    <Ionicons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {newImages.map((img, index) => (
                <View key={`new-${index}`} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveNewImage(index)}
                  >
                    <Ionicons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {totalImageCount < 5 && (
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
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" },
              ]}
              placeholder="e.g. Fresh Organic Tomatoes"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Category */}
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

          {/* Price & Quantity */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>
                Price (₦) <Text style={styles.requiredAsterisk}>*</Text>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" },
                ]}
                placeholder="0.00"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Stock Quantity</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" },
                ]}
                placeholder="10"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          {/* Unit & Status */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Measurement Unit</ThemedText>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.pickerInput, { backgroundColor: inputBg, borderColor }]}
                onPress={() => setUnitModalVisible(true)}
              >
                <Text
                  style={[
                    styles.pickerInputText,
                    { color: unit ? (isDark ? "#FFF" : "#000") : "#8E8E93" },
                  ]}
                >
                  {unit || "Select unit..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <ThemedText style={styles.label}>Status</ThemedText>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.pickerInput, { backgroundColor: inputBg, borderColor }]}
                onPress={() => setStatusModalVisible(true)}
              >
                <Text
                  style={[
                    styles.pickerInputText,
                    {
                      color: status === "published" ? "#10B981" : "#F59E0B",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {status === "published" ? "Published" : "Draft"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Product Description</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: inputBg, borderColor, color: isDark ? "#FFF" : "#000" },
              ]}
              placeholder="Describe your product details..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.submitBtn,
              { backgroundColor: primaryColor },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-sharp" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CATEGORY MODAL */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Category</ThemedText>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#FFF" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor }]}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <TextInput
                style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
                placeholder="Search category..."
                placeholderTextColor="#8E8E93"
                value={catSearchQuery}
                onChangeText={setCatSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.modalOption,
                    categoryId === cat.id && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: isDark ? "#FFF" : "#000" },
                      categoryId === cat.id && { color: "#0284C7", fontWeight: "700" },
                    ]}
                  >
                    {cat.title || cat.name}
                  </Text>
                  {categoryId === cat.id && (
                    <Ionicons name="checkmark" size={20} color="#0284C7" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* UNIT MODAL */}
      <Modal
        visible={unitModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUnitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Unit</ThemedText>
              <TouchableOpacity onPress={() => setUnitModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#FFF" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor }]}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <TextInput
                style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
                placeholder="Search unit..."
                placeholderTextColor="#8E8E93"
                value={unitSearchQuery}
                onChangeText={setUnitSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {filteredUnits.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.modalOption,
                    unit === u && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setUnit(u);
                    setUnitModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: isDark ? "#FFF" : "#000" },
                      unit === u && { color: "#0284C7", fontWeight: "700" },
                    ]}
                  >
                    {u}
                  </Text>
                  {unit === u && (
                    <Ionicons name="checkmark" size={20} color="#0284C7" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* STATUS MODAL */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Status</ThemedText>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#FFF" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, paddingVertical: 10 }}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOption,
                    status === opt.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setStatus(opt.value as any);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: opt.color, fontWeight: "700" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {status === opt.value && (
                    <Ionicons name="checkmark" size={20} color={opt.color} />
                  )}
                </TouchableOpacity>
              ))}
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  requiredAsterisk: {
    color: "#EF4444",
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  pickerInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerInputText: {
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imagePreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  uploadText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalOptionSelected: {
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 15,
  },
});
