import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Text,
  Image,
  TextInput,
  Alert,
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

export default function SellerProductsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const primaryColor = Colors[isDark ? "dark" : "light"].primary;

  const fetchVendorProducts = useCallback(
    async (search = "") => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        let url = `${api.ENDPOINTS.VENDOR.PRODUCTS}`;
        if (search) {
          url += `?search=${encodeURIComponent(search)}`;
        }

        const res = await fetch(url, {
          headers: api.getHeaders(token),
        });

        if (res.ok) {
          const data = await res.json();
          setSlotInfo(data.slot_info);
          if (data.products && Array.isArray(data.products.data)) {
            setProducts(data.products.data);
          } else if (Array.isArray(data.products)) {
            setProducts(data.products);
          } else {
            setProducts([]);
          }
        } else {
          showToast("Unable to load seller products", "error");
        }
      } catch (err) {
        console.error("Error fetching vendor products:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchVendorProducts();
  }, [fetchVendorProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorProducts(searchQuery);
  };

  const handleDeleteProduct = (productId: number, productName: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(
                api.ENDPOINTS.VENDOR.PRODUCT_DETAILS(productId),
                {
                  method: "DELETE",
                  headers: api.getHeaders(token),
                }
              );
              if (res.ok) {
                showToast("Product deleted successfully", "success");
                fetchVendorProducts(searchQuery);
              } else {
                showToast("Failed to delete product", "error");
              }
            } catch (err) {
              showToast("Network error deleting product", "error");
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 120) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
      >
        {/* SLOT USAGE BADGE & BUY SLOTS ACTION */}
        {slotInfo && (
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

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.buySlotsBtn}
              onPress={() => router.push("/(seller)/buy-slots" as any)}
            >
              <Ionicons name="add-circle" size={16} color="#FFF" />
              <Text style={styles.buySlotsBtnText}>Buy Slots</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEARCH BAR */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
              borderColor,
            },
          ]}
        >
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
            placeholder="Search your products..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              fetchVendorProducts(text);
            }}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                fetchVendorProducts("");
              }}
            >
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* LOADING INDICATOR */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>
              Loading products...
            </ThemedText>
          </View>
        ) : products.length === 0 ? (
          /* EMPTY STATE */
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={54} color="#8E8E93" />
            <ThemedText style={styles.emptyTitle}>No Products Found</ThemedText>
            <ThemedText style={styles.emptySub}>
              You haven't listed any products yet. Tap below to start selling!
            </ThemedText>
          </View>
        ) : (
          /* PRODUCT LIST */
          products.map((item) => {
            const primaryImg =
              item.images && item.images.length > 0
                ? item.images.find((img: any) => img.is_primary)?.image_url ||
                  item.images[0].image_url
                : null;

            const isPublished = item.status === "published";

            return (
              <View
                key={item.id}
                style={[
                  styles.productCard,
                  { backgroundColor: cardBg, borderColor },
                ]}
              >
                {primaryImg ? (
                  <Image source={{ uri: primaryImg }} style={styles.productThumb} />
                ) : (
                  <View style={[styles.productThumb, styles.noThumb]}>
                    <Ionicons name="image-outline" size={24} color="#8E8E93" />
                  </View>
                )}

                <View style={styles.productDetails}>
                  <View style={styles.titleRow}>
                    <ThemedText style={styles.productName} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <View
                      style={[
                        styles.statusTag,
                        {
                          backgroundColor: isPublished
                            ? "#10B98120"
                            : "#F59E0B20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          { color: isPublished ? "#10B981" : "#F59E0B" },
                        ]}
                      >
                        {isPublished ? "Published" : "Draft"}
                      </Text>
                    </View>
                  </View>

                  <ThemedText style={[styles.productPrice, { color: primaryColor }]}>
                    ₦{Number(item.base_price).toLocaleString()}
                    {item.measurement_unit ? ` / ${item.measurement_unit}` : ""}
                  </ThemedText>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      Category: {item.category?.name || "General"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProduct(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
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
  buySlotsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  buySlotsBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  noThumb: {
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  productDetails: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    color: "#8E8E93",
  },
  deleteBtn: {
    padding: 8,
  },
});
