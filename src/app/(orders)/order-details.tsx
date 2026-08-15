import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import api from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { PlaceholderGlow } from "@/components/placeholder-glow";

export default function OrderDetailsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const cardBg = isDark ? "#141414" : "#FFFFFF";
  const borderColor = isDark ? "#2A2A2A" : "#EAEAEA";
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const { token } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (order?.payment?.virtual_account_expires_at) {
      const updateTimer = () => {
        const expiry = new Date(order.payment.virtual_account_expires_at).getTime();
        const now = new Date().getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeLeft("Expired");
          return true;
        } else {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Expires in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
          return false;
        }
      };

      const isExpired = updateTimer();
      if (isExpired) return;

      const interval = setInterval(() => {
        if (updateTimer()) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [order?.payment?.virtual_account_expires_at]);

  useEffect(() => {
    if (token && orderId) {
      fetchOrderDetails();
    }
  }, [token, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(api.ENDPOINTS.ORDER_DETAILS(orderId), {
        headers: api.getHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [verifying, setVerifying] = useState(false);
  const [repaying, setRepaying] = useState(false);

  const handleRepay = async () => {
    setRepaying(true);
    try {
      const res = await fetch(api.ENDPOINTS.REPAY_ORDER(orderId), {
        method: "POST",
        headers: api.getHeaders(token),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        alert("A new virtual account has been generated for you.");
      } else {
        alert(
          data.message ||
            "We could not generate a new payment account. Please try again later.",
        );
      }
    } catch (e) {
      alert("Failed to request new payment account. Check your connection.");
    } finally {
      setRepaying(false);
    }
  };

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      const res = await fetch(api.ENDPOINTS.VERIFY_PAYMENT(orderId), {
        method: "POST",
        headers: api.getHeaders(token),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        alert("Your payment has been successfully confirmed!");
      } else {
        alert(
          data.message ||
            "We could not verify your payment yet. Please try again shortly.",
        );
      }
    } catch (e) {
      alert("Failed to verify payment. Check your connection.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <ThemedView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={isDark ? "#FFF" : "#000"} />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ThemedText>Order not found</ThemedText>
      </ThemedView>
    );
  }

  const subtotal = order.total_amount - 5000; // Since shipping is hardcoded to 5000 in controller

  let mappedStatus = "Processing";
  let statusColor = "#9C27B0"; // Purple color for Processing

  if (order.status === "pending") {
    mappedStatus = "Awaiting Payment";
    statusColor = "#FF9800"; // Orange color for awaiting payment
  } else if (order.status === "delivered") {
    mappedStatus = "Delivered";
    statusColor = "#00C853";
  } else if (order.status === "shipped") {
    mappedStatus = "Shipped";
    statusColor = "#2196F3";
  } else if (order.status === "cancelled" || order.status === "refunded") {
    mappedStatus = "Cancelled";
    statusColor = "#FF3D00";
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: borderColor },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View>
              <ThemedText style={styles.title}>
                Order #{order.order_number}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Placed on{" "}
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </ThemedText>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "15" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <ThemedText style={[styles.statusText, { color: statusColor }]}>
                {mappedStatus}
              </ThemedText>
            </View>
          </View>
          <View style={styles.divider} />

          {order.status === "pending" &&
            order.payment &&
            order.payment.status === "pending" &&
            order.payment.virtual_account_number && (
              <View
                style={{
                  marginBottom: 20,
                  backgroundColor: isDark ? "#1E3A8A20" : "#EFF6FF",
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#1E3A8A" : "#BFDBFE",
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={32}
                  color="#3B82F6"
                  style={{ alignSelf: "center", marginBottom: 8 }}
                />
                <ThemedText
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#60A5FA" : "#1E3A8A",
                    marginBottom: 4,
                  }}
                >
                  Awaiting Payment
                </ThemedText>
                <ThemedText
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: isDark ? "#60A5FA" : "#1E3A8A",
                    marginBottom: 16,
                  }}
                >
                  Please transfer the exact amount to the virtual account below.
                </ThemedText>

                <View
                  style={{
                    backgroundColor: isDark ? "#141414" : "#FFF",
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isDark ? "#333" : "#E5E7EB",
                  }}
                >
                  <ThemedText
                    style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}
                  >
                    Bank Name
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      marginBottom: 12,
                    }}
                  >
                    {order.payment.virtual_bank_name}
                  </ThemedText>

                  <ThemedText
                    style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}
                  >
                    Account Number
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 24,
                      fontWeight: "800",
                      color: "#2563EB",
                      letterSpacing: 2,
                      marginBottom: 12,
                    }}
                  >
                    {order.payment.virtual_account_number}
                  </ThemedText>

                  <ThemedText
                    style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}
                  >
                    Amount to Transfer
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      marginBottom: 12,
                    }}
                  >
                    ₦{Number(order.payment.amount).toLocaleString()}
                  </ThemedText>

                  {order.payment.virtual_account_expires_at && (
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: isDark ? "#333" : "#F3F4F6",
                        paddingTop: 8,
                        marginTop: 4,
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 12,
                          color: "#EF4444",
                          textAlign: "center",
                          fontWeight: "500",
                        }}
                      >
                        {timeLeft || `Expires by ${new Date(
                          order.payment.virtual_account_expires_at,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#2563EB",
                    padding: 14,
                    borderRadius: 8,
                    marginTop: 16,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                  onPress={handleVerifyPayment}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator
                      color="#FFF"
                      style={{ marginRight: 8 }}
                    />
                  ) : null}
                  <ThemedText
                    style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}
                  >
                    I have made the transfer
                  </ThemedText>
                </TouchableOpacity>

                {timeLeft === "Expired" && (
                  <View style={{ alignItems: "center", marginTop: 16, borderTopWidth: 1, borderTopColor: isDark ? "#333" : "#E5E7EB", paddingTop: 16 }}>
                    <ThemedText style={{ color: "#EF4444", marginBottom: 12, fontWeight: "600", fontSize: 13, textAlign: "center" }}>
                      Your payment time has expired. If you haven't made the transfer, please generate a new account.
                    </ThemedText>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: isDark ? "#60A5FA" : "#1E3A8A",
                        padding: 14,
                        borderRadius: 8,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        width: "100%",
                      }}
                      onPress={handleRepay}
                      disabled={repaying}
                    >
                      {repaying ? (
                        <ActivityIndicator color={isDark ? "#60A5FA" : "#1E3A8A"} style={{ marginRight: 8 }} />
                      ) : (
                        <Ionicons name="refresh" size={20} color={isDark ? "#60A5FA" : "#1E3A8A"} style={{ marginRight: 8 }} />
                      )}
                      <ThemedText style={{ color: isDark ? "#60A5FA" : "#1E3A8A", fontWeight: "700", fontSize: 14 }}>
                        Generate New Payment Account
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

          <ThemedText style={styles.sectionTitle}>Items</ThemedText>
          {order.items?.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, { marginBottom: 12 }]}
              onPress={() => router.push(`/product/${item.product_id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.itemPlaceholder, { overflow: "hidden" }]}>
                {item.product?.images?.[0]?.image_url ? (
                  <Image
                    source={{ uri: item.product.images[0].image_url }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <PlaceholderGlow style={{ width: "100%", height: "100%" }} borderRadius={8} />
                )}
              </View>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>
                  {item.product?.name || "Unknown Item"}
                </ThemedText>
                <ThemedText style={styles.itemPrice}>
                  ₦{Number(item.price).toLocaleString()}
                </ThemedText>
                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                  Qty: {item.quantity}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.viewButton,
                  { backgroundColor: isDark ? "#333" : "#F5F5F5" },
                ]}
              >
                <ThemedText style={{ fontSize: 11, fontWeight: "700" }}>
                  View
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>
              ₦{subtotal.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Shipping</ThemedText>
            <ThemedText style={styles.summaryValue}>₦5,000</ThemedText>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>
              ₦{Number(order.total_amount).toLocaleString()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: borderColor }]}
            onPress={() =>
              router.push({
                pathname: "/track-order",
                params: { orderId: order.id },
              })
            }
          >
            <ThemedText style={styles.secondaryButtonText}>
              Track Order
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: isDark ? "#FFF" : "#000" },
            ]}
            onPress={() => router.replace("/(orders)/orders")}
          >
            <ThemedText
              style={[
                styles.primaryButtonText,
                { color: isDark ? "#000" : "#FFF" },
              ]}
            >
              Back to Orders
            </ThemedText>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.5,
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
    backgroundColor: "#333",
    marginVertical: 16,
    opacity: 0.2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginLeft: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
