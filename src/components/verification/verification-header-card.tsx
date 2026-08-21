import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { VerificationBadges, BadgeType } from "@/components/verification-badges";

interface VerificationHeaderCardProps {
  storeName: string;
  myBadges: BadgeType[];
  showInfo: boolean;
  setShowInfo: (val: boolean) => void;
  cardBg: string;
  borderColor: string;
  isDark: boolean;
  primaryColor: string;
}

export function VerificationHeaderCard({
  storeName,
  myBadges,
  showInfo,
  setShowInfo,
  cardBg,
  borderColor,
  isDark,
  primaryColor,
}: VerificationHeaderCardProps) {
  return (
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
          <Ionicons name={showInfo ? "close" : "information-circle-outline"} size={16} color={primaryColor} />
        </TouchableOpacity>
      </View>

      <VerificationBadges badges={myBadges} sellerName={storeName} />

      {showInfo && (
        <View style={[styles.infoDrawer, { backgroundColor: isDark ? "#252528" : "#F8FAFC", borderColor }]}>
          <ThemedText style={styles.infoDrawerTitle}>3 Verification Pillars</ThemedText>
          <View style={styles.pillarList}>
            <View style={styles.pillarRow}>
              <Ionicons name="id-card-outline" size={14} color={primaryColor} />
              <ThemedText style={styles.pillarItem}>
                <ThemedText style={{ fontWeight: "700" }}>Identity:</ThemedText> Verifies the person (Instant NIN or BVN). Required for all sellers.
              </ThemedText>
            </View>
            <View style={styles.pillarRow}>
              <Ionicons name="business-outline" size={14} color={primaryColor} />
              <ThemedText style={styles.pillarItem}>
                <ThemedText style={{ fontWeight: "700" }}>Business:</ThemedText> Verifies CAC business registration (Optional for informal sellers).
              </ThemedText>
            </View>
            <View style={styles.pillarRow}>
              <Ionicons name="location-outline" size={14} color={primaryColor} />
              <ThemedText style={styles.pillarItem}>
                <ThemedText style={{ fontWeight: "700" }}>Store:</ThemedText> Verifies physical shop address & location.
              </ThemedText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
