import React from "react";
import { StyleSheet, View, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";

interface PhotoSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  title?: string;
  subtitle?: string;
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  primaryColor?: string;
}

export function PhotoSourceModal({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
  title = "Facial Selfie Verification",
  subtitle = "Choose how you would like to provide your live selfie photo",
  isDark,
  cardBg,
  borderColor,
  primaryColor = "#3B82F6",
}: PhotoSourceModalProps) {
  const insets = useSafeAreaInsets();
  const safeBottomPadding = Math.max(insets.bottom + 16, 28);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.modalCard,
            {
              backgroundColor: cardBg,
              borderColor,
              paddingBottom: safeBottomPadding,
            },
          ]}
        >
          {/* HANDLE INDICATOR */}
          <View style={[styles.handleBar, { backgroundColor: isDark ? "#3A3A3C" : "#D1D1D6" }]} />

          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.modalTitle}>{title}</ThemedText>
              <ThemedText style={styles.modalSub}>{subtitle}</ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}
            >
              <Ionicons name="close" size={18} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
          </View>

          {/* OPTIONS LIST */}
          <View style={styles.optionsGroup}>
            {/* CAMERA OPTION */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: isDark ? "#252528" : "#F8FAFC", borderColor }]}
              onPress={() => {
                onClose();
                onSelectCamera();
              }}
            >
              <View style={[styles.iconBg, { backgroundColor: primaryColor + "18" }]}>
                <Ionicons name="camera" size={24} color={primaryColor} />
              </View>
              <View style={styles.optionTextCol}>
                <ThemedText style={styles.optionTitle}>Take Live Selfie (Camera)</ThemedText>
                <ThemedText style={styles.optionSub}>Use front camera for instant face capture</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? "#636366" : "#C7C7CC"} />
            </TouchableOpacity>

            {/* GALLERY OPTION */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: isDark ? "#252528" : "#F8FAFC", borderColor }]}
              onPress={() => {
                onClose();
                onSelectGallery();
              }}
            >
              <View style={[styles.iconBg, { backgroundColor: "#10B98118" }]}>
                <Ionicons name="images" size={24} color="#10B981" />
              </View>
              <View style={styles.optionTextCol}>
                <ThemedText style={styles.optionTitle}>Choose from Photo Gallery</ThemedText>
                <ThemedText style={styles.optionSub}>Select an existing selfie photo file</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? "#636366" : "#C7C7CC"} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handleBar: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsGroup: {
    gap: 12,
    marginTop: 4,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionSub: {
    fontSize: 11,
    opacity: 0.65,
    marginTop: 2,
  },
});
