import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, TextInput, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type IdentityFormProps = {
  idType: string;
  setIdType: (val: string) => void;
  fullName: string;
  setFullName: (val: string) => void;
  idNumber: string;
  setIdNumber: (val: string) => void;
  dob: string;
  onOpenDatePicker: () => void;
  idDocumentUri: string | null;
  selfieDocumentUri: string | null;
  onPickImage: (type: "id" | "selfie") => void;
  isDark: boolean;
  inputBg: string;
  borderColor: string;
  primaryColor: string;
};

const ID_TYPES = [
  { id: "bvn", label: "BVN (Bank Verification Number)", sub: "Instant Digital Verification (No Photo Required)" },
  { id: "nin", label: "NIN (National Identity Number)", sub: "Requires Government ID Card photo & selfie" },
  { id: "voters_card", label: "Voter's Card", sub: "Requires official Voter's card photo & selfie" },
  { id: "drivers_license", label: "Driver's License", sub: "Requires valid FRSC license photo & selfie" },
  { id: "passport", label: "International Passport", sub: "Requires data page photo & live selfie" },
];

export function IdentityForm({
  idType,
  setIdType,
  fullName,
  setFullName,
  idNumber,
  setIdNumber,
  dob,
  onOpenDatePicker,
  idDocumentUri,
  selfieDocumentUri,
  onPickImage,
  isDark,
  inputBg,
  borderColor,
  primaryColor,
}: IdentityFormProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isBvn = idType === "bvn";
  const selectedTypeObj = ID_TYPES.find((t) => t.id === idType) || ID_TYPES[0];

  return (
    <View style={styles.container}>
      {/* ID TYPE SELECTOR DROPDOWN */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          Document Type <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>

        <TouchableOpacity
          style={[styles.dropdownTrigger, { backgroundColor: inputBg, borderColor }]}
          onPress={() => setShowDropdown(true)}
        >
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.dropdownValueText}>{selectedTypeObj.label}</ThemedText>
            <ThemedText style={styles.dropdownSubText}>{selectedTypeObj.sub}</ThemedText>
          </View>
          <Ionicons name="chevron-down" size={20} color={primaryColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          Full Legal Name <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
          placeholder="As shown on official document"
          placeholderTextColor={isDark ? "#8E8E93" : "#999"}
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          {isBvn ? "11-Digit BVN Number" : "Government ID / Document Number"} <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
          placeholder={isBvn ? "e.g. 22233344455" : "e.g. 12345678901"}
          placeholderTextColor={isDark ? "#8E8E93" : "#999"}
          keyboardType={isBvn ? "numeric" : "default"}
          maxLength={isBvn ? 11 : 30}
          value={idNumber}
          onChangeText={setIdNumber}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          Date of Birth <ThemedText style={styles.requiredStar}>*</ThemedText>
        </ThemedText>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: inputBg, borderColor, justifyContent: "center" }]}
          onPress={onOpenDatePicker}
        >
          <View style={styles.dobRow}>
            <ThemedText
              style={{
                color: dob ? (isDark ? "#FFF" : "#000") : isDark ? "#8E8E93" : "#999",
                fontSize: 14,
              }}
            >
              {dob || "Select Date of Birth (DD / MM / YYYY)"}
            </ThemedText>
            <Ionicons name="calendar-outline" size={18} color={primaryColor} />
          </View>
        </TouchableOpacity>
      </View>

      {/* IF BVN: SHOW INSTANT VERIFICATION BADGE WITHOUT IMAGE UPLOAD */}
      {isBvn ? (
        <View style={[styles.bvnNoticeBox, { backgroundColor: primaryColor + "10", borderColor: primaryColor + "40" }]}>
          <Ionicons name="shield-checkmark" size={22} color={primaryColor} />
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.bvnNoticeTitle, { color: primaryColor }]}>
              Instant Digital BVN Verification
            </ThemedText>
            <ThemedText style={styles.bvnNoticeSub}>
              No document photos or selfies required! Your BVN will be automatically verified against bank databases.
            </ThemedText>
          </View>
        </View>
      ) : (
        /* UPLOAD DOCUMENT CARDS FOR NON-BVN ID TYPES */
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              { borderColor: primaryColor + "60", backgroundColor: primaryColor + "0A" },
              idDocumentUri ? { borderStyle: "solid", borderColor: primaryColor } : null,
            ]}
            onPress={() => onPickImage("id")}
          >
            {idDocumentUri ? (
              <View style={styles.uploadedRow}>
                <Image source={{ uri: idDocumentUri }} style={styles.thumbImage} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.uploadTitle, { color: primaryColor }]}>
                    Government ID Selected
                  </ThemedText>
                  <ThemedText style={styles.uploadSub}>Tap to change selected ID photo</ThemedText>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </View>
            ) : (
              <>
                <Ionicons name="id-card-outline" size={24} color={primaryColor} />
                <ThemedText style={[styles.uploadTitle, { color: primaryColor }]}>
                  Upload Government ID Card Photo
                </ThemedText>
                <ThemedText style={styles.uploadSub}>Clear front photo of official ID document</ThemedText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.uploadBox,
              { borderColor: primaryColor + "60", backgroundColor: primaryColor + "0A" },
              selfieDocumentUri ? { borderStyle: "solid", borderColor: primaryColor } : null,
            ]}
            onPress={() => onPickImage("selfie")}
          >
            {selfieDocumentUri ? (
              <View style={styles.uploadedRow}>
                <Image source={{ uri: selfieDocumentUri }} style={styles.thumbImage} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.uploadTitle, { color: primaryColor }]}>
                    Live Selfie Photo Selected
                  </ThemedText>
                  <ThemedText style={styles.uploadSub}>Tap to retake / change selfie</ThemedText>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </View>
            ) : (
              <>
                <Ionicons name="camera-outline" size={24} color={primaryColor} />
                <ThemedText style={[styles.uploadTitle, { color: primaryColor }]}>
                  Take / Upload Live Selfie Photo
                </ThemedText>
                <ThemedText style={styles.uploadSub}>Clear facial selfie holding your ID for verification</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* DROPDOWN SELECTION MODAL */}
      <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFF", borderColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Document Type</ThemedText>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={22} color={isDark ? "#FFF" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionList}>
              {ID_TYPES.map((item) => {
                const isSelected = idType === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionItem,
                      { borderColor },
                      isSelected && { backgroundColor: primaryColor + "15", borderColor: primaryColor },
                    ]}
                    onPress={() => {
                      setIdType(item.id);
                      setShowDropdown(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.optionLabel, isSelected && { color: primaryColor, fontWeight: "800" }]}>
                        {item.label}
                      </ThemedText>
                      <ThemedText style={styles.optionSub}>{item.sub}</ThemedText>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={primaryColor} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  requiredStar: { color: "#EF4444", fontWeight: "800" },
  dropdownTrigger: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValueText: { fontSize: 13.5, fontWeight: "700" },
  dropdownSubText: { fontSize: 10.5, opacity: 0.6, marginTop: 2 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  dobRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bvnNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  bvnNoticeTitle: { fontSize: 13, fontWeight: "800" },
  bvnNoticeSub: { fontSize: 11.5, opacity: 0.7, marginTop: 2, lineHeight: 16 },
  uploadContainer: { gap: 10, marginTop: 4 },
  uploadBox: {
    height: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 3,
  },
  uploadedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbImage: { width: 44, height: 44, borderRadius: 8 },
  uploadTitle: { fontSize: 13, fontWeight: "700" },
  uploadSub: { fontSize: 11, opacity: 0.6 },

  /* MODAL STYLES */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: "800" },
  optionList: { gap: 8 },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  optionLabel: { fontSize: 13, fontWeight: "700" },
  optionSub: { fontSize: 11, opacity: 0.6, marginTop: 2 },
});
