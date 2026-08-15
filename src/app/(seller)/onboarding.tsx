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
import { WhatsAppAntiScamBanner } from "@/components/whatsapp-anti-scam-banner";

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    typeSlug?: string;
    typeName?: string;
    typeDesc?: string;
    requiresStore?: string;
    typeColor?: string;
    typeIcon?: string;
  }>();

  const isDark = useColorScheme() === "dark";
  const { user } = useAuth();
  const { showToast } = useToast();

  const typeSlug = params.typeSlug || "physical-business";
  const typeName = params.typeName || "Physical Business";
  const typeDesc = params.typeDesc || "Database seller model.";
  const requiresStore = params.requiresStore === "true";
  const typeColor = params.typeColor || "#3B82F6";
  const typeIcon = params.typeIcon || "storefront-outline";

  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F8F9FA";

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      Alert.alert("Required", "Please enter your store or shop name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
      showToast("Store registration completed successfully!", "success");
    } catch (error) {
      showToast("Failed to register store. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconBg, { backgroundColor: isDark ? "#1C3A27" : "#E6F4EA" }]}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <ThemedText style={styles.successTitle}>Store Registration Complete!</ThemedText>
          <ThemedText style={styles.successSub}>
            <ThemedText style={{ fontWeight: "700" }}>{storeName}</ThemedText> has been created as a{" "}
            <ThemedText style={{ fontWeight: "700", color: typeColor }}>{typeName}</ThemedText>.
          </ThemedText>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#3B82F6" }]}
            onPress={() => router.replace("/(seller)/verification")}
          >
            <ThemedText style={styles.primaryBtnText}>Proceed to Verification Uploads</ThemedText>
            <Ionicons name="shield-checkmark" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={isDark ? "#FFF" : "#000"} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Store Registration</ThemedText>
        </View>

        {/* SELECTED DATABASE TYPE BADGE */}
        <View style={[styles.selectedTypePill, { backgroundColor: typeColor + "15", borderColor: typeColor + "40" }]}>
          <Ionicons name={typeIcon as any} size={18} color={typeColor} />
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.selectedTypeTitle, { color: typeColor }]}>
              Database Type: {typeName}
            </ThemedText>
            <ThemedText style={styles.selectedTypeSub}>{typeDesc}</ThemedText>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={[styles.changeText, { color: typeColor }]}>Change</ThemedText>
          </TouchableOpacity>
        </View>

        {(typeSlug.includes("whatsapp")) && (
          <WhatsAppAntiScamBanner storeName={storeName || "your WhatsApp store"} />
        )}

        {/* FORM CARD */}
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Store / Shop Name *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
              placeholder="e.g. Metro Supermarket or Fashion Hub"
              placeholderTextColor={isDark ? "#8E8E93" : "#999"}
              value={storeName}
              onChangeText={setStoreName}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Mobile Phone Number *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
              placeholder="e.g. +234 800 123 4567"
              placeholderTextColor={isDark ? "#8E8E93" : "#999"}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>
              WhatsApp Number {typeSlug.includes("whatsapp") ? "*" : "(Optional)"}
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
              placeholder="e.g. +234 800 123 4567"
              placeholderTextColor={isDark ? "#8E8E93" : "#999"}
              keyboardType="phone-pad"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
            />
          </View>

          {requiresStore && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Physical Shop Address & Market/Shop No. *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                placeholder="e.g. Shop 14, Central Plaza, Main Market"
                placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Store Bio / Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
              placeholder="Tell buyers what products you offer..."
              placeholderTextColor={isDark ? "#8E8E93" : "#999"}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: typeColor }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={18} color="#FFF" />
                <ThemedText style={styles.primaryBtnText}>Register Store & Proceed</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  topHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: "#00000010" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  selectedTypePill: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  selectedTypeTitle: { fontSize: 13, fontWeight: "800" },
  selectedTypeSub: { fontSize: 11, opacity: 0.7, marginTop: 1 },
  changeText: { fontSize: 12, fontWeight: "700" },
  formCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: "top" },
  primaryBtn: { height: 50, borderRadius: 25, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  primaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  successIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successSub: { fontSize: 14, textAlign: "center", opacity: 0.7, lineHeight: 20 },
});
