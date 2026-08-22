import React from "react";
import { StyleSheet, View, TouchableOpacity, Modal, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

export type ActionAlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  confirmBtnColor?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ActionAlertModal({
  visible,
  title,
  message,
  iconName = "alert-circle-outline",
  iconColor = "#0284C7",
  confirmText = "Confirm",
  confirmBtnColor = "#0284C7",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ActionAlertModalProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          <View style={[styles.iconBg, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>

          <ThemedText style={styles.modalTitle}>{title}</ThemedText>
          <ThemedText style={styles.modalSub}>{message}</ThemedText>

          <View style={styles.buttonRow}>
            {cancelText ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.btn,
                  styles.cancelBtn,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
                onPress={onCancel}
              >
                <ThemedText style={styles.cancelText}>{cancelText}</ThemedText>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.btn,
                styles.confirmBtn,
                { backgroundColor: confirmBtnColor },
              ]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.confirmText}>{confirmText}</ThemedText>
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
    backgroundColor: "rgba(0,0,0,0.65)",
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
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  modalSub: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.75,
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {},
  confirmBtn: {},
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.8,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
