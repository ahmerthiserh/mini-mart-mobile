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

  const [slotInfo, setSlotInfo] = useState<{
    included_slots?: number;
    used_slots?: number;
    purchased_slots?: number;
    available_slots?: number | string;
    total_slots?: number | string;
  } | null>(null);

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
    max_qty: 10000,
    status: "active",
    tier_pricing: [],
  });

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const primaryColor = Colors[isDark ? "dark" : "light"].primary;

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      // Fetch pricing config and full slot status in parallel
      const [plansRes, subRes] = await Promise.all([
        fetch(api.ENDPOINTS.VENDOR.SUBSCRIPTION_PLANS, {
          headers: api.getHeaders(token),
        }),
        fetch(api.ENDPOINTS.VENDOR.MY_SUBSCRIPTION, {
          headers: api.getHeaders(token),
        }),
      ]);

      if (plansRes.ok) {
        const data = await plansRes.json();
        if (data.slot_pricing) {
          setPricingConfig(data.slot_pricing);
          if (data.slot_pricing.min_qty) {
            setQuantity(data.slot_pricing.min_qty);
          }
        } else if (data.extra_slot_price) {
          setPricingConfig((prev) => ({
            ...prev,
            price_per_slot: Number(data.extra_slot_price),
            currency: data.currency || "NGN",
          }));
        }
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.slot_info) {
          setSlotInfo(subData.slot_info);
        }
      } else {
        // Fallback to vendor products endpoint for slot_info
        const prodRes = await fetch(api.ENDPOINTS.VENDOR.PRODUCTS, {
          headers: api.getHeaders(token),
        });
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.slot_info) {
            setSlotInfo(prodData.slot_info);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching slot data:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate tier pricing, discount, and unit price
  const calculatePricingDetails = (qty: number) => {
    let unit = pricingConfig.price_per_slot;
    let discountPercent = 0;
    const tiers = [...(pricingConfig.tier_pricing || [])];
    tiers.sort((a, b) => (b.min_qty || 0) - (a.min_qty || 0));

    for (const tier of tiers) {
      if (qty >= (tier.min_qty || 0)) {
        if (tier.discount_percent && Number(tier.discount_percent) > 0) {
          discountPercent = Number(tier.discount_percent);
          unit = pricingConfig.price_per_slot * (1 - discountPercent / 100);
        } else if (tier.price_per_slot) {
          unit = Number(tier.price_per_slot);
          if (pricingConfig.price_per_slot > 0) {
            discountPercent = Math.round(
              ((pricingConfig.price_per_slot - unit) / pricingConfig.price_per_slot) * 100
            );
          }
        }
        break;
      }
    }

    return { unitPrice: unit, discountPercent };
  };

  const { unitPrice, discountPercent } = calculatePricingDetails(quantity);
  const totalAmount = quantity * unitPrice;

  const handleIncrement = (amount = 1) => {
    setQuantity((prev) => Math.min(prev + amount, pricingConfig.max_qty));
  };

  const handleDecrement = (amount = 1) => {
    setQuantity((prev) => Math.max(prev - amount, pricingConfig.min_qty));
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
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={{ marginTop: 12, opacity: 0.6, fontSize: 13 }}>
            Loading slot configuration from backend...
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
          {/* CURRENT CAPACITY HERO CARD */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#F0F7FF",
                borderColor: isDark ? "#334155" : "#BAE6FD",
              },
            ]}
          >
            <View style={styles.heroRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="cube" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.heroTitle}>Inventory Capacity</ThemedText>
                <ThemedText style={styles.heroSub}>
                  Buy additional slots to publish more products instantly.
                </ThemedText>
              </View>
            </View>

            {slotInfo && (
              <View style={styles.capacityBadgeRow}>
                <View style={[styles.capacityPill, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" }]}>
                  <ThemedText style={styles.capacityPillLabel}>Included:</ThemedText>
                  <ThemedText style={styles.capacityPillVal}>{slotInfo.included_slots ?? 5}</ThemedText>
                </View>

                <View style={[styles.capacityPill, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" }]}>
                  <ThemedText style={styles.capacityPillLabel}>Purchased:</ThemedText>
                  <ThemedText style={styles.capacityPillVal}>{slotInfo.purchased_slots ?? 0}</ThemedText>
                </View>

                <View style={[styles.capacityPill, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" }]}>
                  <ThemedText style={styles.capacityPillLabel}>Used:</ThemedText>
                  <ThemedText style={styles.capacityPillVal}>{slotInfo.used_slots ?? 0}</ThemedText>
                </View>

                <View style={[styles.capacityPill, { backgroundColor: "#0284C7" }]}>
                  <Text style={[styles.capacityPillLabel, { color: "#FFF" }]}>Available:</Text>
                  <Text style={[styles.capacityPillVal, { color: "#FFF" }]}>
                    {slotInfo.available_slots ?? "∞"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* QUANTITY SELECTION CARD */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardSectionTitle}>Select Slot Package</ThemedText>

            {/* 4 PACKAGE CARDS IN A SINGLE HORIZONTAL ROW */}
            <View style={styles.packageRow}>
              {[10, 50, 100, 200].map((slots) => {
                const isSelected = quantity === slots;
                const { unitPrice: pkgUnitPrice, discountPercent: pkgDiscount } = calculatePricingDetails(slots);
                const pkgTotal = slots * pkgUnitPrice;

                return (
                  <TouchableOpacity
                    key={slots}
                    activeOpacity={0.75}
                    style={[
                      styles.packageCardCompact,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? "#064E3B"
                            : "#ECFDF5"
                          : isDark
                          ? "#2C2C2E"
                          : "#F9FAFB",
                        borderColor: isSelected ? "#10B981" : borderColor,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => setQuantity(slots)}
                  >
                    {pkgDiscount > 0 && (
                      <View style={styles.miniDiscountBadge}>
                        <Text style={styles.miniDiscountText}>-{pkgDiscount}%</Text>
                      </View>
                    )}

                    <ThemedText
                      style={[
                        styles.compactSlotText,
                        isSelected && { color: "#10B981", fontWeight: "800" },
                      ]}
                    >
                      {slots} Slots
                    </ThemedText>

                    <Text
                      style={[
                        styles.compactPriceText,
                        { color: isSelected ? "#10B981" : isDark ? "#FFFFFF" : "#111827" },
                      ]}
                    >
                      ₦{pkgTotal.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Quantity Stepper Control */}
            <View style={styles.customQtySection}>
              <ThemedText style={styles.customQtyLabel}>Or Custom Quantity:</ThemedText>
              <View style={styles.qtyControlRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.qtyBtn,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6",
                      opacity: quantity <= pricingConfig.min_qty ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => handleDecrement(1)}
                  disabled={quantity <= pricingConfig.min_qty}
                >
                  <Ionicons name="remove" size={16} color={isDark ? "#FFF" : "#111827"} />
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
                      backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6",
                      opacity: quantity >= pricingConfig.max_qty ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => handleIncrement(1)}
                  disabled={quantity >= pricingConfig.max_qty}
                >
                  <Ionicons name="add" size={16} color={isDark ? "#FFF" : "#111827"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* TIER PRICING DISCOUNTS */}
            {pricingConfig.tier_pricing && pricingConfig.tier_pricing.length > 0 && (
              <View style={styles.tierSection}>
                <View style={styles.tierHeaderRow}>
                  <Ionicons name="sparkles" size={14} color="#10B981" />
                  <Text style={styles.tierHeader}>Volume Tier Discounts</Text>
                </View>
                {pricingConfig.tier_pricing.map((tier: any, idx: number) => {
                  const isActive = quantity >= (tier.min_qty || 0);
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.tierRow,
                        isActive && { backgroundColor: "rgba(16, 185, 129, 0.15)", borderRadius: 6 },
                      ]}
                    >
                      <Ionicons
                        name={isActive ? "checkmark-circle" : "pricetag-outline"}
                        size={12}
                        color="#10B981"
                      />
                      <Text style={[styles.tierText, isActive && { fontWeight: "700" }]}>
                        Buy {tier.min_qty}+ slots: get {tier.discount_percent}% off (₦
                        {tier.price_per_slot ||
                          pricingConfig.price_per_slot * (1 - tier.discount_percent / 100)}
                        /slot)
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* SUMMARY BREAKDOWN CARD */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.cardSectionTitle}>Order Summary</ThemedText>

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Base Price per Slot</ThemedText>
              <ThemedText style={styles.summaryVal}>
                ₦{pricingConfig.price_per_slot.toLocaleString()}
              </ThemedText>
            </View>

            {discountPercent > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Volume Tier Discount</ThemedText>
                <Text style={[styles.summaryVal, { color: "#10B981", fontWeight: "700" }]}>
                  -{discountPercent}% OFF
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Applied Unit Price</ThemedText>
              <Text style={[styles.summaryVal, { color: "#10B981", fontWeight: "700" }]}>
                ₦{unitPrice.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Total Quantity</ThemedText>
              <ThemedText style={styles.summaryVal}>{quantity} slot(s)</ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.summaryRow}>
              <ThemedText style={styles.totalLabel}>Total Payable</ThemedText>
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
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="card" size={18} color="#FFF" />
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
    padding: 12,
    gap: 10,
  },
  heroCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  heroSub: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  capacityBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  capacityPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    gap: 4,
  },
  capacityPillLabel: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.7,
  },
  capacityPillVal: {
    fontSize: 11,
    fontWeight: "800",
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  qtyControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginVertical: 2,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    width: 68,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginVertical: 4,
  },
  packageCardCompact: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    position: "relative",
  },
  miniDiscountBadge: {
    position: "absolute",
    top: -5,
    right: -2,
    backgroundColor: "#10B981",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
  },
  miniDiscountText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
  },
  compactSlotText: {
    fontSize: 11,
    fontWeight: "700",
  },
  compactPriceText: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  customQtySection: {
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  customQtyLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  tierSection: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 8,
    borderRadius: 10,
    gap: 4,
    marginTop: 2,
  },
  tierHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tierHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  tierText: {
    fontSize: 11,
    color: "#10B981",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10B981",
  },
  payBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  payBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
