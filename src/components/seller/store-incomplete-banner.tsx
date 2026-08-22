import React from "react";
import { StyleSheet, View, TouchableOpacity, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type Props = {
  onSetupProfile: () => void;
};

export function StoreIncompleteBanner({ onSetupProfile }: Props) {
  const isDark = useColorScheme() === "dark";

  return (
    <View
      style={[
        styles.slotBanner,
        {
          backgroundColor: isDark ? "#451A03" : "#FEF3C7",
          borderColor: isDark ? "#78350F" : "#FDE68A",
        },
      ]}
    >
      <Ionicons name="warning-outline" size={24} color="#D97706" />
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontSize: 13, fontWeight: "700", color: isDark ? "#FDE68A" : "#92400E" }}>
          Store Logo Required
        </ThemedText>
        <ThemedText style={{ fontSize: 11, color: isDark ? "#FCD34D" : "#B45309", marginTop: 2 }}>
          Please set up your store logo/profile picture to list products.
        </ThemedText>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.actionBtn, { backgroundColor: "#D97706" }]}
        onPress={onSetupProfile}
      >
        <Text style={styles.actionBtnText}>Setup Profile</Text>
      </TouchableOpacity>
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
