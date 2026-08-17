import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { VerificationBadges, BadgeType } from "@/components/verification-badges";
import { IdentityForm } from "@/components/verification/identity-form";
import { BusinessForm } from "@/components/verification/business-form";
import { StoreForm } from "@/components/verification/store-form";
import { DobPickerModal } from "@/components/verification/dob-picker-modal";
import api from "@/config/api";

const PRIMARY_COLOR = "#3B82F6";

const ACTION_LEVELS = [
  {
    id: "identity",
    levelNum: 1,
    title: "Identity",
    subtitle: "Level 1 • Person",
    badge: "identity_verified",
    icon: "id-card-outline",
    color: PRIMARY_COLOR,
    tag: "Mandatory",
    desc: "Verifies the person operating the store (NIN, Passport, or Driver's License).",
    requirementText: "Required for all sellers.",
  },
  {
    id: "business",
    levelNum: 2,
    title: "Business",
    subtitle: "Level 2 • CAC",
    badge: "business_verified",
    icon: "business-outline",
    color: PRIMARY_COLOR,
    tag: "Optional",
    desc: "Verifies the registered business entity (CAC Certificate & Registration Number).",
    requirementText: "For registered business entities.",
  },
  {
    id: "physical_store",
    levelNum: 3,
    title: "Store",
    subtitle: "Level 3 • Location",
    badge: "store_verified",
    icon: "location-outline",
    color: PRIMARY_COLOR,
    tag: "Physical Shop",
    desc: "Verifies the physical market location (Shop address, suite number & storefront photo).",
    requirementText: "For physical market shops & supermarkets.",
  },
];

export default function SellerVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    typeSlug?: string;
    typeName?: string;
    storeName?: string;
  }>();

  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const storeName = params.storeName || user?.name || "Your Store";

  const [activeLevel, setActiveLevel] = useState("identity");
  const [showInfo, setShowInfo] = useState(false);
  const [idType, setIdType] = useState("bvn");
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessNo, setBusinessNo] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopNo, setShopNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [myBadges, setMyBadges] = useState<BadgeType[]>(["phone_verified"]);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F8F9FA";

  const [idDocumentUri, setIdDocumentUri] = useState<string | null>(null);
  const [selfieDocumentUri, setSelfieDocumentUri] = useState<string | null>(null);
  const [generalDocumentUri, setGeneralDocumentUri] = useState<string | null>(null);

  const pickImage = async (type: "id" | "selfie" | "general") => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant photo library access to upload documents.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === "id") setIdDocumentUri(uri);
        else if (type === "selfie") setSelfieDocumentUri(uri);
        else setGeneralDocumentUri(uri);
      }
    } catch (error: any) {
      Alert.alert(
        "Rebuild Required",
        "The app binary needs to compile native modules for image picking. Please restart your Android build using: npx expo run:android"
      );
    }
  };

  const currentLevelObj = ACTION_LEVELS.find((l) => l.id === activeLevel) || ACTION_LEVELS[0];

  const handleSubmitVerification = async () => {
    if (activeLevel === "identity") {
      if (!fullName.trim()) {
        Alert.alert("Required Field", "Please enter your full legal name as shown on your document.");
        return;
      }
      if (!idNumber.trim()) {
        Alert.alert(
          "Required Field",
          idType === "bvn" ? "Please enter your 11-digit BVN number." : "Please enter your Government ID number."
        );
        return;
      }
      if (idType === "bvn" && idNumber.trim().length !== 11) {
        Alert.alert("Invalid BVN Number", "Bank Verification Number (BVN) must be exactly 11 digits.");
        return;
      }
      if (!dob.trim()) {
        Alert.alert("Required Field", "Please select your Date of Birth.");
        return;
      }
      if (idType !== "bvn") {
        if (!idDocumentUri) {
          Alert.alert("Missing ID Document", "Please upload a photo of your official Government ID card.");
          return;
        }
        if (!selfieDocumentUri) {
          Alert.alert("Missing Live Selfie", "Please take and upload a live selfie photo holding your ID.");
          return;
        }
      }
    }

    if (activeLevel === "business") {
      if (!businessName.trim() || !businessNo.trim()) {
        Alert.alert("Required Field", "Please enter your registered business name and CAC number.");
        return;
      }
      if (!generalDocumentUri) {
        Alert.alert("Missing CAC Document", "Please upload your official CAC Certificate document.");
        return;
      }
    }

    if (activeLevel === "physical_store") {
      if (!shopAddress.trim() || !shopNo.trim()) {
        Alert.alert("Required Field", "Please enter your physical shop address and shop number.");
        return;
      }
      if (!generalDocumentUri) {
        Alert.alert("Missing Storefront Photo", "Please upload a photo of your physical shop front.");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("verification_type", String(activeLevel));

      if (activeLevel === "identity") {
        if (idType) formData.append("id_type", String(idType));
        if (fullName.trim()) formData.append("full_name", String(fullName.trim()));
        if (idNumber.trim()) formData.append("id_number", String(idNumber.trim()));
        if (dob.trim()) formData.append("dob", String(dob.trim()));

        if (idType !== "bvn") {
          if (idDocumentUri && typeof idDocumentUri === "string") {
            const filename = idDocumentUri.split("/").pop() || "id_card.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const fileType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
            formData.append("id_document", {
              uri: idDocumentUri,
              name: filename,
              type: fileType,
            } as any);
          }

          if (selfieDocumentUri && typeof selfieDocumentUri === "string") {
            const filename = selfieDocumentUri.split("/").pop() || "selfie.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const fileType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
            formData.append("selfie_document", {
              uri: selfieDocumentUri,
              name: filename,
              type: fileType,
            } as any);
          }
        }
      } else if (activeLevel === "business") {
        if (businessName.trim()) formData.append("business_name", String(businessName.trim()));
        if (businessNo.trim()) formData.append("business_no", String(businessNo.trim()));

        if (generalDocumentUri && typeof generalDocumentUri === "string") {
          const filename = generalDocumentUri.split("/").pop() || "cac_doc.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const fileType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
          formData.append("document", {
            uri: generalDocumentUri,
            name: filename,
            type: fileType,
          } as any);
        }
      } else if (activeLevel === "physical_store") {
        if (shopAddress.trim()) formData.append("shop_address", String(shopAddress.trim()));
        if (shopNo.trim()) formData.append("shop_no", String(shopNo.trim()));

        if (generalDocumentUri && typeof generalDocumentUri === "string") {
          const filename = generalDocumentUri.split("/").pop() || "storefront.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const fileType = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
          formData.append("document", {
            uri: generalDocumentUri,
            name: filename,
            type: fileType,
          } as any);
        }
      }

      const { status, json } = await new Promise<{ status: number; json: any }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", api.ENDPOINTS.VENDOR.VERIFICATIONS);
        xhr.setRequestHeader("Accept", "application/json");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.onload = () => {
          try {
            const parsed = JSON.parse(xhr.responseText);
            resolve({ status: xhr.status, json: parsed });
          } catch (e) {
            resolve({ status: xhr.status, json: { message: xhr.responseText || "Server response format error" } });
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network connection error submitting verification."));
        };

        xhr.send(formData as any);
      });

      if (status >= 200 && status < 300) {
        showToast("Verification documents & details uploaded successfully!", "success");

        if (activeLevel === "identity" && !myBadges.includes("identity_verified")) {
          setMyBadges([...myBadges, "identity_verified"]);
        } else if (activeLevel === "business" && !myBadges.includes("business_verified")) {
          setMyBadges([...myBadges, "business_verified"]);
        } else if (activeLevel === "physical_store" && !myBadges.includes("store_verified")) {
          setMyBadges([...myBadges, "store_verified"]);
        }
      } else {
        const errorMsg = json.message || (json.errors ? Object.values(json.errors).flat().join("\n") : "Failed to submit verification request.");
        showToast(errorMsg, "error");
        Alert.alert("Submission Error", errorMsg);
      }
    } catch (error: any) {
      console.error("Verification submit error:", error);
      showToast(error.message || "Network error submitting verification.", "error");
      Alert.alert("Network Error", error.message || "Could not connect to verification server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* HEADER & BADGES CARD */}
          <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.headerTop}>
              <View>
                <ThemedText style={styles.headerTitle}>{storeName}</ThemedText>
                <ThemedText style={styles.headerSub}>Store Verification & Security Center</ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setShowInfo(!showInfo)}
                style={[styles.infoToggleBtn, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}
              >
                <Ionicons name={showInfo ? "close" : "information-circle-outline"} size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <VerificationBadges badges={myBadges} sellerName={storeName} />

            {/* COLLAPSIBLE PILLARS EXPLANATION */}
            {showInfo && (
              <View style={[styles.infoDrawer, { backgroundColor: isDark ? "#252528" : "#F8FAFC", borderColor }]}>
                <ThemedText style={styles.infoDrawerTitle}>3 Verification Pillars</ThemedText>
                <View style={styles.pillarList}>
                  <View style={styles.pillarRow}>
                    <Ionicons name="id-card-outline" size={14} color={PRIMARY_COLOR} />
                    <ThemedText style={styles.pillarItem}>
                      <ThemedText style={{ fontWeight: "700" }}>Identity:</ThemedText> Verifies the person (NIN/Passport). Required for all sellers.
                    </ThemedText>
                  </View>
                  <View style={styles.pillarRow}>
                    <Ionicons name="business-outline" size={14} color={PRIMARY_COLOR} />
                    <ThemedText style={styles.pillarItem}>
                      <ThemedText style={{ fontWeight: "700" }}>Business:</ThemedText> Verifies CAC business registration (Optional for informal sellers).
                    </ThemedText>
                  </View>
                  <View style={styles.pillarRow}>
                    <Ionicons name="location-outline" size={14} color={PRIMARY_COLOR} />
                    <ThemedText style={styles.pillarItem}>
                      <ThemedText style={{ fontWeight: "700" }}>Store:</ThemedText> Verifies physical shop address & location.
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ACTION LEVEL TABS */}
          <ThemedText style={[styles.sectionLabel, { color: isDark ? "#8E8E93" : "#6C6C70" }]}>
            SELECT VERIFICATION TIER
          </ThemedText>

          <View style={styles.tabRow}>
            {ACTION_LEVELS.map((lvl) => {
              const isSelected = activeLevel === lvl.id;
              const isVerified = myBadges.includes(lvl.badge as BadgeType);

              return (
                <TouchableOpacity
                  key={lvl.id}
                  style={[
                    styles.tabChip,
                    { backgroundColor: cardBg, borderColor },
                    isSelected && { borderColor: lvl.color, backgroundColor: lvl.color + "15", borderWidth: 2 },
                  ]}
                  onPress={() => setActiveLevel(lvl.id)}
                >
                  <View style={[styles.tabIconBg, { backgroundColor: lvl.color + "20" }]}>
                    <Ionicons name={lvl.icon as any} size={16} color={lvl.color} />
                  </View>
                  <View style={styles.tabTextCol}>
                    <ThemedText
                      numberOfLines={1}
                      style={[styles.tabTitle, isSelected && { color: lvl.color, fontWeight: "800" }]}
                    >
                      {lvl.title}
                    </ThemedText>
                    <ThemedText numberOfLines={1} style={styles.tabSub}>
                      Lvl {lvl.levelNum}
                    </ThemedText>
                  </View>
                  {isVerified && <Ionicons name="checkmark-circle" size={14} color="#10B981" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ACTIVE LEVEL FORM PANEL */}
          <View style={[styles.formCard, { backgroundColor: cardBg, borderColor, borderTopColor: currentLevelObj.color, borderTopWidth: 3 }]}>
            <View style={styles.levelBanner}>
              <View style={[styles.levelIconBg, { backgroundColor: currentLevelObj.color + "18" }]}>
                <Ionicons name={currentLevelObj.icon as any} size={24} color={currentLevelObj.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ThemedText style={styles.levelCardTitle}>{currentLevelObj.title} Verification</ThemedText>
                  <View style={[styles.tagPill, { backgroundColor: currentLevelObj.color + "20" }]}>
                    <ThemedText style={[styles.tagText, { color: currentLevelObj.color }]}>{currentLevelObj.tag}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.levelCardDesc}>{currentLevelObj.desc}</ThemedText>
              </View>
            </View>
            {/* LEVEL 1: IDENTITY */}
            {activeLevel === "identity" && (
              <IdentityForm
                idType={idType}
                setIdType={setIdType}
                fullName={fullName}
                setFullName={setFullName}
                idNumber={idNumber}
                setIdNumber={setIdNumber}
                dob={dob}
                onOpenDatePicker={() => setShowDatePicker(true)}
                idDocumentUri={idDocumentUri}
                selfieDocumentUri={selfieDocumentUri}
                onPickImage={pickImage}
                isDark={isDark}
                inputBg={inputBg}
                borderColor={borderColor}
                primaryColor={PRIMARY_COLOR}
              />
            )}

            {/* LEVEL 2: BUSINESS */}
            {activeLevel === "business" && (
              <BusinessForm
                businessName={businessName}
                setBusinessName={setBusinessName}
                businessNo={businessNo}
                setBusinessNo={setBusinessNo}
                generalDocumentUri={generalDocumentUri}
                onPickImage={() => pickImage("general")}
                isDark={isDark}
                inputBg={inputBg}
                borderColor={borderColor}
                primaryColor={PRIMARY_COLOR}
              />
            )}

            {/* LEVEL 3: PHYSICAL STORE */}
            {activeLevel === "physical_store" && (
              <StoreForm
                shopAddress={shopAddress}
                setShopAddress={setShopAddress}
                shopNo={shopNo}
                setShopNo={setShopNo}
                generalDocumentUri={generalDocumentUri}
                onPickImage={() => pickImage("general")}
                isDark={isDark}
                inputBg={inputBg}
                borderColor={borderColor}
                primaryColor={PRIMARY_COLOR}
              />
            )}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: currentLevelObj.color }, loading && { opacity: 0.7 }]}
              onPress={handleSubmitVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
                  <ThemedText style={styles.submitBtnText}>Save & Submit for Review</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* AUTOMATED STATUSES COMPACT SUMMARY */}
          <View style={[styles.autoLevelsCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.autoRow}>
              <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.autoTitle}>Level 0 — Account Verified</ThemedText>
                <ThemedText style={styles.autoSub}>Phone & OTP automatically validated</ThemedText>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <View style={styles.autoRow}>
              <Ionicons name="star-outline" size={18} color={PRIMARY_COLOR} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.autoTitle}>Level 4 — Trusted Seller</ThemedText>
                <ThemedText style={styles.autoSub}>Earned through order history & low dispute rates</ThemedText>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* DATE OF BIRTH SELECTOR MODAL */}
      <DobPickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(formattedDob) => setDob(formattedDob)}
        isDark={isDark}
        cardBg={cardBg}
        borderColor={borderColor}
        insetsBottom={insets.bottom}
        primaryColor={PRIMARY_COLOR}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 160, gap: 10 },
  headerCard: { padding: 12, borderRadius: 16, borderWidth: 1, gap: 8 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 15, fontWeight: "800" },
  headerSub: { fontSize: 11, opacity: 0.6, marginTop: 1 },
  infoToggleBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  infoDrawer: { padding: 10, borderRadius: 12, borderWidth: 1, gap: 4 },
  infoDrawerTitle: { fontSize: 11, fontWeight: "800" },
  pillarList: { gap: 4, marginTop: 2 },
  pillarRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pillarItem: { flex: 1, fontSize: 10.5, opacity: 0.85, lineHeight: 15 },
  sectionLabel: { fontSize: 10.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabIconBg: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  tabTextCol: { flex: 1, justifyContent: "center" },
  tabTitle: { fontSize: 11.5, fontWeight: "700" },
  tabSub: { fontSize: 9.5, opacity: 0.6, marginTop: 1 },
  formCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  levelBanner: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  levelIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  levelCardTitle: { fontSize: 15, fontWeight: "800" },
  tagPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: "800" },
  levelCardDesc: { fontSize: 12, opacity: 0.7, marginTop: 2, lineHeight: 16 },
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
    marginTop: 2,
  },
  uploadTitle: { fontSize: 13, fontWeight: "700" },
  uploadSub: { fontSize: 11, opacity: 0.6 },
  submitBtn: { height: 48, borderRadius: 24, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 6 },
  submitBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  autoLevelsCard: { padding: 14, borderRadius: 18, borderWidth: 1, gap: 10, marginTop: 4 },
  autoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  autoTitle: { fontSize: 12, fontWeight: "700" },
  autoSub: { fontSize: 11, opacity: 0.6 },
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, gap: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: "800" },
  pickerRow: { flexDirection: "row", gap: 10, height: 180, marginTop: 6 },
  pickerCol: { flex: 1, gap: 6 },
  pickerColLabel: { fontSize: 11, fontWeight: "700", textAlign: "center", opacity: 0.6, textTransform: "uppercase" },
  scrollCol: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "rgba(140, 140, 140, 0.2)" },
  pickerItem: { paddingVertical: 8, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  pickerItemText: { fontSize: 13, fontWeight: "600" },
});
