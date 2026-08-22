import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAlert } from '@/context/AlertContext';
import api from '@/config/api';

const BRAND_BLUE = '#0284C7';

type SellerOrderItemDetails = {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  quantity: number;
  price: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'rejected' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  order?: {
    id: number;
    order_number?: string;
    uuid?: string;
    created_at?: string;
    user?: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
    shippingAddress?: {
      address_line_1?: string;
      address_line_2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
    };
    address?: {
      address_line_1?: string;
      address_line_2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
    };
  };
  product?: {
    id: number;
    name: string;
    base_price: string;
    description?: string;
    images?: Array<{
      id: number;
      image_url?: string;
      image_path?: string;
      url?: string;
      is_primary?: boolean;
    }>;
  };
  variant?: {
    id: number;
    name?: string;
    sku?: string;
  };
};

export default function SellerOrderDetailsScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const rawId = useLocalSearchParams().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useAlert();

  const [orderItem, setOrderItem] = useState<SellerOrderItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const borderColor = isDark ? '#27272A' : '#E5E7EB';
  const topBarBg = isDark ? '#09090B' : '#FFFFFF';

  const fetchOrderDetails = async () => {
    if (!id) return;
    try {
      const response = await fetch(api.ENDPOINTS.VENDOR.ORDER_DETAILS(id), {
        headers: api.getHeaders(token),
      });
      const json = await response.json();
      if (response.ok) {
        setOrderItem(json);
      } else {
        showToast(json.message || 'Order details not found', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch vendor order item details', err);
      showToast('Network error loading order details', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();
    }, [id, token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const handleUpdateStatus = (newStatus: string, actionLabel: string) => {
    if (!id) return;
    showConfirm(
      `${actionLabel} Order?`,
      `Are you sure you want to change order status to "${newStatus}"?`,
      async () => {
        setUpdating(true);
        try {
          const res = await fetch(api.ENDPOINTS.VENDOR.UPDATE_ORDER_STATUS(id), {
            method: 'PUT',
            headers: api.getHeaders(token),
            body: JSON.stringify({ status: newStatus }),
          });
          if (res.ok) {
            showToast(`Order status updated to ${newStatus}`, 'success');
            fetchOrderDetails();
          } else {
            const errData = await res.json();
            showToast(errData.message || 'Failed to update status', 'error');
          }
        } catch (err) {
          showToast('Network error updating status', 'error');
        } finally {
          setUpdating(false);
        }
      },
      undefined,
      actionLabel,
      'Cancel'
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: isDark ? '#3B1700' : '#FFEDD5',
          color: isDark ? '#FDBA74' : '#C2410C',
        };
      case 'processing':
        return {
          bg: isDark ? '#082F49' : '#E0F2FE',
          color: isDark ? '#7DD3FC' : '#0284C7',
        };
      case 'shipped':
        return {
          bg: isDark ? '#2E1065' : '#EDE9FE',
          color: isDark ? '#C4B5FD' : '#6D28D9',
        };
      case 'delivered':
        return {
          bg: isDark ? '#064E3B' : '#D1FAE5',
          color: isDark ? '#6EE7B7' : '#059669',
        };
      case 'rejected':
      case 'cancelled':
        return {
          bg: isDark ? '#450A0A' : '#FEE2E2',
          color: isDark ? '#FCA5A5' : '#DC2626',
        };
      default:
        return {
          bg: isDark ? '#27272A' : '#F3F4F6',
          color: isDark ? '#A1A1AA' : '#4B5563',
        };
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerLoading]}>
        <ActivityIndicator size="small" color={BRAND_BLUE} />
      </ThemedView>
    );
  }

  if (!orderItem) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12), backgroundColor: topBarBg }]}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={isDark ? '#FFF' : '#111827'} />
          </TouchableOpacity>
          <ThemedText style={styles.navTitle}>Order Details</ThemedText>
          <View style={styles.navBackBtn} />
        </View>
        <View style={styles.centerLoading}>
          <ThemedText style={{ opacity: 0.6 }}>Order details unavailable.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const getProductImg = () => {
    if (!orderItem.product?.images || orderItem.product.images.length === 0) return null;
    const primary = orderItem.product.images.find((i) => i.is_primary) || orderItem.product.images[0];
    const raw = primary?.image_url || primary?.url || primary?.image_path;
    if (!raw) return null;
    if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      return raw;
    }
    const rootDomain = api.BASE_URL.replace('/api', '');
    const cleanPath = String(raw).startsWith('/') ? raw : `/${raw}`;
    return `${rootDomain}${cleanPath}`;
  };

  const productImg = getProductImg();

  const shippingAddr = orderItem.order?.address || orderItem.order?.shippingAddress;
  const customerName = orderItem.order?.user?.name || 'Guest Customer';
  const customerEmail = orderItem.order?.user?.email;
  const customerPhone = orderItem.order?.user?.phone || shippingAddr?.phone;
  const statusStyle = getStatusStyle(orderItem.status);

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Phone Safe Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: topBarBg,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={isDark ? '#FFF' : '#111827'} />
        </TouchableOpacity>

        <ThemedText style={styles.navTitle}>Order Item #{orderItem.id}</ThemedText>

        <TouchableOpacity style={styles.navBackBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={18} color={isDark ? '#FFF' : '#111827'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
        }
      >
        {/* Status Header Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
          <View style={styles.statusBannerRow}>
            <View>
              <ThemedText style={styles.statusBannerLabel}>STATUS</ThemedText>
              <ThemedText style={[styles.statusBannerValue, { color: statusStyle.color }]}>
                {orderItem.status.toUpperCase()}
              </ThemedText>
            </View>
            <Ionicons name="pricetag-outline" size={26} color={statusStyle.color} />
          </View>
        </View>

        {/* Product Details Card */}
        <ThemedText style={styles.sectionHeader}>Product Information</ThemedText>
        <View style={[styles.cardBox, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.productRow}>
            {productImg ? (
              <Image source={{ uri: productImg }} style={styles.productImg} resizeMode="cover" />
            ) : (
              <View style={[styles.productImgPlaceholder, { backgroundColor: isDark ? '#27272A' : '#F3F4F6' }]}>
                <Ionicons name="image-outline" size={24} color="#A1A1AA" />
              </View>
            )}

            <View style={styles.productTextCol}>
              <ThemedText style={styles.productName}>{orderItem.product?.name || 'Store Item'}</ThemedText>
              {orderItem.variant?.name && (
                <ThemedText style={styles.variantTag}>Variant: {orderItem.variant.name}</ThemedText>
              )}
              <ThemedText style={styles.unitPriceText}>
                ₦{parseFloat(orderItem.price).toLocaleString()} / unit
              </ThemedText>
            </View>
          </View>

          {orderItem.product?.description && (
            <ThemedText style={styles.productDesc} numberOfLines={3}>
              {orderItem.product.description}
            </ThemedText>
          )}

          {/* Pricing Calculation Summary */}
          <View style={[styles.summaryBox, { backgroundColor: isDark ? '#27272A' : '#F9FAFB' }]}>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLbl}>Quantity Ordered:</ThemedText>
              <ThemedText style={styles.summaryVal}>{orderItem.quantity}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLbl}>Unit Price:</ThemedText>
              <ThemedText style={styles.summaryVal}>₦{parseFloat(orderItem.price).toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: borderColor }]}>
              <ThemedText style={styles.totalLbl}>Total Amount:</ThemedText>
              <ThemedText style={styles.totalVal}>
                ₦{(parseFloat(orderItem.price) * orderItem.quantity).toLocaleString()}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Customer Information Card */}
        <ThemedText style={styles.sectionHeader}>Customer Details</ThemedText>
        <View style={[styles.cardBox, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={BRAND_BLUE} />
            <ThemedText style={styles.infoTextBold}>{customerName}</ThemedText>
          </View>

          {customerEmail && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#8B5CF6" />
              <ThemedText style={styles.infoText}>{customerEmail}</ThemedText>
            </View>
          )}

          {customerPhone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#10B981" />
              <ThemedText style={styles.infoText}>{customerPhone}</ThemedText>
            </View>
          )}

          {/* Direct Communication Buttons */}
          {customerPhone && (
            <View style={styles.contactBtnRow}>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
                onPress={() => {
                  const cleanNum = customerPhone.replace(/[^0-9]/g, '');
                  const addressPart = shippingAddr
                    ? `\nDelivery Address: ${shippingAddr.address_line_1 || ''}${shippingAddr.address_line_2 ? `, ${shippingAddr.address_line_2}` : ''}${shippingAddr.city ? `, ${shippingAddr.city}` : ''}${shippingAddr.state ? `, ${shippingAddr.state}` : ''}`
                    : '';
                  const msgText = `Hello ${customerName}, regarding order #${orderItem.id} for ${orderItem.product?.name || 'Item'}.${addressPart}`;
                  const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msgText)}`;
                  Linking.openURL(url).catch(() => showToast('Could not open WhatsApp', 'error'));
                }}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                <ThemedText style={styles.contactBtnText}>WhatsApp Chat</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: isDark ? '#3F3F46' : '#E5E7EB' }]}
                onPress={() => Linking.openURL(`tel:${customerPhone}`)}
              >
                <Ionicons name="call-outline" size={16} color={isDark ? '#FFF' : '#111827'} />
                <ThemedText style={[styles.contactBtnText, { color: isDark ? '#FFF' : '#111827' }]}>
                  Phone Call
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Shipping Address Card */}
        {shippingAddr && (
          <>
            <ThemedText style={styles.sectionHeader}>Delivery Address</ThemedText>
            <View style={[styles.cardBox, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.addressLine}>
                    {shippingAddr.address_line_1}
                  </ThemedText>
                  {shippingAddr.address_line_2 && (
                    <ThemedText style={styles.addressLine}>
                      {shippingAddr.address_line_2}
                    </ThemedText>
                  )}
                  <ThemedText style={styles.addressSub}>
                    {shippingAddr.city ? `${shippingAddr.city}, ` : ''}
                    {shippingAddr.state || ''}
                    {shippingAddr.country ? ` (${shippingAddr.country})` : ''}
                  </ThemedText>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Order Meta / Dates */}
        <ThemedText style={styles.sectionHeader}>Order Metadata</ThemedText>
        <View style={[styles.cardBox, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Master Order Reference:</ThemedText>
            <ThemedText style={styles.metaVal}>
              {orderItem.order?.order_number || `#ORD-${String(orderItem.order_id).padStart(5, '0')}`}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Placed Date:</ThemedText>
            <ThemedText style={styles.metaVal}>
              {orderItem.created_at ? new Date(orderItem.created_at).toLocaleString() : 'N/A'}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View
        style={[
          styles.bottomBar,
          {
            borderTopColor: borderColor,
            backgroundColor: topBarBg,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        {updating ? (
          <ActivityIndicator size="small" color={BRAND_BLUE} style={{ paddingVertical: 8 }} />
        ) : (
          <>
            {orderItem.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.bottomActionBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => handleUpdateStatus('processing', 'Accept & Process')}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                  <ThemedText style={styles.bottomActionText}>Accept Order</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.bottomActionBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleUpdateStatus('rejected', 'Reject')}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#FFF" />
                  <ThemedText style={styles.bottomActionText}>Reject Order</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {orderItem.status === 'processing' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.bottomActionBtn, { backgroundColor: '#8B5CF6' }]}
                  onPress={() => handleUpdateStatus('shipped', 'Mark Shipped')}
                >
                  <Ionicons name="car-outline" size={18} color="#FFF" />
                  <ThemedText style={styles.bottomActionText}>Mark Shipped</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.bottomActionBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleUpdateStatus('rejected', 'Reject')}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#FFF" />
                  <ThemedText style={styles.bottomActionText}>Reject Order</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {orderItem.status === 'shipped' && (
              <TouchableOpacity
                style={[styles.bottomActionBtn, { backgroundColor: '#10B981', width: '100%' }]}
                onPress={() => handleUpdateStatus('delivered', 'Mark Delivered')}
              >
                <Ionicons name="checkmark-done-circle-outline" size={18} color="#FFF" />
                <ThemedText style={styles.bottomActionText}>Mark Delivered</ThemedText>
              </TouchableOpacity>
            )}

            {(orderItem.status === 'delivered' || orderItem.status === 'rejected' || orderItem.status === 'cancelled') && (
              <View style={styles.completedInfoRow}>
                <Ionicons
                  name={orderItem.status === 'delivered' ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={orderItem.status === 'delivered' ? '#10B981' : '#EF4444'}
                />
                <ThemedText style={styles.completedText}>
                  Order is currently marked as {orderItem.status}.
                </ThemedText>
              </View>
            )}
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
  },
  statusBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  statusBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    opacity: 0.8,
  },
  statusBannerValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 6,
  },
  cardBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  productImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productImgPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTextCol: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
  },
  variantTag: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 1,
  },
  unitPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_BLUE,
    marginTop: 3,
  },
  productDesc: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
  summaryBox: {
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLbl: {
    fontSize: 12,
    opacity: 0.65,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    paddingTop: 6,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLbl: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: BRAND_BLUE,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTextBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  contactBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  addressLine: {
    fontSize: 12,
    fontWeight: '700',
  },
  addressSub: {
    fontSize: 11,
    opacity: 0.65,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomBar: {
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  bottomActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  completedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
