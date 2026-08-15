import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type SellerCtaCardProps = {
  isDark: boolean;
  onPress: () => void;
};

export function SellerCtaCard({ isDark, onPress }: SellerCtaCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.sellerCtaCard,
        {
          backgroundColor: isDark ? "#1E2A38" : "#EBF5FF",
          borderColor: isDark ? "#2C3E50" : "#D0E7FF",
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.sellerCtaContent}>
        <View style={[styles.sellerIconBg, { backgroundColor: "#3B82F6" }]}>
          <Ionicons name="storefront" size={20} color="#FFF" />
        </View>
        <View style={styles.sellerCtaTextContainer}>
          <ThemedText style={styles.sellerCtaTitle}>Open a Store or Shop</ThemedText>
          <ThemedText style={styles.sellerCtaSub}>
            For physical stores, supermarkets & local sellers
          </ThemedText>
        </View>
        <Ionicons name="arrow-forward-circle" size={24} color="#3B82F6" />
      </View>
    </TouchableOpacity>
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
});
