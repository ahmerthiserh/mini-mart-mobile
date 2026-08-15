import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import api from "@/config/api";
import { PlaceholderGlow } from "@/components/placeholder-glow";

// MOCK_ORDERS removed in favor of dynamic backend data

const ORDER_TYPES = ["Active", "Completed", "Cancelled"];

export default function OrdersScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const cardBg = isDark ? "#141414" : "#FFFFFF";
  const borderColor = isDark ? "#2A2A2A" : "#EAEAEA";
  const iconBg = isDark ? "#222" : "#F5F5F5";

  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [token]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  }, [token]);

  const fetchOrders = async (isRefresh = false, url = api.ENDPOINTS.ORDERS) => {
    if (!token) return;
    try {
      if (!isRefresh && url === api.ENDPOINTS.ORDERS) setIsLoading(true);
      if (url !== api.ENDPOINTS.ORDERS) setIsFetchingMore(true);

      const res = await fetch(url, {
        headers: api.getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        let ordersArray = [];
        if (Array.isArray(data)) {
          ordersArray = data;
          setNextPageUrl(null);
        } else if (data.data && Array.isArray(data.data)) {
          ordersArray = data.data;
          setNextPageUrl(data.next_page_url || null);
        }

        const mappedOrders = ordersArray.map((o: any) => {
          let mappedStatus = "Processing";
          let statusColor = "#9C27B0"; // Purple color for Processing

          if (o.status === "pending") {
            mappedStatus = "Awaiting Payment";
            statusColor = "#FF9800"; // Orange color for awaiting payment
          } else if (o.status === "delivered") {
            mappedStatus = "Delivered";
            statusColor = "#00C853";
          } else if (o.status === "shipped") {
            mappedStatus = "Shipped";
            statusColor = "#2196F3";
          } else if (o.status === "cancelled" || o.status === "refunded") {
            mappedStatus = "Cancelled";
            statusColor = "#FF3D00";
          }

          return {
            id: o.order_number,
            dbId: o.id,
            date: new Date(o.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            total: `₦${Number(o.total_amount).toLocaleString()}`,
            status: mappedStatus,
            statusColor,
            items: o.items.map((i: any) => {
              const product = i.product;
              let imageUrl = null;
              if (product && product.images && product.images.length > 0) {
                imageUrl = product.images[0].image_url;
              }
              return {
                id: i.id,
                name: product?.name || "Unknown Item",
                image: imageUrl,
              };
            }),
          };
        });
        
        if (url === api.ENDPOINTS.ORDERS) {
          setOrders(mappedOrders);
        } else {
          setOrders(prev => [...prev, ...mappedOrders]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      if (!isRefresh && url === api.ENDPOINTS.ORDERS) setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (nextPageUrl && !isFetchingMore) {
      fetchOrders(false, nextPageUrl);
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by tab
    if (
      activeTab === "Active" &&
      order.status !== "Processing" &&
      order.status !== "Awaiting Payment" &&
      order.status !== "Shipped"
    )
      return false;
    if (activeTab === "Completed" && order.status !== "Delivered") return false;
    if (activeTab === "Cancelled" && order.status !== "Cancelled") return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(lowerQuery) ||
        order.items.some((item: any) =>
          item.name.toLowerCase().includes(lowerQuery),
        )
      );
    }

    return true;
  });

  if (!token) {
    return (
      <ThemedView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", padding: 24 },
        ]}
      >
        <Ionicons
          name="cube-outline"
          size={64}
          color={isDark ? "#FFF" : "#000"}
          style={{ marginBottom: 16, opacity: 0.6 }}
        />
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Track Your Orders
        </ThemedText>
        <ThemedText
          style={{
            fontSize: 14,
            opacity: 0.6,
            marginBottom: 24,
            textAlign: "center",
            paddingHorizontal: 20,
            lineHeight: 20,
          }}
        >
          Log in to view your order history, track active shipments in
          real-time, and manage your purchases.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark ? "#FFF" : "#000",
              paddingHorizontal: 32,
              paddingVertical: 12,
            },
          ]}
          onPress={() => router.push("/(auth)/login")}
        >
          <ThemedText
            style={[
              styles.actionText,
              { color: isDark ? "#000" : "#FFF", fontSize: 13 },
            ]}
          >
            Log In to Your Account
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: cardBg,
              borderColor: borderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={isDark ? "#888" : "#666"}
          />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
            placeholder="Search orders..."
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {ORDER_TYPES.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? "#FFF"
                        : "#000"
                      : cardBg,
                    borderColor: isActive
                      ? isDark
                        ? "#FFF"
                        : "#000"
                      : borderColor,
                    borderWidth: 1,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.tabText,
                    {
                      color: isActive
                        ? isDark
                          ? "#000"
                          : "#FFF"
                        : isDark
                          ? "#AAA"
                          : "#666",
                    },
                  ]}
                >
                  {tab}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#FFF" : "#000"}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <ActivityIndicator color={isDark ? "#FFF" : "#000"} style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              color={isDark ? "#FFF" : "#000"}
              style={{ marginVertical: 40 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="cube-outline"
                size={48}
                color={isDark ? "#444" : "#CCC"}
              />
              <ThemedText style={styles.emptyStateText}>
                No {activeTab.toLowerCase()} orders found
              </ThemedText>
            </View>
          )
        }
        renderItem={({ item: order }) => (
            <TouchableOpacity
              style={[
                styles.orderCard,
                {
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  borderWidth: 1,
                },
              ]}
            >
              {/* Header Section */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                    <Ionicons
                      name="cube"
                      size={16}
                      color={isDark ? "#FFF" : "#000"}
                    />
                  </View>
                  <View>
                    <ThemedText style={styles.orderId}>{order.id}</ThemedText>
                    <ThemedText style={styles.orderDate}>
                      {order.date}
                    </ThemedText>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: order.statusColor + "15" },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: order.statusColor },
                    ]}
                  />
                  <ThemedText
                    style={[styles.statusText, { color: order.statusColor }]}
                  >
                    {order.status}
                  </ThemedText>
                </View>
              </View>

              {/* Divider */}
              <View
                style={[styles.divider, { backgroundColor: borderColor }]}
              />

              {/* Images Preview Section */}
              <View style={styles.cardBody}>
                <View style={styles.imagesRow}>
                  {order.items.map((item: any, index: number) => (
                    <View
                      key={item.id}
                      style={[
                        styles.imagePlaceholder,
                        {
                          backgroundColor: iconBg,
                          borderColor: cardBg,
                          overflow: "hidden",
                        },
                        index === 0 ? { marginLeft: 0 } : {},
                      ]}
                    >
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <PlaceholderGlow
                          style={{ width: "100%", height: "100%" }}
                          borderRadius={8}
                        />
                      )}
                    </View>
                  ))}
                  <View style={styles.itemNamesContainer}>
                    <ThemedText style={styles.itemName} numberOfLines={1}>
                      {order.items.length > 0
                        ? order.items[0].name
                        : "Unknown Item"}
                    </ThemedText>
                    {order.items.length > 1 && (
                      <ThemedText style={styles.moreItemsText}>
                        +{order.items.length - 1} more item
                        {order.items.length > 2 ? "s" : ""}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>

              {/* Footer Section */}
              <View
                style={[styles.divider, { backgroundColor: borderColor }]}
              />
              <View style={styles.cardFooter}>
                <View>
                  <ThemedText style={styles.totalLabel}>
                    Total Amount
                  </ThemedText>
                  <ThemedText style={styles.totalValue}>
                    {order.total}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/order-details",
                      params: { orderId: order.dbId },
                    })
                  }
                  style={[
                    styles.actionButton,
                    { backgroundColor: isDark ? "#FFF" : "#000" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.actionText,
                      { color: isDark ? "#000" : "#FFF" },
                    ]}
                  >
                    View Details
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 100,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  orderCard: {
    borderRadius: 16,
    padding: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
  },
  orderDate: {
    fontSize: 11,
    opacity: 0.5,
    fontWeight: "500",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 8,
  },
  cardBody: {
    flexDirection: "row",
  },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
  },
  itemNamesContainer: {
    marginLeft: 8,
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreItemsText: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 2,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 9,
    opacity: 0.5,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: "500",
  },
});
