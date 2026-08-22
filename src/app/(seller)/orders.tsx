import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAlert } from '@/context/AlertContext';
import api from '@/config/api';

const BRAND_BLUE = '#0284C7';

type SellerOrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  quantity: number;
  price: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'rejected' | 'cancelled';
  created_at?: string;
  order?: {
    id: number;
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
      phone?: string;
    };
    address?: {
      address_line_1?: string;
      address_line_2?: string;
      city?: string;
      state?: string;
      phone?: string;
    };
  };
  product?: {
    id: number;
    name: string;
    base_price: string;
    images?: Array<{
      id: number;
      image_url?: string;
      image_path?: string;
      url?: string;
      is_primary?: boolean;
    }>;
  };
};

const STATUS_TABS = [
   { key: '', label: 'All' },
   { key: 'pending', label: 'Pending' },
   { key: 'processing', label: 'Processing' },
   { key: 'shipped', label: 'Shipped' },
   { key: 'delivered', label: 'Delivered' },
   { key: 'rejected', label: 'Rejected' },
];

export default function SellerOrdersScreen() {
   const isDark = useColorScheme() === 'dark';
   const router = useRouter();
   const insets = useSafeAreaInsets();
   const { token } = useAuth();
   const { showToast } = useToast();
   const { showConfirm } = useAlert();

   const [orders, setOrders] = useState<SellerOrderItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [activeTab, setActiveTab] = useState('');
   const [updatingId, setUpdatingId] = useState<number | null>(null);

   const cardBg = isDark ? '#18181B' : '#FFFFFF';
   const borderColor = isDark ? '#27272A' : '#E5E7EB';
   const topBarBg = isDark ? '#09090B' : '#FFFFFF';

   const fetchSellerOrders = async (statusFilter = activeTab) => {
      try {
         let url = api.ENDPOINTS.VENDOR.ORDERS;
         if (statusFilter) {
            url += `?status=${statusFilter}`;
         }
         const response = await fetch(url, {
            headers: api.getHeaders(token),
         });
         if (response.ok) {
            const json = await response.json();
            const dataList = Array.isArray(json) ? json : json.data || [];
            setOrders(dataList);
         } else {
            showToast('Failed to load seller orders', 'error');
         }
      } catch (err) {
         console.error('Failed to fetch seller orders', err);
         showToast('Network error loading seller orders', 'error');
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   useFocusEffect(
      useCallback(() => {
         fetchSellerOrders(activeTab);
      }, [token, activeTab])
   );

   const onRefresh = () => {
      setRefreshing(true);
      fetchSellerOrders(activeTab);
   };

   const handleUpdateStatus = (orderItemId: number, newStatus: string, actionLabel: string) => {
      showConfirm(
         `${actionLabel} Order?`,
         `Are you sure you want to set order status to "${newStatus}"?`,
         async () => {
            setUpdatingId(orderItemId);
            try {
               const res = await fetch(api.ENDPOINTS.VENDOR.UPDATE_ORDER_STATUS(orderItemId), {
                  method: 'PUT',
                  headers: api.getHeaders(token),
                  body: JSON.stringify({ status: newStatus }),
               });
               if (res.ok) {
                  showToast(`Order status updated to ${newStatus}`, 'success');
                  fetchSellerOrders(activeTab);
               } else {
                  const errData = await res.json();
                  showToast(errData.message || 'Failed to update order status', 'error');
               }
            } catch (err) {
               showToast('Network error while updating status', 'error');
            } finally {
               setUpdatingId(null);
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

  const openOrderDetails = (item: SellerOrderItem) => {
    router.push(`/(seller)/order-details/${item.id}` as any);
  };

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
            <TouchableOpacity
               style={styles.navBackBtn}
               onPress={() => (router.canGoBack() ? router.back() : router.push('/(seller)/dashboard' as any))}
            >
               <Ionicons name="chevron-back" size={20} color={isDark ? '#FFF' : '#111827'} />
            </TouchableOpacity>

            <ThemedText style={styles.navTitle}>Seller Orders</ThemedText>

            <TouchableOpacity style={styles.navBackBtn} onPress={onRefresh}>
               <Ionicons name="refresh-outline" size={18} color={isDark ? '#FFF' : '#111827'} />
            </TouchableOpacity>
         </View>

         {/* Filter Tabs */}
         <View style={[styles.tabsContainer, { borderBottomColor: borderColor, backgroundColor: topBarBg }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
               {STATUS_TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                     <TouchableOpacity
                        key={tab.key}
                        style={[
                           styles.tabChip,
                           isActive
                              ? { backgroundColor: BRAND_BLUE }
                              : { backgroundColor: isDark ? '#27272A' : '#F3F4F6' },
                        ]}
                        onPress={() => {
                           setActiveTab(tab.key);
                           setLoading(true);
                           fetchSellerOrders(tab.key);
                        }}
                     >
                        <ThemedText
                           style={[
                              styles.tabChipText,
                              { color: isActive ? '#FFF' : isDark ? '#A1A1AA' : '#4B5563' },
                           ]}
                        >
                           {tab.label}
                        </ThemedText>
                     </TouchableOpacity>
                  );
               })}
            </ScrollView>
         </View>

         {loading ? (
            <View style={styles.centerLoading}>
               <ActivityIndicator size="small" color={BRAND_BLUE} />
            </View>
         ) : (
            <ScrollView
               showsVerticalScrollIndicator={false}
               contentContainerStyle={styles.scrollContent}
               refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
               }
            >
               {orders.length === 0 ? (
                  <View style={styles.emptyBox}>
                     <Ionicons name="cube-outline" size={40} color="#A1A1AA" />
                     <ThemedText style={styles.emptyTitle}>No Seller Orders Found</ThemedText>
                     <ThemedText style={styles.emptySub}>
                        {activeTab ? `No orders matching status "${activeTab}".` : 'You have not received any orders yet.'}
                     </ThemedText>
                  </View>
               ) : (
                  orders.map((item) => {
                     const statusStyle = getStatusStyle(item.status);
                     const customerName = item.order?.user?.name || 'Guest Customer';
                     const customerPhone = item.order?.user?.phone || item.order?.shippingAddress?.phone;
                     const isUpdating = updatingId === item.id;
                      const primaryImg = item.product?.images?.find((i) => i.is_primary) || item.product?.images?.[0];
                      const rawImg = primaryImg?.image_url || primaryImg?.url || primaryImg?.image_path;
                      const productImg = rawImg
                        ? typeof rawImg === 'string' && (rawImg.startsWith('http://') || rawImg.startsWith('https://'))
                          ? rawImg
                          : `${api.BASE_URL.replace('/api', '')}${rawImg.startsWith('/') ? rawImg : `/${rawImg}`}`
                        : null;

                     return (
                        <TouchableOpacity
                           key={item.id}
                           activeOpacity={0.9}
                           style={[styles.orderCard, { backgroundColor: cardBg, borderColor }]}
                           onPress={() => openOrderDetails(item)}
                        >
                           {/* Order Card Header */}
                           <View style={styles.cardHeaderRow}>
                              <View>
                                 <ThemedText style={styles.orderIdText}>Item #{item.id}</ThemedText>
                                 <ThemedText style={styles.customerName}>{customerName}</ThemedText>
                              </View>

                              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                 <ThemedText style={[styles.statusText, { color: statusStyle.color }]}>
                                    {item.status}
                                 </ThemedText>
                              </View>
                           </View>

                           {/* Product Info Row with Thumbnail */}
                           <View style={[styles.productDetailsBox, { backgroundColor: isDark ? '#27272A' : '#F9FAFB' }]}>
                              {productImg ? (
                                <Image source={{ uri: productImg }} style={styles.productThumbImg} resizeMode="cover" />
                              ) : (
                                <View style={[styles.productThumbPlaceholder, { backgroundColor: isDark ? '#3F3F46' : '#E5E7EB' }]}>
                                  <Ionicons name="image-outline" size={20} color="#A1A1AA" />
                                </View>
                              )}

                              <View style={styles.productInfoCol}>
                                 <ThemedText style={styles.productName}>
                                    {item.product?.name || 'Purchased Product'}
                                 </ThemedText>
                                 <View style={styles.priceQtyRow}>
                                    <ThemedText style={styles.qtyText}>Qty: {item.quantity}</ThemedText>
                                    <ThemedText style={styles.totalPriceText}>
                                       ₦{(parseFloat(item.price) * item.quantity).toLocaleString()}
                                    </ThemedText>
                                 </View>
                              </View>
                           </View>

                  {/* Customer Contact Row */}
                  {customerPhone && (
                    <View style={styles.contactRow}>
                      <TouchableOpacity
                        style={[styles.contactPill, { backgroundColor: '#25D366' }]}
                        onPress={() => {
                          const cleanNum = customerPhone.replace(/[^0-9]/g, '');
                          const shippingAddr = item.order?.address || item.order?.shippingAddress;
                          const addressPart = shippingAddr
                            ? `\nDelivery Address: ${shippingAddr.address_line_1 || ''}${shippingAddr.address_line_2 ? `, ${shippingAddr.address_line_2}` : ''}${shippingAddr.city ? `, ${shippingAddr.city}` : ''}${shippingAddr.state ? `, ${shippingAddr.state}` : ''}`
                            : '';
                          const msgText = `Hello ${customerName}, regarding order #${item.id} for ${item.product?.name || 'Item'}.${addressPart}`;
                          const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msgText)}`;
                          Linking.openURL(url).catch(() => showToast('Could not open WhatsApp', 'error'));
                        }}
                      >
                        <Ionicons name="logo-whatsapp" size={13} color="#FFF" />
                        <ThemedText style={styles.contactPillText}>WhatsApp</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.contactPill, { backgroundColor: isDark ? '#3F3F46' : '#E5E7EB' }]}
                        onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                      >
                        <Ionicons name="call-outline" size={13} color={isDark ? '#FFF' : '#111827'} />
                        <ThemedText style={[styles.contactPillText, { color: isDark ? '#FFF' : '#111827' }]}>
                          Call
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 3 Action Buttons Row: Accept | Reject | View Details */}
                  <View style={styles.actionsRow}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={BRAND_BLUE} style={{ marginVertical: 4 }} />
                    ) : (
                      <>
                        {item.status === 'pending' && (
                          <>
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                              onPress={() => handleUpdateStatus(item.id, 'processing', 'Accept & Process')}
                            >
                              <Ionicons name="checkmark-circle-outline" size={14} color="#FFF" />
                              <ThemedText style={styles.actionBtnText}>Accept</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                              onPress={() => handleUpdateStatus(item.id, 'rejected', 'Reject')}
                            >
                              <Ionicons name="close-circle-outline" size={14} color="#FFF" />
                              <ThemedText style={styles.actionBtnText}>Reject</ThemedText>
                            </TouchableOpacity>
                          </>
                        )}

                        {item.status === 'processing' && (
                          <>
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
                              onPress={() => handleUpdateStatus(item.id, 'shipped', 'Mark Shipped')}
                            >
                              <Ionicons name="car-outline" size={14} color="#FFF" />
                              <ThemedText style={styles.actionBtnText}>Ship</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                              onPress={() => handleUpdateStatus(item.id, 'rejected', 'Reject')}
                            >
                              <Ionicons name="close-circle-outline" size={14} color="#FFF" />
                              <ThemedText style={styles.actionBtnText}>Reject</ThemedText>
                            </TouchableOpacity>
                          </>
                        )}

                        {item.status === 'shipped' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#10B981', flex: 1.5 }]}
                            onPress={() => handleUpdateStatus(item.id, 'delivered', 'Mark Delivered')}
                          >
                            <Ionicons name="checkmark-done-circle-outline" size={14} color="#FFF" />
                            <ThemedText style={styles.actionBtnText}>Deliver</ThemedText>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: BRAND_BLUE }]}
                          onPress={() => openOrderDetails(item)}
                        >
                          <Ionicons name="eye-outline" size={14} color="#FFF" />
                          <ThemedText style={styles.actionBtnText}>View Details</ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                        </TouchableOpacity>
                     );
                  })
               )}
            </ScrollView>
         )}
      </ThemedView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   centerLoading: {
      flex: 1,
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
   tabsContainer: {
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
   },
   tabsScroll: {
      paddingHorizontal: 12,
      gap: 6,
   },
   tabChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
   },
   tabChipText: {
      fontSize: 11,
      fontWeight: '700',
   },
   scrollContent: {
      padding: 12,
      paddingBottom: 32,
   },
   emptyBox: {
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
   },
   emptyTitle: {
      fontSize: 14,
      fontWeight: '700',
   },
   emptySub: {
      fontSize: 12,
      opacity: 0.6,
      textAlign: 'center',
   },
   orderCard: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 12,
      marginBottom: 10,
      gap: 8,
   },
   cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   orderIdText: {
      fontSize: 10,
      opacity: 0.5,
      fontWeight: '600',
      textTransform: 'uppercase',
   },
   customerName: {
      fontSize: 13,
      fontWeight: '800',
   },
   statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
   },
   statusText: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
   },
  productDetailsBox: {
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productThumbImg: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  productThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfoCol: {
    flex: 1,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  qtyText: {
    fontSize: 11,
    opacity: 0.7,
  },
  totalPriceText: {
    fontSize: 13,
    fontWeight: '800',
  },
   cardFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
   },
   contactRow: {
      flexDirection: 'row',
      gap: 6,
   },
   contactPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
   },
   contactPillText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '700',
   },
   viewDetailsBtn: {
      paddingVertical: 4,
      paddingHorizontal: 6,
   },
   viewDetailsText: {
      fontSize: 11,
      color: BRAND_BLUE,
      fontWeight: '700',
   },
   actionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
   },
   actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 6,
      gap: 4,
   },
   actionBtnText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '700',
   },
});
