import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Modal, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

export type BadgeType = "phone_verified" | "identity_verified" | "business_verified" | "store_verified" | "trusted_seller";

type VerificationBadgesProps = {
  badges?: BadgeType[];
  sellerName?: string;
};

const BADGE_CONFIG: Record<BadgeType, { title: string; icon: string; color: string; description: string }> = {
  phone_verified: {
    title: "Phone Verified",
    icon: "call",
    color: "#10B981",
    description: "Mini Mart confirmed this seller's mobile phone number via SMS/OTP verification.",
  },
  identity_verified: {
    title: "Identity Verified",
    icon: "person-checkmark",
    color: "#3B82F6",
    description: "Mini Mart verified this seller's government-issued ID card and legal full name.",
  },
  business_verified: {
    title: "Business Verified",
    icon: "briefcase",
    color: "#8B5CF6",
    description: "Mini Mart verified official business registration certificates (e.g., CAC documents).",
  },
  store_verified: {
    title: "Store Verified",
    icon: "storefront",
    color: "#F59E0B",
    description: "Mini Mart verified the physical shop location, market shop number, and storefront photo.",
  },
  trusted_seller: {
    title: "Trusted Seller",
    icon: "ribbon",
    color: "#EC4899",
    description: "Earned badge based on exceptional transaction history, low disputes, and positive buyer ratings.",
  },
};

export function VerificationBadges({ badges = [], sellerName = "Seller" }: VerificationBadgesProps) {
  const isDark = useColorScheme() === "dark";
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);

  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.badgeContainer}>
        {badges.map((badgeKey) => {
          const config = BADGE_CONFIG[badgeKey];
          if (!config) return null;

          return (
            <TouchableOpacity
              key={badgeKey}
              style={[styles.badgePill, { backgroundColor: config.color + "15", borderColor: config.color + "40" }]}
              onPress={() => setSelectedBadge(badgeKey)}
            >
              <Ionicons name={config.icon as any} size={12} color={config.color} />
              <ThemedText style={[styles.badgeText, { color: config.color }]}>
                {config.title}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* DETAIL MODAL */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
            {selectedBadge && (
              <>
                <View style={[styles.iconBg, { backgroundColor: BADGE_CONFIG[selectedBadge].color + "20" }]}>
                  <Ionicons name={BADGE_CONFIG[selectedBadge].icon as any} size={32} color={BADGE_CONFIG[selectedBadge].color} />
                </View>
                <ThemedText style={styles.modalTitle}>{BADGE_CONFIG[selectedBadge].title}</ThemedText>
                <ThemedText style={styles.modalSub}>{BADGE_CONFIG[selectedBadge].description}</ThemedText>
                <View style={styles.verifiedByTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <ThemedText style={styles.verifiedByText}>Verified by Mini Mart Trust System</ThemedText>
                </View>

                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: "#3B82F6" }]}
                  onPress={() => setSelectedBadge(null)}
                >
                  <ThemedText style={styles.closeBtnText}>Got it</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 4,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 18,
  },
  verifiedByTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#10B98115",
  },
  verifiedByText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  closeBtn: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  closeBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
