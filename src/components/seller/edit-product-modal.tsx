import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/config/api";

type Props = {
  visible: boolean;
  product: any;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditProductModal({ visible, product, onClose, onSuccess }: Props) {
  const isDark = useColorScheme() === "dark";
  const { token } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("item");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newImageAsset, setNewImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F8F9FA";

  useEffect(() => {
    if (visible && product) {
      setName(product.name || "");
      setPrice(product.base_price ? String(product.base_price) : "");
      setQuantity(
        product.inventory && product.inventory.length > 0
          ? String(product.inventory[0].quantity)
          : "10"
      );
      setUnit(product.measurement_unit || "item");
      setStatus(product.status === "published" ? "published" : "draft");
      setCategoryId(product.category_id || (product.category ? product.category.id : null));
      setDescription(product.description || "");

      const primaryImg =
        product.images && product.images.length > 0
          ? product.images.find((img: any) => img.is_primary)?.image_url ||
            product.images[0].image_url
          : null;
      setSelectedImage(primaryImg);
      setNewImageAsset(null);

      // Load categories & units
      fetchCategories();
      fetchUnits();
    }
  }, [visible, product]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(api.ENDPOINTS.CATEGORIES);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data && Array.isArray(data.data) ? data.data : [];
      setCategories(list);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch(api.ENDPOINTS.MEASUREMENT_UNITS);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data && Array.isArray(data.data) ? data.data : [];
      if (list.length > 0) {
        const unitNames = list.map((u: any) => (typeof u === "string" ? u : u.name || u.slug));
        setUnitsList(unitNames);
      }
    } catch (err) {
      console.error("Error fetching measurement units:", err);
    }
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library access required", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setNewImageAsset(asset);
      setSelectedImage(asset.uri);
    }
  };

  const handleSave = async () => {
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
      formData.append("_method", "PUT");
      formData.append("name", name.trim());
      formData.append(
        "category_id",
        String(categoryId || (categories.length > 0 ? categories[0].id : 1))
      );
      formData.append("description", description.trim());
      formData.append("base_price", String(price));
      formData.append("unit_quantity", "1");
      formData.append("base_quantity", String(quantity || "10"));
      formData.append("measurement_unit", String(unit || "item"));
      formData.append("status", status);

      if (newImageAsset) {
        let cleanUri = newImageAsset.uri;
        if (
          Platform.OS === "android" &&
          !cleanUri.startsWith("file://") &&
          !cleanUri.startsWith("content://")
        ) {
          cleanUri = `file://${cleanUri}`;
        }

        const rawName =
          newImageAsset.fileName ||
          cleanUri.split("/").pop() ||
          `product_${Date.now()}.jpg`;
        const cleanName = String(rawName).includes(".")
          ? String(rawName)
          : `${String(rawName)}.jpg`;
        const ext = cleanName.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType =
          newImageAsset.mimeType ||
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
      }

      const res = await new Promise<{ ok: boolean; status: number; data: any }>(
        (resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", api.ENDPOINTS.VENDOR.PRODUCT_DETAILS(product.id));
          xhr.setRequestHeader("Accept", "application/json");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.onload = () => {
            let data: any = {};
            try {
              data = JSON.parse(xhr.responseText);
            } catch (e) {}
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
          };

          xhr.onerror = () => {
            resolve({ ok: false, status: 0, data: { message: "Network request failed" } });
          };

          xhr.send(formData);
        }
      );

      if (res.ok) {
        showToast("Product updated successfully!", "success");
        onSuccess();
        onClose();
      } else {
        showToast(res.data.message || "Failed to update product", "error");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      showToast("Network error updating product", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
          {/* HEADER */}
          <View style={[styles.header, { borderColor }]}>
            <ThemedText style={styles.headerTitle}>Edit Product</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* IMAGE PICKER */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.imageBox, { backgroundColor: inputBg, borderColor }]}
              onPress={handlePickImage}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#0284C7" />
                  <ThemedText style={styles.imageText}>Change Product Image</ThemedText>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* NAME */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Product Name *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Traditional Kaftan"
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* PRICE & QUANTITY */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>Price (₦) *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 15000"
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>Stock Quantity *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="e.g. 10"
                  placeholderTextColor="#8E8E93"
                />
              </View>
            </View>

            {/* STATUS TOGGLE */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Listing Status *</ThemedText>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    status === "published" && { backgroundColor: "#10B981", borderColor: "#10B981" },
                  ]}
                  onPress={() => setStatus("published")}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={status === "published" ? "#FFF" : "#8E8E93"}
                  />
                  <ThemedText
                    style={[styles.statusBtnText, status === "published" && { color: "#FFF" }]}
                  >
                    Published
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    status === "draft" && { backgroundColor: "#F59E0B", borderColor: "#F59E0B" },
                  ]}
                  onPress={() => setStatus("draft")}
                >
                  <Ionicons
                    name="pause-circle"
                    size={16}
                    color={status === "draft" ? "#FFF" : "#8E8E93"}
                  />
                  <ThemedText
                    style={[styles.statusBtnText, status === "draft" && { color: "#FFF" }]}
                  >
                    Draft
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* CATEGORY SELECTOR */}
            {categories.length > 0 && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Category</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {categories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.chip,
                          { borderColor },
                          isSelected && { backgroundColor: "#0284C7", borderColor: "#0284C7" },
                        ]}
                        onPress={() => setCategoryId(cat.id)}
                      >
                        <ThemedText style={[styles.chipText, isSelected && { color: "#FFF" }]}>
                          {cat.title || cat.name}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* MEASUREMENT UNIT SELECTOR */}
            {unitsList.length > 0 && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Measurement Unit</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {unitsList.map((u) => {
                    const isSelected = unit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.chip,
                          { borderColor },
                          isSelected && { backgroundColor: "#0284C7", borderColor: "#0284C7" },
                        ]}
                        onPress={() => setUnit(u)}
                      >
                        <ThemedText style={[styles.chipText, isSelected && { color: "#FFF" }]}>
                          {u}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* DESCRIPTION */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Product description..."
                placeholderTextColor="#8E8E93"
              />
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={[styles.footer, { borderColor }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-sharp" size={18} color="#FFF" />
                  <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  imageBox: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    gap: 6,
  },
  imageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0284C7",
  },
  editBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#0284C7",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8E8E93",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#0284C7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
