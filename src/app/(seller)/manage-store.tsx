import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAlert } from "@/context/AlertContext";
import { Colors } from "@/constants/Colors";
import api from "@/config/api";

// Extracted Sub-Components
import { StoreIncompleteBanner } from "@/components/seller/store-incomplete-banner";
import { SlotBanner } from "@/components/seller/slot-banner";
import { SellerProductCard } from "@/components/seller/seller-product-card";

export default function SellerProductsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeInfo, setStoreInfo] = useState<any>(null);

  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const primaryColor = Colors[isDark ? "dark" : "light"].primary;

  const fetchVendorProducts = useCallback(
    async (search = "") => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        let url = `${api.ENDPOINTS.VENDOR.PRODUCTS}?per_page=50`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }

        const [res, storeRes] = await Promise.all([
          api.fetchWithTimeout(url, { headers: api.getHeaders(token) }),
          api.fetchWithTimeout(api.ENDPOINTS.VENDOR.STORE, { headers: api.getHeaders(token) }),
        ]);

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

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStoreInfo(storeData);
        }
      } catch (err) {
        console.error("Error fetching vendor products:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, showToast]
  );

  // Re-fetch product and slot data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchVendorProducts(searchQuery);
    }, [fetchVendorProducts, searchQuery])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorProducts(searchQuery);
  };

  const handleDeleteProduct = (productId: number, productName: string) => {
    showAlert({
      title: "Delete Product",
      message: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      iconName: "trash-outline",
      iconColor: "#EF4444",
      confirmText: "Delete",
      confirmBtnColor: "#EF4444",
      cancelText: "Cancel",
      onConfirm: async () => {
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
    });
  };

  const handleAddProduct = () => {
    if (storeInfo && !storeInfo.logo) {
      showAlert({
        title: "Store Logo Required",
        message: "Please set up your store profile (at least your store logo / profile picture) before uploading products.",
        iconName: "image-outline",
        iconColor: "#D97706",
        confirmText: "Setup Profile",
        confirmBtnColor: "#D97706",
        cancelText: "Cancel",
        onConfirm: () => {
          router.push("/(seller)/store-profile" as any);
        },
      });
      return;
    }

    const available = slotInfo?.available_slots;
    const hasAvailable = slotInfo
      ? slotInfo.has_available_slot !== undefined
        ? slotInfo.has_available_slot
        : (available === "∞" || Number(available) > 0)
      : true;

    if (!hasAvailable) {
      showAlert({
        title: "No Slots Available",
        message: "You have reached your product upload limit. Please buy additional product slots to list new products.",
        iconName: "cube-outline",
        iconColor: "#0284C7",
        confirmText: "Buy Slots",
        confirmBtnColor: "#0284C7",
        cancelText: "Cancel",
        onConfirm: () => {
          router.push("/(seller)/buy-slots" as any);
        },
      });
    } else {
      router.push("/(seller)/add-product" as any);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 120, 150) },
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
        {/* INCOMPLETE PROFILE BANNER */}
        {storeInfo && !storeInfo.logo && (
          <StoreIncompleteBanner
            onSetupProfile={() => router.push("/(seller)/store-profile" as any)}
          />
        )}

        {/* SLOT USAGE BADGE & ACTIONS */}
        <SlotBanner
          slotInfo={slotInfo}
          onAddProduct={handleAddProduct}
          onBuySlots={() => router.push("/(seller)/buy-slots" as any)}
        />

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
          /* 2 IN A ROW GRID PRODUCT LIST */
          <View style={styles.productGrid}>
            {products.map((item) => (
              <SellerProductCard
                key={item.id}
                item={item}
                primaryColor={primaryColor}
                onEdit={() =>
                  router.push({
                    pathname: "/(seller)/edit-product",
                    params: { productId: String(item.id) },
                  } as any)
                }
                onDelete={() => handleDeleteProduct(item.id, item.name)}
                onStatusChange={() => fetchVendorProducts(searchQuery)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (Add Product) */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.fab,
          { backgroundColor: "#0284C7", bottom: Math.max(insets.bottom + 20, 30) },
        ]}
        onPress={handleAddProduct}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
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
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
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
});
