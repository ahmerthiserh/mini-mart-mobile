import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/config/api';

const { width } = Dimensions.get('window');
const BRAND_BLUE = '#0284C7';

type DashboardData = {
  metrics?: {
    confirmed_sales?: number;
    pending_sales?: number;
    total_sales?: number;
    total_products?: number;
    pending_tasks?: number;
    store_views?: number;
    product_views?: number;
    product_impressions?: number;
  };
  slot_info?: {
    included_slots?: number;
    purchased_slots?: number;
    total_slots?: number;
    used_slots?: number;
    available_slots?: number;
    has_available_slot?: boolean;
  };
  recent_orders?: any[];
  store?: {
    id: number;
    store_name: string;
    is_verified: boolean;
    approval_status: string;
  };
};

export default function SellerDashboardScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const borderColor = isDark ? '#27272A' : '#E5E7EB';
  const topBarBg = isDark ? '#09090B' : '#FFFFFF';

  const fetchDashboard = async () => {
    try {
      const response = await fetch(api.ENDPOINTS.VENDOR.DASHBOARD, {
        headers: api.getHeaders(token),
      });
      if (response.ok) {
        const json = await response.json();
        setData(json);
      } else {
        showToast('Unable to load seller dashboard stats', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch vendor dashboard', err);
      showToast('Network error loading seller dashboard', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const metrics = data?.metrics || {};
  const slotInfo = data?.slot_info;
  const store = data?.store;

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Navigation Bar with Phone Notch Support */}
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
          onPress={() => (router.canGoBack() ? router.back() : router.push('/menu'))}
        >
          <Ionicons name="chevron-back" size={20} color={isDark ? '#FFF' : '#111827'} />
        </TouchableOpacity>

        <View style={styles.navTitleCenter}>
          <ThemedText style={styles.navTitle} numberOfLines={1}>
            {store?.store_name || 'Seller Dashboard'}
          </ThemedText>
          {store?.is_verified ? (
            <View style={styles.miniVerifiedBadge}>
              <Ionicons name="checkmark-circle" size={11} color="#10B981" />
              <ThemedText style={styles.miniVerifiedText}>Verified</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.miniSubText}>Seller Workspace</ThemedText>
          )}
        </View>

        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.push('/(seller)/store-profile' as any)}
        >
          <Ionicons name="settings-outline" size={18} color={isDark ? '#D4D4D8' : '#4B5563'} />
        </TouchableOpacity>
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
          {/* Sales Revenue KPI Row */}
          <View style={styles.revenueRow}>
            <View style={[styles.revenueCard, { backgroundColor: isDark ? '#0F172A' : '#0284C7' }]}>
              <View style={styles.salesHeaderRow}>
                <ThemedText style={styles.salesTag}>CONFIRMED</ThemedText>
                <Ionicons name="checkmark-circle-outline" size={16} color="#E0F2FE" />
              </View>
              <ThemedText style={styles.salesValue} numberOfLines={1} adjustsFontSizeToFit>
                ₦{Number(metrics.confirmed_sales ?? metrics.total_sales ?? 0).toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.salesDesc}>Confirmed earnings</ThemedText>
            </View>

            <View style={[styles.revenueCard, { backgroundColor: isDark ? '#1E1B4B' : '#4F46E5' }]}>
              <View style={styles.salesHeaderRow}>
                <ThemedText style={styles.salesTag}>PENDING</ThemedText>
                <Ionicons name="time-outline" size={16} color="#E0E7FF" />
              </View>
              <ThemedText style={styles.salesValue} numberOfLines={1} adjustsFontSizeToFit>
                ₦{Number(metrics.pending_sales ?? 0).toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.salesDesc}>Awaiting confirmation</ThemedText>
            </View>
          </View>

          {/* Compact Analytics Grid */}
          <ThemedText style={styles.sectionHeader}>Analytics Overview</ThemedText>
          <View style={styles.compactGrid}>
            {/* Store Visits */}
            <View style={[styles.compactCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.compactCardHeader}>
                <View style={[styles.compactIcon, { backgroundColor: isDark ? '#1E293B' : '#E0F2FE' }]}>
                  <Ionicons name="eye-outline" size={14} color="#0284C7" />
                </View>
                <ThemedText style={styles.compactVal}>
                  {Number(metrics.store_views || 0).toLocaleString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.compactLbl}>Store Visits</ThemedText>
            </View>

            {/* Product Clicks */}
            <View style={[styles.compactCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.compactCardHeader}>
                <View style={[styles.compactIcon, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                  <Ionicons name="open-outline" size={14} color="#6366F1" />
                </View>
                <ThemedText style={styles.compactVal}>
                  {Number(metrics.product_views || 0).toLocaleString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.compactLbl}>Product Clicks</ThemedText>
            </View>

            {/* Feed Impressions */}
            <View style={[styles.compactCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.compactCardHeader}>
                <View style={[styles.compactIcon, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                  <Ionicons name="aperture-outline" size={14} color="#10B981" />
                </View>
                <ThemedText style={styles.compactVal}>
                  {Number(metrics.product_impressions || 0).toLocaleString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.compactLbl}>Impressions</ThemedText>
            </View>

            {/* Catalog Items */}
            <View style={[styles.compactCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.compactCardHeader}>
                <View style={[styles.compactIcon, { backgroundColor: isDark ? '#4C1D95' : '#F5F3FF' }]}>
                  <Ionicons name="cube-outline" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={styles.compactVal}>
                  {Number(metrics.total_products || 0).toLocaleString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.compactLbl}>Active Products</ThemedText>
            </View>
          </View>

          {/* Product Slot Capacity Bar */}
          {slotInfo && (
            <View style={[styles.slotContainer, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.slotRow}>
                <View>
                  <ThemedText style={styles.slotTitle}>Catalog Slots</ThemedText>
                  <ThemedText style={styles.slotText}>
                    {slotInfo.used_slots} / {slotInfo.total_slots} used
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.slotBtn}
                  onPress={() => router.push('/(seller)/buy-slots' as any)}
                >
                  <ThemedText style={styles.slotBtnText}>+ Buy Slots</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.round(((slotInfo.used_slots || 0) / (slotInfo.total_slots || 1)) * 100)
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <ThemedText style={styles.sectionHeader}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/(seller)/orders' as any)}
            >
              <Ionicons name="receipt-outline" size={18} color="#F59E0B" />
              <ThemedText style={styles.actionPillText}>Seller Orders</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/(seller)/add-product' as any)}
            >
              <Ionicons name="add-circle-outline" size={18} color={BRAND_BLUE} />
              <ThemedText style={styles.actionPillText}>Add Product</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/(seller)/manage-store' as any)}
            >
              <Ionicons name="list-outline" size={18} color="#10B981" />
              <ThemedText style={styles.actionPillText}>Catalog</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push('/(seller)/store-profile' as any)}
            >
              <Ionicons name="storefront-outline" size={18} color="#8B5CF6" />
              <ThemedText style={styles.actionPillText}>Profile</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Recent Orders List */}
          {data?.recent_orders && data.recent_orders.length > 0 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8 }}>
                <ThemedText style={[styles.sectionHeader, { marginTop: 0, marginBottom: 0 }]}>Recent Orders</ThemedText>
                <TouchableOpacity onPress={() => router.push('/(seller)/orders' as any)}>
                  <ThemedText style={{ fontSize: 11, color: BRAND_BLUE, fontWeight: '700' }}>View All →</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={[styles.ordersCard, { backgroundColor: cardBg, borderColor }]}>
                {data.recent_orders.map((order, idx) => (
                  <View
                    key={order.id || idx}
                    style={[
                      styles.orderItemRow,
                      idx < data.recent_orders!.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: borderColor,
                      },
                    ]}
                  >
                    <View style={styles.orderLeftCol}>
                      <ThemedText style={styles.orderTitle} numberOfLines={1}>
                        {order.product?.name || 'Store Product'}
                      </ThemedText>
                      <ThemedText style={styles.orderSub}>
                        Qty: {order.quantity} • {order.order?.user?.name || 'Guest'}
                      </ThemedText>
                    </View>
                    <View style={styles.orderRightCol}>
                      <ThemedText style={styles.orderPrice}>
                        ₦{(parseFloat(order.price) * order.quantity).toLocaleString()}
                      </ThemedText>
                      <View style={styles.statusPill}>
                        <ThemedText style={styles.statusPillText}>{order.status}</ThemedText>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
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
  navTitleCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  miniVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  miniSubText: {
    fontSize: 10,
    opacity: 0.5,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
  },
  revenueRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  revenueCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  salesBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  salesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  salesTag: {
    color: '#E0F2FE',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  salesValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  salesDesc: {
    color: '#BAE6FD',
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
    marginTop: 6,
    marginBottom: 8,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  compactCard: {
    width: (width - 32) / 2,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  compactCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  compactIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  compactLbl: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '600',
  },
  slotContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  slotText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 1,
  },
  slotBtn: {
    backgroundColor: BRAND_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  slotBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_BLUE,
    borderRadius: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionPill: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  ordersCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  orderLeftCol: {
    flex: 1,
    marginRight: 8,
  },
  orderTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderSub: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 1,
  },
  orderRightCol: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
  },
});
