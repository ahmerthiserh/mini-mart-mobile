import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  useColorScheme,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/config/api";

type Props = {
  item: any;
  primaryColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onBoost?: () => void;
  onStatusChange?: () => void;
};

export function SellerProductCard({
  item,
  primaryColor,
  onEdit,
  onDelete,
  onBoost,
  onStatusChange,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"published" | "draft">(
    item.status === "published" ? "published" : "draft"
  );

  React.useEffect(() => {
    setCurrentStatus(item.status === "published" ? "published" : "draft");
  }, [item.status]);

  // Image preview modal state
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EEEEEE";
  const actionBg = isDark ? "#262628" : "#F8F9FA";

  const primaryImg =
    item.images && item.images.length > 0
      ? item.images.find((img: any) => img.is_primary)?.image_url ||
        item.images[0].image_url
      : null;

  const isPublished = currentStatus === "published";

  const handleToggleStatus = async () => {
    const nextStatus = isPublished ? "draft" : "published";
    setTogglingStatus(true);
    try {
      const res = await api.fetchWithTimeout(api.ENDPOINTS.VENDOR.PRODUCT_DETAILS(item.id), {
        method: "PUT",
        headers: api.getHeaders(token),
        body: JSON.stringify({
          name: item.name,
          category_id:
            item.category_id || (item.category ? item.category.id : 1),
          base_price: item.base_price,
          unit_quantity: item.unit_quantity || 1,
          base_quantity:
            item.inventory && item.inventory.length > 0
              ? item.inventory[0].quantity
              : 10,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        setCurrentStatus(nextStatus);
        showToast(
          `Status changed to ${
            nextStatus === "published" ? "Published" : "Draft"
          }`,
          "success"
        );
        if (onStatusChange) onStatusChange();
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (err) {
      showToast("Network error updating status", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <>
      <View style={[styles.productCard, { backgroundColor: cardBg, borderColor }]}>
        {/* THUMBNAIL IMAGE - TAP TO PREVIEW FULL IMAGE */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.imageContainer}
          onPress={() => {
            if (primaryImg) setImagePreviewVisible(true);
          }}
        >
          {primaryImg ? (
            <Image
              source={{ uri: primaryImg }}
              style={styles.productThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productThumb, styles.noThumb]}>
              <Ionicons name="image-outline" size={26} color="#A1A1AA" />
            </View>
          )}

          {/* BOOSTED BADGE */}
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="rocket" size={9} color="#FFF" />
              <Text style={styles.featuredBadgeText}>Boosted</Text>
            </View>
          )}

          {/* FULL IMAGE EXPAND ICON */}
          {primaryImg && (
            <View style={styles.expandIconBadge}>
              <Ionicons name="expand-outline" size={12} color="#FFF" />
            </View>
          )}

          {/* STATUS BADGE WITH ICON + TEXT OVERLAY */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.statusBadge,
              {
                backgroundColor: isPublished
                  ? "rgba(16, 185, 129, 0.9)"
                  : "rgba(245, 158, 11, 0.9)",
              },
            ]}
            onPress={handleToggleStatus}
            disabled={togglingStatus}
          >
            {togglingStatus ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name={isPublished ? "checkmark-circle" : "ellipse"}
                  size={10}
                  color="#FFF"
                />
                <Text style={styles.statusBadgeText}>
                  {isPublished ? "Published" : "Draft"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>

        {/* COMPACT PRODUCT CONTENT */}
        <View style={styles.cardContent}>
          <ThemedText style={styles.productName} numberOfLines={1}>
            {item.name}
          </ThemedText>

          <View style={styles.priceRow}>
            <ThemedText style={[styles.productPrice, { color: primaryColor }]}>
              ₦{Number(item.base_price).toLocaleString()}
            </ThemedText>
            {item.measurement_unit ? (
              <Text style={styles.unitText} numberOfLines={1}>
                /{item.measurement_unit}
              </Text>
            ) : null}
          </View>

          <Text style={styles.categoryText} numberOfLines={1}>
            {item.category?.name || item.category?.title || "General"}
          </Text>
        </View>

        {/* ACTIONS WITH TEXT & ICONS */}
        <View style={[styles.cardActions, { backgroundColor: actionBg, borderColor }]}>
          {onBoost && (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={onBoost}>
                <Ionicons name="rocket" size={13} color="#F59E0B" />
                <Text style={[styles.actionBtnText, { color: "#F59E0B", fontWeight: "700" }]}>
                  {item.is_featured ? "Boosted" : "Boost"}
                </Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            </>
          )}

          <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
            <Ionicons name="pencil" size={13} color="#0284C7" />
            <Text style={[styles.actionBtnText, { color: "#0284C7" }]}>Edit</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FULL IMAGE PREVIEW MODAL */}
      {primaryImg && (
        <Modal
          visible={imagePreviewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImagePreviewVisible(false)}
        >
          <View style={styles.modalOverlay}>
            {/* CLOSE BUTTON */}
            <TouchableOpacity
              style={[styles.closePreviewBtn, { top: Math.max(insets.top + 10, 30) }]}
              onPress={() => setImagePreviewVisible(false)}
            >
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>

            {/* FULL HIGH-RES IMAGE */}
            <Image
              source={{ uri: primaryImg }}
              style={styles.fullImage}
              resizeMode="contain"
            />

            {/* PRODUCT TITLE CAPTION */}
            <View
              style={[
                styles.previewCaption,
                { bottom: Math.max(insets.bottom + 20, 30) },
              ]}
            >
              <Text style={styles.previewTitle}>{item.name}</Text>
              <Text style={styles.previewPrice}>
                ₦{Number(item.base_price).toLocaleString()}
                {item.measurement_unit ? ` / ${item.measurement_unit}` : ""}
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  productCard: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  imageContainer: {
    width: "100%",
    height: 95,
    position: "relative",
  },
  productThumb: {
    width: "100%",
    height: "100%",
  },
  noThumb: {
    backgroundColor: "#F4F4F5",
    justifyContent: "center",
    alignItems: "center",
  },
  expandIconBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    padding: 4,
    borderRadius: 6,
  },
  featuredBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 2,
    zIndex: 2,
  },
  featuredBadgeText: {
    color: "#FFF",
    fontSize: 8.5,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 3,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  cardContent: {
    padding: 8,
    gap: 2,
  },
  productName: {
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 1,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "800",
  },
  unitText: {
    fontSize: 10,
    color: "#8E8E93",
  },
  categoryText: {
    fontSize: 10,
    color: "#A1A1AA",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 3,
  },
  actionBtnText: {
    fontWeight: "700",
    fontSize: 11,
  },
  divider: {
    width: 1,
    height: 14,
  },

  /* FULL IMAGE PREVIEW MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  closePreviewBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "92%",
    height: "70%",
  },
  previewCaption: {
    position: "absolute",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 20,
  },
  previewTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  previewPrice: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "800",
  },
});
