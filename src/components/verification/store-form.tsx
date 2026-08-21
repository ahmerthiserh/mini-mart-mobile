import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { PhotoSourceModal } from "@/components/verification/photo-source-modal";

type StoreFormProps = {
  shopAddress: string;
  setShopAddress: (val: string) => void;
  shopNo: string;
  setShopNo: (val: string) => void;
  generalDocumentUri: string | null;
  onPickImage: () => void;
  onTakeCameraPhoto: () => void;
  isDark: boolean;
  inputBg: string;
  borderColor: string;
  primaryColor: string;
};

export function StoreForm({
  shopAddress,
  setShopAddress,
  shopNo,
  setShopNo,
  generalDocumentUri,
  onPickImage,
  onTakeCameraPhoto,
  isDark,
  inputBg,
  borderColor,
  primaryColor,
}: StoreFormProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          Full Physical Shop Address <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
          placeholder="e.g. Kantin Kwari Market, Kano"
          placeholderTextColor={isDark ? "#8E8E93" : "#999"}
          value={shopAddress}
          onChangeText={setShopAddress}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          Shop / Storefront Number <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
          placeholder="e.g. Shop B4, 2nd Floor"
          placeholderTextColor={isDark ? "#8E8E93" : "#999"}
          value={shopNo}
          onChangeText={setShopNo}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.uploadBox,
          { borderColor: primaryColor + "60", backgroundColor: primaryColor + "0A" },
          generalDocumentUri ? { borderStyle: "solid", borderColor: primaryColor } : null,
        ]}
        onPress={() => setShowPhotoModal(true)}
      >
        {generalDocumentUri ? (
          <View style={styles.uploadedRow}>
            <Image source={{ uri: generalDocumentUri }} style={styles.thumbImage} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.uploadTitle, { color: primaryColor }]}>
                Storefront Photo Selected
              </ThemedText>
              <ThemedText style={styles.uploadSub}>Tap to change selected storefront photo</ThemedText>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          </View>
        ) : (
          <>
            <Ionicons name="images-outline" size={24} color={primaryColor} />
            <ThemedText style={[styles.uploadTitle, { color: primaryColor }]}>
              Upload Storefront & Interior Photo <ThemedText style={styles.requiredStar}>*</ThemedText>
            </ThemedText>
            <ThemedText style={styles.uploadSub}>Take live camera photo or pick from gallery</ThemedText>
          </>
        )}
      </TouchableOpacity>

      <PhotoSourceModal
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSelectCamera={onTakeCameraPhoto}
        onSelectGallery={onPickImage}
        title="Storefront & Interior Photo"
        subtitle="Choose how you want to capture your physical market store photo"
        isDark={isDark}
        cardBg={isDark ? "#1C1C1E" : "#FFFFFF"}
        borderColor={borderColor}
        primaryColor={primaryColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  requiredStar: { color: "#EF4444", fontWeight: "800" },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  uploadBox: {
    height: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 3,
    marginTop: 4,
  },
  uploadedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbImage: { width: 44, height: 44, borderRadius: 8 },
  uploadTitle: { fontSize: 13, fontWeight: "700" },
  uploadSub: { fontSize: 11, opacity: 0.6 },
});
