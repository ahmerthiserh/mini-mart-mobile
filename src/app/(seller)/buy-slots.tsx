import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { HomeHeader } from "@/components/home-header";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Colors } from "@/constants/Colors";
import api from "@/config/api";

export default function BuySlotsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { token, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [pricingConfig, setPricingConfig] = useState<{
    price_per_slot: number;
    currency: string;
    min_qty: number;
    max_qty: number;
    status: string;
    tier_pricing: any[];
  }>({
    price_per_slot: 100,
    currency: "NGN",
    min_qty: 1,
    max_qty: 1000,
    status: "active",
    tier_pricing: [],
  });

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const primaryColor = Colors[isDark ? "dark" : "light"].primary;

  const fetchPricingConfig = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(api.ENDPOINTS.VENDOR.SUBSCRIPTION_PLANS, {
        headers: api.getHeaders(token),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.slot_pricing) {
          setPricingConfig(data.slot_pricing);
          setQuantity(data.slot_pricing.min_qty || 1);
        } else if (data.extra_slot_price) {
          setPricingConfig((prev) => ({
            ...prev,
            price_per_slot: Number(data.extra_slot_price),
            currency: data.currency || "NGN",
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching slot pricing:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPricingConfig();
  }, [fetchPricingConfig]);

  const calculateUnitPrice = (qty: number) => {
    let unit = pricingConfig.price_per_slot;
    const tiers = [...(pricingConfig.tier_pricing || [])];
    tiers.sort((a, b) => (b.min_qty || 0) - (a.min_qty || 0));

    for (const tier of tiers) {
      if (qty >= (tier.min_qty || 0)) {
        if (tier.discount_percent && Number(tier.discount_percent) > 0) {
          unit = pricingConfig.price_per_slot * (1 - Number(tier.discount_percent) / 100);
        } else if (tier.price_per_slot) {
          unit = Number(tier.price_per_slot);
        }
        break;
      }
    }

    return unit;
  };

  const unitPrice = calculateUnitPrice(quantity);
  const totalAmount = quantity * unitPrice;

  const handleIncrement = () => {
    if (quantity < pricingConfig.max_qty) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > pricingConfig.min_qty) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleBuySlots = async () => {
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await fetch(api.ENDPOINTS.VENDOR.BUY_SLOTS, {
        method: "POST",
        headers: api.getHeaders(token),
        body: JSON.stringify({
          quantity,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          data.message || `Successfully purchased ${quantity} product slot(s)!`,
          "success"
        );
        await refreshUser();
        router.back();
      } else {
        showToast(data.message || "Failed to purchase product slots", "error");
      }
    } catch (err) {
      console.error("Error purchasing slots:", err);
      showToast("Network error initiating slot purchase", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <HomeHeader showSearch={false} showBack={true} title="Buy Product Slots" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>
            Loading slot pricing configuration...
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 30, 40) },
          ]}
        >
          {/* BANNER */}
          <View style={[styles.heroBanner, { backgroundColor: isDark ? "#1E293B" : "#EFF6FF" }]}>
            <Ionicons name="cube" size={32} color="#0284C7" />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.heroTitle}>Expand Your Inventory</ThemedText>
              <ThemedText style={styles.heroSub}>
                Purchase extra product upload slots to list more inventory on Mini-Mart.
              </ThemedText>
            </View>
          </View>

          {/* QUANTITY CARD */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardSectionTitle}>Select Slot Quantity</ThemedText>

            <View style={styles.qtyControlRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.qtyBtn,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#EAEAEA",
                    opacity: quantity <= pricingConfig.min_qty ? 0.4 : 1,
                  },
                ]}
                onPress={handleDecrement}
                disabled={quantity <= pricingConfig.min_qty}
              >
                <Ionicons name="remove" size={20} color={isDark ? "#FFF" : "#000"} />
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.qtyInput,
                  {
                    color: isDark ? "#FFF" : "#000",
                    borderColor,
                    backgroundColor: isDark ? "#2C2C2E" : "#F9FAFB",
                  },
                ]}
                keyboardType="numeric"
                value={String(quantity)}
                onChangeText={(val) => {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    if (num >= pricingConfig.min_qty && num <= pricingConfig.max_qty) {
                      setQuantity(num);
                    }
                  } else if (val === "") {
                    setQuantity(pricingConfig.min_qty);
                  }
                }}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.qtyBtn,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#EAEAEA",
                    opacity: quantity >= pricingConfig.max_qty ? 0.4 : 1,
                  },
                ]}
                onPress={handleIncrement}
                disabled={quantity >= pricingConfig.max_qty}
              >
                <Ionicons name="add" size={20} color={isDark ? "#FFF" : "#000"} />
              </TouchableOpacity>
            </View>

            {/* TIER PRICING DISCOUNTS */}
            {pricingConfig.tier_pricing && pricingConfig.tier_pricing.length > 0 && (
              <View style={styles.tierSection}>
                <ThemedText style={styles.tierHeader}>Volume Tier Discounts:</ThemedText>
                {pricingConfig.tier_pricing.map((tier: any, idx: number) => (
                  <View key={idx} style={styles.tierRow}>
                    <Ionicons name="pricetag-outline" size={14} color="#10B981" />
                    <Text style={styles.tierText}>
                      Buy {tier.min_qty}+ slots: get {tier.discount_percent}% off (₦
                      {tier.price_per_slot || calculateUnitPrice(tier.min_qty)}/slot)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* SUMMARY BREAKDOWN */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardSectionTitle}>Order Summary</ThemedText>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Price per Slot</Text>
              <Text style={[styles.summaryVal, { color: isDark ? "#FFF" : "#000" }]}>
                ₦{pricingConfig.price_per_slot.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Applied Unit Price</Text>
              <Text style={[styles.summaryVal, { color: "#10B981", fontWeight: "700" }]}>
                ₦{unitPrice.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Quantity</Text>
              <Text style={[styles.summaryVal, { color: isDark ? "#FFF" : "#000" }]}>
                {quantity} slot(s)
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalVal}>
                ₦{totalAmount.toLocaleString()} {pricingConfig.currency}
              </Text>
            </View>
          </View>

          {/* PAY ACTION BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.payBtn,
              { backgroundColor: submitting ? "#9CA3AF" : "#10B981" },
            ]}
            onPress={handleBuySlots}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#FFF" />
                <Text style={styles.payBtnText}>
                  Confirm & Buy {quantity} Slot(s) (₦{totalAmount.toLocaleString()})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  heroSub: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  qtyControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginVertical: 4,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    width: 80,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  tierSection: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  tierHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierText: {
    fontSize: 12,
    color: "#10B981",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#8E8E93",
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
  },
  payBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  payBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
