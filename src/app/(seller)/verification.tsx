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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { VerificationBadges, BadgeType } from "@/components/verification-badges";
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
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const storeName = params.storeName || user?.name || "Your Store";

  const [activeLevel, setActiveLevel] = useState("identity");
  const [showInfo, setShowInfo] = useState(false);
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessNo, setBusinessNo] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopNo, setShopNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [myBadges, setMyBadges] = useState<BadgeType[]>(["phone_verified"]);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F8F9FA";

  const currentLevelObj = ACTION_LEVELS.find((l) => l.id === activeLevel) || ACTION_LEVELS[0];

  const handleSubmitVerification = async () => {
    if (activeLevel === "identity") {
      if (!fullName.trim()) {
        Alert.alert("Required Field", "Please enter your full legal name as shown on your ID.");
        return;
      }
      if (!idNumber.trim()) {
        Alert.alert("Required Field", "Please enter your Government ID / NIN number.");
        return;
      }
    }

    if (activeLevel === "business" && (!businessName.trim() || !businessNo.trim())) {
      Alert.alert("Required Field", "Please enter your registered business name and CAC number.");
      return;
    }

    if (activeLevel === "physical_store" && (!shopAddress.trim() || !shopNo.trim())) {
      Alert.alert("Required Field", "Please enter your physical shop address and shop number.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        verification_type: activeLevel,
        full_name: fullName.trim() || undefined,
        id_number: idNumber.trim() || undefined,
        dob: dob.trim() || undefined,
        business_name: businessName.trim() || undefined,
        business_no: businessNo.trim() || undefined,
        shop_address: shopAddress.trim() || undefined,
        shop_no: shopNo.trim() || undefined,
      };

      const response = await fetch(api.ENDPOINTS.VENDOR.VERIFICATIONS, {
        method: "POST",
        headers: api.getHeaders(token),
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (response.ok || response.status === 201) {
        showToast("Verification request submitted & saved!", "success");

        if (activeLevel === "identity" && !myBadges.includes("identity_verified")) {
          setMyBadges([...myBadges, "identity_verified"]);
        } else if (activeLevel === "business" && !myBadges.includes("business_verified")) {
          setMyBadges([...myBadges, "business_verified"]);
        } else if (activeLevel === "physical_store" && !myBadges.includes("store_verified")) {
          setMyBadges([...myBadges, "store_verified"]);
        }
      } else {
        showToast(json.message || "Failed to submit verification request.", "error");
      }
    } catch (error) {
      showToast("Network error submitting verification.", "error");
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
              <>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>
                    Full Legal Name <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                    placeholder="As shown on official ID card"
                    placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>
                    Government ID / NIN / Driver's License No. <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                    placeholder="e.g. 12345678901"
                    placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                    value={idNumber}
                    onChangeText={setIdNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Date of Birth</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                    placeholder="DD / MM / YYYY"
                    placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                    value={dob}
                    onChangeText={setDob}
                  />
                </View>
              </>
            )}

            {/* LEVEL 2: BUSINESS */}
            {activeLevel === "business" && (
              <>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>
                    Registered Business Name <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                    placeholder="e.g. Mini Mart Logistics Ltd"
                    placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>
                    CAC Registration Number <ThemedText style={styles.requiredStar}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                    placeholder="e.g. RC 1234567"
                    placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                    value={businessNo}
                    onChangeText={setBusinessNo}
                  />
                </View>
              </>
            )}

            {/* LEVEL 3: PHYSICAL STORE */}
            {activeLevel === "physical_store" && (
              <>
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
              </>
            )}

            {/* UPLOAD DOCUMENT CARDS */}
            {activeLevel === "identity" ? (
              <View style={{ gap: 8 }}>
                <TouchableOpacity style={[styles.uploadBox, { borderColor: PRIMARY_COLOR + "60", backgroundColor: PRIMARY_COLOR + "0A" }]}>
                  <Ionicons name="id-card-outline" size={24} color={PRIMARY_COLOR} />
                  <ThemedText style={[styles.uploadTitle, { color: PRIMARY_COLOR }]}>
                    Upload Government ID Card (NIN / Driver's License / Passport)
                  </ThemedText>
                  <ThemedText style={styles.uploadSub}>Clear front photo of official ID document</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.uploadBox, { borderColor: PRIMARY_COLOR + "60", backgroundColor: PRIMARY_COLOR + "0A" }]}>
                  <Ionicons name="camera-outline" size={24} color={PRIMARY_COLOR} />
                  <ThemedText style={[styles.uploadTitle, { color: PRIMARY_COLOR }]}>
                    Take / Upload Live Selfie Photo
                  </ThemedText>
                  <ThemedText style={styles.uploadSub}>Clear facial selfie holding your ID for verification</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.uploadBox, { borderColor: PRIMARY_COLOR + "60", backgroundColor: PRIMARY_COLOR + "0A" }]}>
                <Ionicons
                  name={activeLevel === "business" ? "document-text-outline" : "images-outline"}
                  size={24}
                  color={PRIMARY_COLOR}
                />
                <ThemedText style={[styles.uploadTitle, { color: PRIMARY_COLOR }]}>
                  Upload {activeLevel === "business" ? "CAC Certificate Document" : "Storefront & Interior Photo"}
                </ThemedText>
                <ThemedText style={styles.uploadSub}>Encrypted stream (Admin verification access only)</ThemedText>
              </TouchableOpacity>
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
});
