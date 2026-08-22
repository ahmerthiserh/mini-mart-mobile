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
import { useAlert } from "@/context/AlertContext";
import { WhatsAppAntiScamBanner } from "@/components/whatsapp-anti-scam-banner";
import api from "@/config/api";

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
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  const typeSlug = (params.typeSlug || "physical-business").toLowerCase();
  const typeName = params.typeName || "Physical Business";
  const typeDesc = params.typeDesc || "Database seller model.";
  const requiresStore = params.requiresStore === "true" || typeSlug.includes("physical");
  const typeColor = params.typeColor || "#3B82F6";
  const typeIcon = params.typeIcon || "storefront-outline";

  // Form Fields
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [marketLocation, setMarketLocation] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [resellerCategory, setResellerCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F8F9FA";

  const isWhatsAppSeller = typeSlug.includes("whatsapp");
  const isPhysicalSeller = typeSlug.includes("physical");
  const isOnlineSeller = typeSlug.includes("online");
  const isDigitalMarketer = typeSlug.includes("digital");
  const isReseller = typeSlug.includes("reseller");

  React.useEffect(() => {
    if (token) {
      fetch(api.ENDPOINTS.VENDOR.STORE, {
        headers: api.getHeaders(token),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const s = data?.store || data;
          if (s && s.id && s.store_name) {
            setStoreName(s.store_name);
            if (s.phone_number) setPhone(s.phone_number);
            if (s.whatsapp_number) setWhatsappNumber(s.whatsapp_number);
            if (s.address) setAddress(s.address);
            if (s.market) setMarketLocation(s.market);
            if (s.cac_number || s.business_registration_number) {
              setCacNumber(s.cac_number || s.business_registration_number);
            }
            if (s.website_url) setWebsiteUrl(s.website_url);
            if (s.social_handle) setSocialHandle(s.social_handle);
            if (s.description) setDescription(s.description);
          } else {
            setStoreName("");
            setDescription("");
            setWhatsappNumber("");
            setAddress("");
            setMarketLocation("");
            setCacNumber("");
            setWebsiteUrl("");
            setSocialHandle("");
            setResellerCategory("");
            if (user?.phone) setPhone(user.phone);
          }
        })
        .catch(() => {
          setStoreName("");
          setDescription("");
          setWhatsappNumber("");
          setAddress("");
          setMarketLocation("");
          setCacNumber("");
          setWebsiteUrl("");
          setSocialHandle("");
          setResellerCategory("");
          if (user?.phone) setPhone(user.phone);
        });
    }
  }, [token, user]);

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      showAlert({ title: "Required Field", message: "Please enter your store or profile name.", iconName: "alert-circle-outline", iconColor: "#EAB308", confirmText: "OK" });
      return;
    }
    if (!phone.trim()) {
      showAlert({ title: "Required Field", message: "Please enter a valid mobile phone number.", iconName: "alert-circle-outline", iconColor: "#EAB308", confirmText: "OK" });
      return;
    }
    if (isWhatsAppSeller && !whatsappNumber.trim()) {
      showAlert({ title: "Required Field", message: "Please enter your active WhatsApp Business number.", iconName: "alert-circle-outline", iconColor: "#EAB308", confirmText: "OK" });
      return;
    }
    if (isPhysicalSeller && (!address.trim() || !marketLocation.trim())) {
      showAlert({ title: "Required Field", message: "Physical businesses require Market Name and Shop/Suite Number.", iconName: "alert-circle-outline", iconColor: "#EAB308", confirmText: "OK" });
      return;
    }
    if (isDigitalMarketer && !socialHandle.trim()) {
      showAlert({ title: "Required Field", message: "Digital marketers require a social media handle or portfolio link.", iconName: "alert-circle-outline", iconColor: "#EAB308", confirmText: "OK" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        seller_type_slug: typeSlug,
        store_name: storeName.trim(),
        phone_number: phone.trim(),
        whatsapp_number: whatsappNumber.trim() || undefined,
        address: address.trim() || undefined,
        market: marketLocation.trim() || undefined,
        description: description.trim() || undefined,
      };

      const response = await fetch(api.ENDPOINTS.VENDOR.STORE, {
        method: "POST",
        headers: api.getHeaders(token),
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (response.ok || response.status === 201) {
        showToast("Store details saved successfully!", "success");
        router.replace({
          pathname: "/(seller)/verification",
          params: {
            typeSlug,
            typeName,
            storeName: storeName.trim(),
          },
        });
      } else {
        showToast(json.message || "Failed to save store details.", "error");
      }
    } catch (error) {
      showToast("Network error saving store details.", "error");
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
          <ThemedText style={styles.successTitle}>Registration Complete!</ThemedText>
          <ThemedText style={styles.successSub}>
            <ThemedText style={{ fontWeight: "700" }}>{storeName}</ThemedText> has been created as a{" "}
            <ThemedText style={{ fontWeight: "700", color: typeColor }}>{typeName}</ThemedText>.
          </ThemedText>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#3B82F6" }]}
            onPress={() =>
              router.replace({
                pathname: "/(seller)/verification",
                params: { typeSlug, typeName, storeName },
              })
            }
          >
            <ThemedText style={styles.primaryBtnText}>Proceed to Identity & Verification</ThemedText>
            <Ionicons name="shield-checkmark" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* SELECTED DATABASE TYPE BADGE */}
          <View style={[styles.selectedTypePill, { backgroundColor: typeColor + "15", borderColor: typeColor + "40" }]}>
            <Ionicons name={typeIcon as any} size={20} color={typeColor} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.selectedTypeTitle, { color: typeColor }]}>
                {typeName} Profile Setup
              </ThemedText>
              <ThemedText style={styles.selectedTypeSub}>{typeDesc}</ThemedText>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <ThemedText style={[styles.changeText, { color: typeColor }]}>Change</ThemedText>
            </TouchableOpacity>
          </View>

        {isWhatsAppSeller && (
          <WhatsAppAntiScamBanner storeName={storeName || "your WhatsApp store"} />
        )}

        {/* DYNAMIC FORM CARD BASED ON SELLER TYPE */}
        <View style={[styles.formCard, { backgroundColor: cardBg, borderColor }]}>
          
          {/* COMMON: STORE / BRAND NAME */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>
              {isPhysicalSeller
                ? "Store / Shop Name"
                : isWhatsAppSeller
                ? "WhatsApp Store / Group Name"
                : isDigitalMarketer
                ? "Brand / Agency Name"
                : isReseller
                ? "Reseller Business Name"
                : "Store / Brand Name"}{" "}
              <ThemedText style={styles.requiredStar}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
              placeholder={
                isPhysicalSeller
                  ? "e.g. Metro Supermarket or Fashion Hub"
                  : isWhatsAppSeller
                  ? "e.g. Kano Wholesale Group"
                  : "e.g. Ahmad Digital Deals"
              }
              placeholderTextColor={isDark ? "#8E8E93" : "#999"}
              value={storeName}
              onChangeText={setStoreName}
            />
          </View>

          {/* COMMON: MOBILE PHONE NUMBER */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>
              Mobile Phone Number <ThemedText style={styles.requiredStar}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
              placeholder="e.g. +234 800 123 4567"
              placeholderTextColor={isDark ? "#8E8E93" : "#999"}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* WHATSAPP SELLER SPECIFIC */}
          {isWhatsAppSeller && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                Active WhatsApp Business Number <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                placeholder="e.g. +234 800 987 6543"
                placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                keyboardType="phone-pad"
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
              />
            </View>
          )}

          {/* PHYSICAL BUSINESS SPECIFIC */}
          {isPhysicalSeller && (
            <>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>
                  Market / Shopping Plaza Name <ThemedText style={styles.requiredStar}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                  placeholder="e.g. Sabon Gari Market, Kano"
                  placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                  value={marketLocation}
                  onChangeText={setMarketLocation}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>
                  Shop / Suite Number & Line <ThemedText style={styles.requiredStar}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                  placeholder="e.g. Shop B14, Line 4, 2nd Floor"
                  placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>
                  CAC / Business Registration Number (Optional)
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                  placeholder="e.g. RC 1234567"
                  placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                  value={cacNumber}
                  onChangeText={setCacNumber}
                />
              </View>
            </>
          )}

          {/* ONLINE SELLER SPECIFIC */}
          {isOnlineSeller && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                Website or Online Store Link (Optional)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                placeholder="e.g. https://myfashionstore.com"
                placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                autoCapitalize="none"
                keyboardType="url"
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
              />
            </View>
          )}

          {/* DIGITAL MARKETER SPECIFIC */}
          {isDigitalMarketer && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                Social Media / Portfolio Handle <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                placeholder="e.g. @ahmad_deals or instagram.com/brand"
                placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                autoCapitalize="none"
                value={socialHandle}
                onChangeText={setSocialHandle}
              />
            </View>
          )}

          {/* RESELLER SPECIFIC */}
          {isReseller && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                Primary Sourcing Category <ThemedText style={styles.requiredStar}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
                placeholder="e.g. Electronics, Sneakers, Fashion, Cosmetics"
                placeholderTextColor={isDark ? "#8E8E93" : "#999"}
                value={resellerCategory}
                onChangeText={setResellerCategory}
              />
            </View>
          )}

          {/* COMMON: STORE BIO / DESCRIPTION */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Store Bio & Product Offerings</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
              placeholder="Tell buyers about your products and services..."
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
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
                <ThemedText style={styles.primaryBtnText}>Save & Continue to Verification</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 160, gap: 16 },
  selectedTypePill: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  selectedTypeTitle: { fontSize: 14, fontWeight: "800" },
  selectedTypeSub: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  changeText: { fontSize: 12, fontWeight: "700" },
  formCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  requiredStar: { color: "#EF4444", fontWeight: "800" },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: "top" },
  primaryBtn: { height: 50, borderRadius: 25, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  primaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  successIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successSub: { fontSize: 14, textAlign: "center", opacity: 0.7, lineHeight: 20 },
});
