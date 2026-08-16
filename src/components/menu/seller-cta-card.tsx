import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type SellerCtaCardProps = {
  isDark: boolean;
  hasStore?: boolean;
  storeName?: string;
  onPress: () => void;
  onVerificationPress?: () => void;
};

export function SellerCtaCard({ isDark, hasStore, storeName, onPress, onVerificationPress }: SellerCtaCardProps) {
  return (
    <View
      style={[
        styles.sellerCtaCard,
        {
          backgroundColor: isDark ? "#1E2A38" : "#EBF5FF",
          borderColor: isDark ? "#2C3E50" : "#D0E7FF",
        },
      ]}
    >
      <TouchableOpacity style={styles.sellerCtaContent} onPress={onPress}>
        <View style={[styles.sellerIconBg, { backgroundColor: "#3B82F6" }]}>
          <Ionicons name={hasStore ? "storefront-outline" : "storefront"} size={20} color="#FFF" />
        </View>
        <View style={styles.sellerCtaTextContainer}>
          <ThemedText style={styles.sellerCtaTitle}>
            {hasStore ? (storeName ? storeName : "Your Store Profile") : "Open a Store or Shop"}
          </ThemedText>
          <ThemedText style={styles.sellerCtaSub}>
            {hasStore
              ? "Tap to edit shop location & business details"
              : "For physical stores, supermarkets & local sellers"}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
      </TouchableOpacity>

      {hasStore && onVerificationPress && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.verificationBtn, { backgroundColor: "#3B82F6" }]}
            onPress={onVerificationPress}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#FFF" />
            <ThemedText style={styles.verificationBtnText}>Continue Store Verification</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sellerCtaCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sellerCtaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerCtaTextContainer: {
    flex: 1,
    gap: 2,
  },
  sellerCtaTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sellerCtaSub: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(140, 140, 140, 0.25)",
  },
  verificationBtn: {
    height: 38,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  verificationBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
