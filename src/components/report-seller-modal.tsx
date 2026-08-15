import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Modal, TextInput, useColorScheme, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/context/ToastContext";

type ReportSellerModalProps = {
  visible: boolean;
  storeName?: string;
  sellerId?: number;
  onClose: () => void;
};

export function ReportSellerModal({ visible, storeName = "Seller", sellerId, onClose }: ReportSellerModalProps) {
  const isDark = useColorScheme() === "dark";
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<"scam" | "fake_product" | "inappropriate" | "other">("scam");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast("Please explain why you are reporting this seller", "error");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast("Report submitted. Our trust & safety team will investigate.", "success");
      setDescription("");
      onClose();
    } catch (error) {
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          <View style={styles.headerRow}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <ThemedText style={styles.modalTitle}>Report {storeName}</ThemedText>
          </View>

          <ThemedText style={styles.label}>WHAT IS THE ISSUE?</ThemedText>
          <View style={styles.typeRow}>
            {[
              { id: "scam", label: "Scam / Fraud" },
              { id: "fake_product", label: "Counterfeit" },
              { id: "inappropriate", label: "Abuse" },
              { id: "other", label: "Other" },
            ].map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeChip,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6" },
                  reportType === type.id && { backgroundColor: "#EF4444", borderColor: "#EF4444" },
                ]}
                onPress={() => setReportType(type.id as any)}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    reportType === type.id && { color: "#FFF", fontWeight: "700" },
                  ]}
                >
                  {type.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <ThemedText style={styles.label}>DETAILS / EVIDENCE</ThemedText>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: isDark ? "#2C2C2E" : "#F9FAFB", color: isDark ? "#FFF" : "#000" },
            ]}
            placeholder="Describe what happened or why this seller should be investigated..."
            placeholderTextColor={isDark ? "#8E8E93" : "#9CA3AF"}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: "#EF4444" }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.submitText}>Submit Report</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.6,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  textArea: {
    height: 80,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    textAlignVertical: "top",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.7,
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  submitText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
