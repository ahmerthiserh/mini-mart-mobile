import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type SellerCtaCardProps = {
  isDark: boolean;
  hasStore?: boolean;
  storeName?: string;
  isVerified?: boolean;
  verificationStatus?: string | null;
  onPress: () => void;
  onVerificationPress?: () => void;
};

export function SellerCtaCard({
  isDark,
  hasStore,
  storeName,
  isVerified,
  verificationStatus,
  onPress,
  onVerificationPress,
}: SellerCtaCardProps) {
  let btnText = "Apply for Store Verification";
  let btnIcon: any = "shield-checkmark-outline";
  let btnBg = "#3B82F6";

  if (isVerified || verificationStatus === "approved" || verificationStatus === "verified") {
    btnText = "Verified Seller Badge";
    btnIcon = "shield-checkmark";
    btnBg = "#10B981";
  } else if (verificationStatus === "pending" || verificationStatus === "under_review") {
    btnText = "Verification Under Review";
    btnIcon = "time-outline";
    btnBg = "#F59E0B";
  } else if (verificationStatus === "rejected") {
    btnText = "Verification Rejected • Re-apply";
    btnIcon = "alert-circle-outline";
    btnBg = "#EF4444";
  } else {
    btnText = "Apply for Store Verification";
    btnIcon = "shield-checkmark-outline";
    btnBg = "#3B82F6";
  }

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
            style={[styles.verificationBtn, { backgroundColor: btnBg }]}
            onPress={onVerificationPress}
          >
            <Ionicons name={btnIcon} size={16} color="#FFF" />
            <ThemedText style={styles.verificationBtnText}>{btnText}</ThemedText>
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
