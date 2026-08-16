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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { VerificationBadges, BadgeType } from "@/components/verification-badges";
import api from "@/config/api";

const VERIFICATION_LEVELS = [
  {
    id: "account",
    levelNum: 0,
    title: "Level 0 — Account Verified",
    badge: "phone_verified",
    icon: "checkmark-done-circle-outline",
    color: "#10B981",
    desc: "Email address & Phone/OTP number verification.",
    requirementText: "Automated upon account creation.",
  },
  {
    id: "identity",
    levelNum: 1,
    title: "Level 1 — Identity Verified (Mandatory)",
    badge: "identity_verified",
    icon: "person-checkmark-outline",
    color: "#3B82F6",
    desc: "Verifies the PERSON operating the store (NIN, Driver's License, Passport, or Selfie).",
    requirementText: "Required for all sellers (Physical, Online/WhatsApp & Digital Marketers).",
  },
  {
    id: "business",
    levelNum: 2,
    title: "Level 2 — Business Verified",
    badge: "business_verified",
    icon: "briefcase-outline",
    color: "#8B5CF6",
    desc: "Verifies the REGISTERED BUSINESS (CAC Certificate & Registration Number).",
    requirementText: "For registered businesses. Informal market sellers can remain Identity Verified.",
  },
  {
    id: "physical_store",
    levelNum: 3,
    title: "Level 3 — Store Verified",
    badge: "store_verified",
    icon: "storefront-outline",
    color: "#F59E0B",
    desc: "Verifies the PHYSICAL LOCATION (Shop address, shop number, storefront & interior photo).",
    requirementText: "For physical market shops & supermarkets. Not required for Online/WhatsApp sellers.",
  },
  {
    id: "trusted_seller",
    levelNum: 4,
    title: "Level 4 — Trusted Seller",
    badge: "trusted_seller",
    icon: "star-outline",
    color: "#EC4899",
    desc: "Earned badge based on account age, successful orders, low complaint rate, and customer ratings.",
    requirementText: "Earned automatically through activity. Cannot be purchased.",
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

  const typeSlug = (params.typeSlug || "").toLowerCase();
  const typeName = params.typeName || "";
  const storeName = params.storeName || user?.name || "Your Store";

  const [activeLevel, setActiveLevel] = useState("identity");
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

  const handleSubmitVerification = async () => {
    if (activeLevel === "identity") {
      if (!fullName.trim()) {
        Alert.alert("Required", "Please enter your full legal name as shown on your ID.");
        return;
      }
      if (!idNumber.trim()) {
        Alert.alert("Required", "Please enter your Government ID / NIN number.");
        return;
      }
    }

    if (activeLevel === "business" && (!businessName.trim() || !businessNo.trim())) {
      Alert.alert("Required", "Please enter your registered business name and CAC number.");
      return;
    }

    if (activeLevel === "physical_store" && (!shopAddress.trim() || !shopNo.trim())) {
      Alert.alert("Required", "Please enter your physical shop address and shop number.");
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
        showToast("Verification request submitted & saved to database!", "success");

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ACTIVE BADGES */}
        <View style={[styles.badgesCard, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.cardTitle}>Your Verification Badges</ThemedText>
          <VerificationBadges badges={myBadges} sellerName={storeName} />
        </View>

        {/* 3-TIER DISTINCTION EXPLANATION CARD */}
        <View style={[styles.distinctionCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.distinctionHeader}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#3B82F6" />
            <ThemedText style={styles.distinctionTitle}>3 Verification Pillars</ThemedText>
          </View>
          <ThemedText style={styles.distinctionSub}>
            Mini Mart verifies the <ThemedText style={{ fontWeight: "800", color: "#3B82F6" }}>Person</ThemedText>, the <ThemedText style={{ fontWeight: "800", color: "#8B5CF6" }}>Business</ThemedText>, and the <ThemedText style={{ fontWeight: "800", color: "#F59E0B" }}>Location</ThemedText> separately:
          </ThemedText>
          <View style={styles.pillarList}>
            <ThemedText style={styles.pillarItem}>
              👤 <ThemedText style={{ fontWeight: "700" }}>Identity Verification:</ThemedText> Verifies the PERSON (NIN/Passport/ID). Required for all sellers.
            </ThemedText>
            <ThemedText style={styles.pillarItem}>
              🏢 <ThemedText style={{ fontWeight: "700" }}>Business Verification:</ThemedText> Verifies the CAC BUSINESS (Optional for informal sellers).
            </ThemedText>
            <ThemedText style={styles.pillarItem}>
              📍 <ThemedText style={{ fontWeight: "700" }}>Store Verification:</ThemedText> Verifies PHYSICAL SHOPS (Not required for Online/WhatsApp sellers).
            </ThemedText>
          </View>
        </View>

        {/* LEVEL SELECTOR */}
        <ThemedText style={[styles.sectionLabel, { color: isDark ? "#8E8E93" : "#6C6C70" }]}>
          SELLER VERIFICATION LEVELS (0 – 4)
        </ThemedText>

        <View style={styles.levelList}>
          {VERIFICATION_LEVELS.map((lvl) => {
            const isSelected = activeLevel === lvl.id;
            const isUnlocked = myBadges.includes(lvl.badge as BadgeType);

            return (
              <TouchableOpacity
                key={lvl.id}
                style={[
                  styles.levelCard,
                  { backgroundColor: cardBg, borderColor },
                  isSelected && { borderColor: lvl.color, borderWidth: 2 },
                ]}
                onPress={() => {
                  if (lvl.id !== "account" && lvl.id !== "trusted_seller") {
                    setActiveLevel(lvl.id);
                  }
                }}
              >
                <View style={styles.levelHeader}>
                  <View style={[styles.iconBg, { backgroundColor: lvl.color + "18" }]}>
                    <Ionicons name={lvl.icon as any} size={22} color={lvl.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.levelTitle}>{lvl.title}</ThemedText>
                    <ThemedText style={styles.levelDesc}>{lvl.desc}</ThemedText>
                    <ThemedText style={[styles.levelReq, { color: lvl.color }]}>{lvl.requirementText}</ThemedText>
                  </View>
                  {isUnlocked && (
                    <View style={styles.unlockedTag}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SUBMISSION FORM */}
        {(activeLevel === "identity" || activeLevel === "business" || activeLevel === "physical_store") && (
          <View style={[styles.formCard, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardTitle}>
              Submit {activeLevel === "identity" ? "Identity" : activeLevel === "business" ? "Business" : "Store"} Verification
            </ThemedText>

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

            {/* DUMMY UPLOAD BOX */}
            <TouchableOpacity style={[styles.uploadBox, { borderColor: isDark ? "#3A3A3C" : "#D1D5DB" }]}>
              <Ionicons name="cloud-upload-outline" size={28} color="#3B82F6" />
              <ThemedText style={styles.uploadTitle}>
                Tap to Upload {activeLevel === "identity" ? "ID Card / Selfie" : activeLevel === "business" ? "CAC Certificate" : "Storefront & Interior Photo"}
              </ThemedText>
              <ThemedText style={styles.uploadSub}>Secure Private Stream (Admin Authorized Only)</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: "#3B82F6" }, loading && { opacity: 0.7 }]}
              onPress={handleSubmitVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.submitBtnText}>Save & Submit for Review</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },
  badgesCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  distinctionCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 10 },
  distinctionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  distinctionTitle: { fontSize: 15, fontWeight: "800" },
  distinctionSub: { fontSize: 12, opacity: 0.8, lineHeight: 17 },
  pillarList: { gap: 6, marginTop: 4 },
  pillarItem: { fontSize: 12, opacity: 0.85, lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  levelList: { gap: 10 },
  levelCard: { padding: 14, borderRadius: 16, borderWidth: 1 },
  levelHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBg: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  levelTitle: { fontSize: 14, fontWeight: "700" },
  levelDesc: { fontSize: 11, opacity: 0.7, marginTop: 2, lineHeight: 15 },
  levelReq: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  unlockedTag: { paddingLeft: 6 },
  formCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  requiredStar: { color: "#EF4444", fontWeight: "800" },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  uploadBox: {
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3B82F608",
  },
  uploadTitle: { fontSize: 13, fontWeight: "700", color: "#3B82F6" },
  uploadSub: { fontSize: 11, opacity: 0.6 },
  submitBtn: { height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginTop: 6 },
  submitBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
