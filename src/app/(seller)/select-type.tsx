import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/config/api";

export type SellerTypeItem = {
  id: number;
  slug: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  requiresStore: boolean;
};

// Maps backend Lucide/feather icon names to Ionicons & brand colors
function mapSellerTypeMeta(slug: string, rawIcon?: string) {
  switch (slug) {
    case "physical-business":
    case "physical_business":
      return { icon: "storefront-outline", color: "#3B82F6", requiresStore: true };
    case "online-seller":
    case "online_seller":
      return { icon: "globe-outline", color: "#8B5CF6", requiresStore: false };
    case "whatsapp-seller":
    case "whatsapp_seller":
      return { icon: "logo-whatsapp", color: "#25D366", requiresStore: false };
    case "digital-marketer":
    case "digital_marketer":
      return { icon: "share-social-outline", color: "#EC4899", requiresStore: false };
    case "reseller":
      return { icon: "repeat-outline", color: "#F59E0B", requiresStore: false };
    default:
      return { icon: "business-outline", color: "#64748B", requiresStore: false };
  }
}

export default function SelectSellerTypeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const [typesList, setTypesList] = useState<SellerTypeItem[]>([]);
  const [selectedTypeSlug, setSelectedTypeSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";

  useEffect(() => {
    fetchSellerTypesFromDatabase();
  }, []);

  const fetchSellerTypesFromDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(api.ENDPOINTS.SELLER_TYPES);
      if (!response.ok) {
        setError("Failed to load seller types from database.");
        return;
      }
      const json = await response.json();
      const rawTypes = json.data || json;

      if (Array.isArray(rawTypes) && rawTypes.length > 0) {
        const formatted: SellerTypeItem[] = rawTypes.map((item: any) => {
          const meta = mapSellerTypeMeta(item.slug, item.icon);
          return {
            id: item.id,
            slug: item.slug,
            name: item.name,
            desc: item.description || "Registered seller business model.",
            icon: meta.icon,
            color: meta.color,
            requiresStore: meta.requiresStore,
          };
        });
        setTypesList(formatted);
      } else {
        setError("No seller business types found in database.");
      }
    } catch (err) {
      setError("Network error fetching database configuration.");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = typesList.find((t) => t.slug === selectedTypeSlug);

  const handleContinue = () => {
    if (!selectedType) {
      Alert.alert("Selection Required", "Please choose a business type to proceed.");
      return;
    }
    router.push({
      pathname: "/(seller)/onboarding",
      params: {
        typeSlug: selectedType.slug,
        typeName: selectedType.name,
        typeDesc: selectedType.desc,
        requiresStore: selectedType.requiresStore ? "true" : "false",
        typeColor: selectedType.color,
        typeIcon: selectedType.icon,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* TOP HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={isDark ? "#FFF" : "#000"} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Select Business Type</ThemedText>
        </View>

        <ThemedText style={styles.pageTitle}>How do you sell?</ThemedText>
        <ThemedText style={styles.pageSub}>
          Select your operational model. Available seller types are fetched live from our database.
        </ThemedText>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <ThemedText style={styles.loadingText}>Fetching database configuration...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
            <ThemedText style={styles.errorTitle}>Unable to Load Types</ThemedText>
            <ThemedText style={styles.errorSub}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchSellerTypesFromDatabase}>
              <ThemedText style={styles.retryText}>Retry Database Sync</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* DYNAMIC DATABASE CARDS */}
            <View style={styles.typeList}>
              {typesList.map((t) => {
                const isSelected = selectedTypeSlug === t.slug;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeCard,
                      { backgroundColor: cardBg, borderColor },
                      isSelected && { borderColor: t.color, borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedTypeSlug(t.slug)}
                  >
                    <View style={[styles.typeIconBg, { backgroundColor: t.color + "18" }]}>
                      <Ionicons name={t.icon as any} size={24} color={t.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.typeTitle}>{t.name}</ThemedText>
                      <ThemedText style={styles.typeDesc}>{t.desc}</ThemedText>
                    </View>
                    <View style={[styles.radioCircle, isSelected && { borderColor: t.color, backgroundColor: t.color }]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CONTINUE BUTTON */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: selectedType ? selectedType.color : "#9CA3AF" },
                !selectedType && { opacity: 0.6 },
              ]}
              onPress={handleContinue}
              disabled={!selectedType}
            >
              <ThemedText style={styles.primaryBtnText}>Continue to Registration</ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: "#00000010" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  pageTitle: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  pageSub: { fontSize: 13, opacity: 0.7, lineHeight: 18 },
  centerContainer: { paddingVertical: 40, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, opacity: 0.7 },
  errorTitle: { fontSize: 16, fontWeight: "800", color: "#EF4444" },
  errorSub: { fontSize: 12, opacity: 0.7, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#3B82F6" },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  typeList: { gap: 10, marginTop: 4 },
  typeCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  typeIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  typeTitle: { fontSize: 15, fontWeight: "700" },
  typeDesc: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#9CA3AF", justifyContent: "center", alignItems: "center" },
  primaryBtn: { height: 50, borderRadius: 25, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
  primaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
