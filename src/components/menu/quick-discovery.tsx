import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type QuickDiscoveryProps = {
  cardBg: string;
  borderColor: string;
  isDark: boolean;
  onStoresPress: () => void;
  onCategoriesPress: () => void;
};

export function QuickDiscovery({
  cardBg,
  borderColor,
  isDark,
  onStoresPress,
  onCategoriesPress,
}: QuickDiscoveryProps) {
  return (
    <>
      <ThemedText
        style={[styles.sectionTitle, { color: isDark ? "#8E8E93" : "#6C6C70" }]}
      >
        Explore Mini Mart
      </ThemedText>

      <View style={styles.quickDiscoveryGrid}>
        <TouchableOpacity
          style={[styles.discoveryCard, { backgroundColor: cardBg, borderColor }]}
          onPress={onStoresPress}
        >
          <View style={[styles.discoveryIconBg, { backgroundColor: "#EBF5FF" }]}>
            <Ionicons name="storefront-outline" size={22} color="#007AFF" />
          </View>
          <ThemedText style={styles.discoveryTitle}>Stores Directory</ThemedText>
          <ThemedText style={styles.discoverySub}>Find top local merchants</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.discoveryCard, { backgroundColor: cardBg, borderColor }]}
          onPress={onCategoriesPress}
        >
          <View style={[styles.discoveryIconBg, { backgroundColor: "#FFF0F5" }]}>
            <Ionicons name="grid-outline" size={22} color="#FF2D55" />
          </View>
          <ThemedText style={styles.discoveryTitle}>All Categories</ThemedText>
          <ThemedText style={styles.discoverySub}>Browse textiles & products</ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 1,
  },
  quickDiscoveryGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  discoveryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  discoveryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  discoveryTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  discoverySub: {
    fontSize: 11,
    opacity: 0.6,
  },
});
