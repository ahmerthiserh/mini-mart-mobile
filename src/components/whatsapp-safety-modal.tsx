import React from "react";
import { StyleSheet, View, TouchableOpacity, Modal, useColorScheme, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type WhatsAppSafetyModalProps = {
  visible: boolean;
  whatsappUrl: string | null;
  storeName?: string;
  onClose: () => void;
};

export function WhatsAppSafetyModal({ visible, whatsappUrl, storeName = "Seller", onClose }: WhatsAppSafetyModalProps) {
  const isDark = useColorScheme() === "dark";

  const handleProceed = () => {
    onClose();
    if (whatsappUrl) {
      Linking.openURL(whatsappUrl);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          <View style={[styles.iconBg, { backgroundColor: "#F59E0B20" }]}>
            <Ionicons name="shield-checkmark" size={32} color="#F59E0B" />
          </View>

          <ThemedText style={styles.modalTitle}>WhatsApp Safety Warning</ThemedText>
          <ThemedText style={styles.modalSub}>
            You are leaving Mini Mart to chat with <ThemedText style={{ fontWeight: "700" }}>{storeName}</ThemedText> on WhatsApp.
          </ThemedText>

          <View style={[styles.warningBox, { backgroundColor: isDark ? "#2C2C2E" : "#FFF8E1" }]}>
            <Ionicons name="alert-circle" size={16} color="#D97706" />
            <ThemedText style={styles.warningText}>
              Stay safe: Never send money directly to a seller unless you trust them. Payments made outside Mini Mart may not be protected by buyer protection policies.
            </ThemedText>
          </View>

          <TouchableOpacity style={[styles.proceedBtn, { backgroundColor: "#25D366" }]} onPress={handleProceed}>
            <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
            <ThemedText style={styles.proceedBtnText}>Continue to WhatsApp</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <ThemedText style={[styles.cancelText, { color: isDark ? "#8E8E93" : "#666" }]}>Stay on Mini Mart</ThemedText>
          </TouchableOpacity>
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
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 14,
    gap: 8,
    alignItems: "flex-start",
  },
  warningText: {
    fontSize: 12,
    color: "#D97706",
    flex: 1,
    lineHeight: 16,
    fontWeight: "600",
  },
  proceedBtn: {
    width: "100%",
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  proceedBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  cancelBtn: {
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
