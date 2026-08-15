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
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { VerificationBadges, BadgeType } from "@/components/verification-badges";

const VERIFICATION_LEVELS = [
  {
    id: "identity",
    title: "Level 1 — Identity Verification",
    badge: "identity_verified",
    icon: "person-checkmark-outline",
    color: "#3B82F6",
    desc: "Government-issued ID card, international passport, or driver's license.",
    fields: ["Full Legal Name", "ID Type & Number", "Upload ID Photo"],
  },
  {
    id: "business",
    title: "Level 2 — Business Verification",
    badge: "business_verified",
    icon: "briefcase-outline",
    color: "#8B5CF6",
    desc: "CAC / Business Registration Certificate and tax/business document.",
    fields: ["Business Name", "Registration Number (CAC)", "Upload Business Document"],
  },
  {
    id: "physical_store",
    title: "Level 3 — Physical Store Verification",
    badge: "store_verified",
    icon: "storefront-outline",
    color: "#F59E0B",
    desc: "Physical shop address, shop number, storefront photo, and interior photo.",
    fields: ["Full Shop Address & Shop No.", "Upload Storefront Photo", "Upload Interior Photo"],
  },
];

export default function SellerVerificationScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeLevel, setActiveLevel] = useState("identity");
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [businessNo, setBusinessNo] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [myBadges, setMyBadges] = useState<BadgeType[]>(["phone_verified"]);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F8F9FA";

  const handleSubmitVerification = async () => {
    if (activeLevel === "identity" && !fullName.trim()) {
      Alert.alert("Required", "Please enter your full legal name as shown on your ID.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showToast("Verification documents submitted for review!", "success");

      // Mock level unlock
      if (activeLevel === "identity" && !myBadges.includes("identity_verified")) {
        setMyBadges([...myBadges, "identity_verified"]);
      } else if (activeLevel === "business" && !myBadges.includes("business_verified")) {
        setMyBadges([...myBadges, "business_verified"]);
      } else if (activeLevel === "physical_store" && !myBadges.includes("store_verified")) {
        setMyBadges([...myBadges, "store_verified"]);
      }
    } catch (error) {
      showToast("Failed to submit verification. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={isDark ? "#FFF" : "#000"} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Seller Verification</ThemedText>
        </View>

        {/* ACTIVE BADGES */}
        <View style={[styles.badgesCard, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.cardTitle}>Your Verification Badges</ThemedText>
          <VerificationBadges badges={myBadges} sellerName={user?.name || "Your Store"} />
        </View>

        {/* LEVEL SELECTOR */}
        <ThemedText style={[styles.sectionLabel, { color: isDark ? "#8E8E93" : "#6C6C70" }]}>
          VERIFICATION LEVELS
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
                onPress={() => setActiveLevel(lvl.id)}
              >
                <View style={styles.levelHeader}>
                  <View style={[styles.iconBg, { backgroundColor: lvl.color + "18" }]}>
                    <Ionicons name={lvl.icon as any} size={22} color={lvl.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.levelTitle}>{lvl.title}</ThemedText>
                    <ThemedText style={styles.levelDesc}>{lvl.desc}</ThemedText>
                  </View>
                  {isUnlocked && (
                    <View style={styles.unlockedTag}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SUBMISSION FORM */}
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.cardTitle}>Submit Verification Documents</ThemedText>

          {activeLevel === "identity" && (
            <>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Full Legal Name *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                  placeholder="As shown on official ID card"
                  placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>NIN / Driver's License / Passport No.</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                  placeholder="e.g. 12345678901"
                  placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                  value={idNumber}
                  onChangeText={setIdNumber}
                />
              </View>
            </>
          )}

          {activeLevel === "business" && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>CAC Business Registration No.</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                placeholder="e.g. RC 1234567"
                placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                value={businessNo}
                onChangeText={setBusinessNo}
              />
            </View>
          )}

          {activeLevel === "physical_store" && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Physical Shop Address & Shop No.</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                placeholder="e.g. Shop B4, Balogun Market, Lagos"
                placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                value={shopAddress}
                onChangeText={setShopAddress}
              />
            </View>
          )}

          {/* DUMMY UPLOAD BOX */}
          <TouchableOpacity style={[styles.uploadBox, { borderColor: isDark ? "#3A3A3C" : "#D1D5DB" }]}>
            <Ionicons name="cloud-upload-outline" size={28} color="#3B82F6" />
            <ThemedText style={styles.uploadTitle}>Tap to Upload Document / Photo</ThemedText>
            <ThemedText style={styles.uploadSub}>Secure & Private (Only Admin Reviewers)</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: "#3B82F6" }, loading && { opacity: 0.7 }]}
            onPress={handleSubmitVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.submitBtnText}>Submit for Verification</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: "#00000010" },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  badgesCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  levelList: { gap: 10 },
  levelCard: { padding: 14, borderRadius: 16, borderWidth: 1 },
  levelHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBg: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  levelTitle: { fontSize: 14, fontWeight: "700" },
  levelDesc: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  unlockedTag: { paddingLeft: 6 },
  formCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
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
