import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { BadgeType } from "@/components/verification-badges";

interface VerificationTierTabsProps {
  actionLevels: any[];
  activeLevel: string;
  setActiveLevel: (level: string) => void;
  myBadges: BadgeType[];
  cardBg: string;
  borderColor: string;
  isDark: boolean;
}

export function VerificationTierTabs({
  actionLevels,
  activeLevel,
  setActiveLevel,
  myBadges,
  cardBg,
  borderColor,
  isDark,
}: VerificationTierTabsProps) {
  return (
    <View>
      <ThemedText style={[styles.sectionLabel, { color: isDark ? "#8E8E93" : "#6C6C70" }]}>
        SELECT VERIFICATION TIER
      </ThemedText>

      <View style={styles.tabRow}>
        {actionLevels.map((lvl) => {
          const isSelected = activeLevel === lvl.id;
          const isVerified = myBadges.includes(lvl.badge as BadgeType);

          return (
            <TouchableOpacity
              key={lvl.id}
              style={[
                styles.tabChip,
                { backgroundColor: cardBg, borderColor },
                isSelected && { borderColor: lvl.color, backgroundColor: lvl.color + "15", borderWidth: 2 },
              ]}
              onPress={() => setActiveLevel(lvl.id)}
            >
              <View style={[styles.tabIconBg, { backgroundColor: lvl.color + "20" }]}>
                <Ionicons name={lvl.icon as any} size={16} color={lvl.color} />
              </View>
              <View style={styles.tabTextCol}>
                <ThemedText
                  numberOfLines={1}
                  style={[styles.tabTitle, isSelected && { color: lvl.color, fontWeight: "800" }]}
                >
                  {lvl.title}
                </ThemedText>
                <ThemedText numberOfLines={1} style={styles.tabSub}>
                  Lvl {lvl.levelNum}
                </ThemedText>
              </View>
              {isVerified && <Ionicons name="checkmark-circle" size={14} color="#10B981" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 10.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabIconBg: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  tabTextCol: { flex: 1, justifyContent: "center" },
  tabTitle: { fontSize: 11.5, fontWeight: "700" },
  tabSub: { fontSize: 9.5, opacity: 0.6, marginTop: 1 },
});
