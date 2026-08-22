import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/config/api";

type Props = {
  visible: boolean;
  product: any | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function BoostProductModal({
  visible,
  product,
  onClose,
  onSuccess,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("Standard");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#E5E7EB";
  const cardBg = isDark ? "#2C2C2E" : "#F9FAFB";

  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      fetchPackages();
    }
  }, [visible]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.fetchWithTimeout(api.ENDPOINTS.VENDOR.BOOST_PACKAGES, {
        headers: api.getHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch (err) {
      console.error("Error loading boost packages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBoost = async () => {
    if (!product) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.fetchWithTimeout(api.ENDPOINTS.VENDOR.BOOST_PRODUCT, {
        method: "POST",
        headers: api.getHeaders(token),
        body: JSON.stringify({
          product_id: product.id,
          package: selectedPackage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Product boosted successfully!", "success");
        onSuccess();
        onClose();
      } else {
        const msg = data.message || "Failed to activate boost";
        setErrorMessage(msg);
      }
    } catch (err) {
      const netMsg = "Network error boosting product. Please try again.";
      setErrorMessage(netMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: modalBg,
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="rocket" size={22} color="#F59E0B" />
              <ThemedText style={styles.headerTitle}>
                Boost "{product.name}"
              </ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* HIGH-VISIBILITY ERROR ALERT BANNER */}
            {errorMessage && (
              <View style={styles.errorAlertBox}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorAlertTitle}>Slot Requirement Not Met</Text>
                  <Text style={styles.errorAlertText}>{errorMessage}</Text>
                </View>
                <TouchableOpacity onPress={() => setErrorMessage(null)} style={{ padding: 2 }}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}

            {/* VALUE BANNER */}
            <View style={styles.valueBanner}>
              <Ionicons name="trending-up" size={20} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.valueBannerTitle}>Get Up to 5x More Buyers</Text>
                <Text style={styles.valueBannerSub}>
                  Boosted products get top placement on discovery feeds and search results.
                </Text>
              </View>
            </View>

            {/* PACKAGE SELECTOR */}
            <Text style={[styles.sectionTitle, { color: isDark ? "#FFF" : "#111827" }]}>
              Select Boost Package
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#F59E0B" style={{ marginVertical: 30 }} />
            ) : (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const isSelected = selectedPackage === pkg.name;

                  return (
                    <TouchableOpacity
                      key={pkg.name}
                      activeOpacity={0.85}
                      style={[
                        styles.pkgCard,
                        {
                          backgroundColor: cardBg,
                          borderColor: isSelected ? "#F59E0B" : borderColor,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        setSelectedPackage(pkg.name);
                        setErrorMessage(null);
                      }}
                    >
                      {pkg.is_popular && (
                        <View style={styles.popularTag}>
                          <Text style={styles.popularTagText}>Most Popular</Text>
                        </View>
                      )}

                      <View style={styles.pkgRow}>
                        <View style={styles.radioCircle}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pkgName, { color: isDark ? "#FFF" : "#000" }]}>
                            {pkg.title} ({pkg.badge})
                          </Text>
                          <Text style={styles.pkgDesc}>{pkg.description}</Text>
                        </View>
                        <Text style={styles.pkgSlots}>
                          ⚡ {pkg.slots || 1} {pkg.slots === 1 ? "Slot" : "Slots"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* REAL-TIME ANALYTICS PROMISE */}
            <View style={[styles.analyticsNotice, { borderColor }]}>
              <Ionicons name="bar-chart" size={16} color="#10B981" />
              <Text style={styles.analyticsNoticeText}>
                Includes live stats: track impressions, product clicks, and leads.
              </Text>
            </View>
          </ScrollView>

          {/* CONFIRM ACTION */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.confirmBtn, { opacity: submitting ? 0.7 : 1 }]}
            disabled={submitting}
            onPress={handleConfirmBoost}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="rocket" size={18} color="#FFF" />
                <Text style={styles.confirmBtnText}>
                  Activate {selectedPackage} Boost
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingVertical: 16,
    gap: 16,
  },
  errorAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  errorAlertTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991B1B",
  },
  errorAlertText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
    marginTop: 2,
  },
  valueBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  valueBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0284C7",
  },
  valueBannerSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  packageList: {
    gap: 10,
  },
  pkgCard: {
    padding: 14,
    borderRadius: 14,
    position: "relative",
  },
  popularTag: {
    position: "absolute",
    top: -10,
    right: 14,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularTagText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  pkgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F59E0B",
  },
  pkgName: {
    fontSize: 14,
    fontWeight: "700",
  },
  pkgDesc: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  pkgSlots: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  analyticsNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  analyticsNoticeText: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: "#F59E0B",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
