import React from "react";
import { StyleSheet, View, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type WhatsAppAntiScamBannerProps = {
  storeName?: string;
  onPressSafetyGuide?: () => void;
};

export function WhatsAppAntiScamBanner({ storeName = "this seller", onPressSafetyGuide }: WhatsAppAntiScamBannerProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={[styles.bannerContainer, { backgroundColor: isDark ? "#2C2013" : "#FFFBEB", borderColor: isDark ? "#453118" : "#FDE68A" }]}>
      <View style={styles.iconBg}>
        <Ionicons name="shield-half-outline" size={20} color="#D97706" />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.titleText}>WhatsApp Safety Advisory</ThemedText>
          <View style={styles.tag}>
            <ThemedText style={styles.tagText}>Anti-Scam</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.descText}>
          Always verify product availability before sending money directly to {storeName}. Mini Mart direct checkout guarantees escrow protection.
        </ThemedText>

        {onPressSafetyGuide && (
          <TouchableOpacity style={styles.linkBtn} onPress={onPressSafetyGuide}>
            <ThemedText style={styles.linkText}>Read Buyer Safety Tips</ThemedText>
            <Ionicons name="chevron-forward" size={12} color="#D97706" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginVertical: 8,
    alignItems: "flex-start",
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F59E0B20",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D97706",
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#D9770620",
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#D97706",
    textTransform: "uppercase",
  },
  descText: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.8,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  linkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
});
