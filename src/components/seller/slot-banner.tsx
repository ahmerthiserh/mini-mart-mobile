import React from "react";
import { StyleSheet, View, TouchableOpacity, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type Props = {
  slotInfo: any;
  onAddProduct: () => void;
  onBuySlots: () => void;
};

export function SlotBanner({ slotInfo, onAddProduct, onBuySlots }: Props) {
  const isDark = useColorScheme() === "dark";

  if (!slotInfo) return null;

  return (
    <View
      style={[
        styles.slotBanner,
        {
          backgroundColor: isDark ? "#1E293B" : "#F0F7FF",
          borderColor: isDark ? "#334155" : "#BAE6FD",
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <ThemedText style={styles.slotTitle}>Product Slots</ThemedText>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>
              {slotInfo.available_slots ?? "∞"} Available
            </Text>
          </View>
        </View>
        <ThemedText style={styles.slotSub}>
          {slotInfo.used_slots ?? 0} of {slotInfo.total_slots ?? "Unlimited"} slots used
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionBtn, { backgroundColor: "#0284C7" }]}
          onPress={onAddProduct}
        >
          <Ionicons name="add-circle-outline" size={15} color="#FFF" />
          <Text style={styles.actionBtnText}>Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
          onPress={onBuySlots}
        >
          <Ionicons name="cart-outline" size={15} color="#FFF" />
          <Text style={styles.actionBtnText}>Buy Slots</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slotBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  slotSub: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  slotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: "#0284C7",
  },
  slotBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 11,
  },
});
