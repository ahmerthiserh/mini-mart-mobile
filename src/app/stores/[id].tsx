import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Linking,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PlaceholderGlow } from '@/components/placeholder-glow';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

const COVER_HEIGHT = 120;
const COLLAPSED_HEADER_HEIGHT = 56;
// Approx height of identity row (logo overlap + padding + text)
const IDENTITY_ROW_HEIGHT = 100;
const CATALOG_LABEL_HEIGHT = 36;

type Product = {
  id: number;
  name: string;
  price: string;
  category?: { name: string };
  image?: string;
  whatsapp_number?: string;
  whatsapp_url?: string;
};

type StoreDetails = {
  id: number;
  store_name: string;
  description?: string;
  logo?: string;
  cover_image?: string;
  location?: string;
  is_verified?: boolean;
  business_type?: string | null;
  opening_hours?: string;
  whatsapp_number?: string;
  whatsapp_url?: string;
  phone_number?: string;
};

export default function StoreCatalogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();

  const [store, setStore] = useState<StoreDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

  const scrollY = useRef(new Animated.Value(0)).current;

  const borderColor = isDark ? '#2A2A2A' : '#EBEBEB';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const bgColor = isDark ? '#0A0A0A' : '#F6F7FB';

  // Derived header animation values
  const headerHeight = insets.top + COLLAPSED_HEADER_HEIGHT;

  // Cover fades out as it scrolls under the sticky bar
  const COVER_FADE_END = COVER_HEIGHT - headerHeight;
  const coverOpacity = scrollY.interpolate({
    inputRange: [0, COVER_FADE_END * 0.5, COVER_FADE_END],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Sticky header title & bg appear only after the identity row scrolls off
  const STICKY_THRESHOLD_START = COVER_HEIGHT + IDENTITY_ROW_HEIGHT - headerHeight;
  const STICKY_THRESHOLD_END = STICKY_THRESHOLD_START + 30;
  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD_START, STICKY_THRESHOLD_END],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const stickyBgOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD_START - 10, STICKY_THRESHOLD_END],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (id) fetchStoreProducts();
  }, [id]);

  const fetchStoreProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeRes, productsRes] = await Promise.all([
        fetch(api.ENDPOINTS.STORE_DETAILS(Number(id))),
        fetch(api.ENDPOINTS.STORE_PRODUCTS(Number(id))),
      ]);

      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData);
      }

      if (!productsRes.ok) {
        setError('Server error while loading store catalog.');
        return;
      }

      const data = await productsRes.json();
      let fetchedProducts: Product[] = [];
      if (Array.isArray(data)) {
        fetchedProducts = data;
      } else if (data.data && Array.isArray(data.data)) {
        fetchedProducts = data.data;
      }
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to fetch store products', err);
      setError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (addedToCart.has(product.id)) {
      router.push('/cart');
      return;
    }
    try {
      const response = await fetch(`${api.ENDPOINTS.CART}/add`, {
        method: 'POST',
        headers: api.getHeaders(token),
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      if (!response.ok) {
        showToast('Could not add item to cart', 'error');
      } else {
        setAddedToCart(prev => {
          const s = new Set(prev);
          s.add(product.id);
          return s;
        });
        refreshCart();
        showToast(`${product.name} added to cart`, 'success');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleWhatsApp = (product: Product) => {
    const rawNumber = product.whatsapp_number || store?.whatsapp_number || store?.phone_number;
    const message = `Hello! I am interested in buying: ${product.name} (₦${parseFloat(product.price).toLocaleString()})`;
    const encodedMsg = encodeURIComponent(message);
    let url = '';
    if (rawNumber) {
      url = `https://wa.me/${rawNumber.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
    } else if (product.whatsapp_url || store?.whatsapp_url) {
      const base = (product.whatsapp_url || store?.whatsapp_url)!;
      url = base.includes('?') ? `${base}&text=${encodedMsg}` : `${base}?text=${encodedMsg}`;
    } else {
      showToast('Merchant WhatsApp not available', 'error');
      return;
    }
    Linking.openURL(url).catch(() => showToast('Could not open WhatsApp', 'error'));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStoreProducts();
  };

  // ─── Rich Store Header (scrolls away) ──────────────────────────────────────
  const StoreHeader = () => (
    <View>
      {/* Cover Image — only this part fades as it scrolls off */}
      <Animated.View style={[styles.cover, { height: COVER_HEIGHT, opacity: coverOpacity }]}>
        {store?.cover_image ? (
          <Image source={{ uri: store.cover_image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.coverPlaceholder]} />
        )}
        {/* Dark gradient overlay */}
        <View style={styles.coverOverlay} />
      </Animated.View>

      {/* Store Identity Row — always visible while on screen */}
      <View style={[styles.identityRow, { backgroundColor: isDark ? '#111' : '#fff', borderBottomColor: borderColor }]}>
        {/* Logo */}
        <View style={[styles.logoWrapper, { borderColor: isDark ? '#111' : '#fff', backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]}>
          {store?.logo ? (
            <Image source={{ uri: store.logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
          ) : (
            <ThemedText style={styles.logoInitial}>
              {store?.store_name?.charAt(0)?.toUpperCase() ?? '?'}
            </ThemedText>
          )}
        </View>

        {/* Info */}
        <View style={styles.storeInfoBlock}>
          <View style={styles.storeNameRow}>
            <ThemedText style={styles.storeNameLarge} numberOfLines={1}>{store?.store_name}</ThemedText>
            {store?.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4, marginTop: 1 }} />
            )}
          </View>

          {/* Meta chips row */}
          <View style={styles.metaRow}>
            {store?.location ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={11} color={isDark ? '#AAA' : '#666'} />
                <ThemedText style={styles.metaText} numberOfLines={1}>{store.location}</ThemedText>
              </View>
            ) : null}
            {store?.opening_hours ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={11} color={isDark ? '#AAA' : '#666'} />
                <ThemedText style={styles.metaText}>{store.opening_hours}</ThemedText>
              </View>
            ) : null}

          </View>

          {/* Description */}
          {store?.description ? (
            <ThemedText style={styles.description} numberOfLines={2}>{store.description}</ThemedText>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actionCol}>
          {(store?.whatsapp_number || store?.whatsapp_url) && (
            <TouchableOpacity
              style={styles.waBtn}
              onPress={() => {
                const num = store?.whatsapp_number?.replace(/[^0-9]/g, '');
                const url = num ? `https://wa.me/${num}` : store?.whatsapp_url;
                if (url) Linking.openURL(url).catch(() => showToast('Could not open WhatsApp', 'error'));
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {store?.phone_number && (
            <TouchableOpacity
              style={[styles.waBtn, { backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8' }]}
              onPress={() => Linking.openURL(`tel:${store.phone_number}`)}
            >
              <Ionicons name="call-outline" size={17} color={isDark ? '#fff' : '#333'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products count label */}
      <View style={[styles.catalogLabel, { backgroundColor: isDark ? '#111' : '#fff', borderBottomColor: borderColor }]}>
        <ThemedText style={styles.catalogLabelText}>
          {products.length > 0 ? `${products.length} Product${products.length !== 1 ? 's' : ''}` : 'Catalog'}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Fixed sticky header (always on top) ── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            height: headerHeight,
            paddingTop: insets.top,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Animated background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? '#000' : '#fff', opacity: stickyBgOpacity, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
          ]}
        />

        <View style={styles.stickyInner}>
          {/* Back button — always visible */}
          <TouchableOpacity
            style={[styles.backCircle, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }]}
            onPress={() => (router.canGoBack() ? router.back() : router.push('/stores'))}
          >
            <Ionicons name="arrow-back" size={21} color={isDark ? '#fff' : '#111'} />
          </TouchableOpacity>

          {/* Store name fades in as header collapses */}
          <Animated.View style={[styles.stickyTitleWrap, { opacity: stickyHeaderOpacity }]}>
            {store?.logo ? (
              <View style={styles.stickyLogo}>
                <Image source={{ uri: store.logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
            ) : null}
            <ThemedText style={styles.stickyTitle} numberOfLines={1}>{store?.store_name}</ThemedText>
            {store?.is_verified && <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />}
          </Animated.View>

          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#FFA62B" />
          <ThemedText style={styles.errorTitle}>Connection Failed</ThemedText>
          <ThemedText style={styles.errorSubtitle}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }]}
            onPress={fetchStoreProducts}
          >
            <ThemedText style={[styles.retryBtnText, { color: isDark ? '#000' : '#fff' }]}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.productsListContent, { paddingTop: 0 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          ListHeaderComponent={
            products.length === 0 ? null : <StoreHeader />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { marginTop: COVER_HEIGHT + 80 }]}>
              <Ionicons name="cube-outline" size={48} color="#A0A0A0" />
              <ThemedText style={styles.errorTitle}>No Products Available</ThemedText>
              <ThemedText style={styles.errorSubtitle}>This store has not uploaded any products yet.</ThemedText>
            </View>
          }
          renderItem={({ item: product }) => (
            <TouchableOpacity
              style={[styles.productCard, { borderColor, backgroundColor: cardBg }]}
              onPress={() => router.push(`/product/${product.id}` as any)}
            >
              <View style={styles.productImageContainer}>
                <PlaceholderGlow style={[StyleSheet.absoluteFill, { borderRadius: 10 }]} borderRadius={10} />
                {product.image && (
                  <Image
                    source={{ uri: product.image }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
                    contentFit="contain"
                    transition={200}
                  />
                )}
              </View>

              <View style={styles.productInfo}>
                {product.category?.name ? (
                  <ThemedText style={styles.productCategory}>{product.category.name}</ThemedText>
                ) : null}
                <ThemedText style={styles.productName} numberOfLines={2}>{product.name}</ThemedText>
                <View style={styles.productFooter}>
                  <ThemedText style={styles.productPrice}>₦{parseFloat(product.price).toLocaleString()}</ThemedText>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.waSmall} onPress={() => handleWhatsApp(product)}>
                      <Ionicons name="logo-whatsapp" size={15} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: addedToCart.has(product.id) ? '#10B981' : Colors[isDark ? 'dark' : 'light'].primary }]}
                      onPress={() => handleAddToCart(product)}
                    >
                      <Ionicons
                        name={addedToCart.has(product.id) ? 'checkmark' : 'add'}
                        size={16}
                        color={Colors[isDark ? 'dark' : 'light'].background}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ─── Sticky Header ───────────────────────────────────────────────────────
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  stickyInner: {
    height: COLLAPSED_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  stickyLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#DDD',
  },
  stickyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Cover ───────────────────────────────────────────────────────────────
  cover: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
  },
  coverPlaceholder: {
    backgroundColor: '#1E3A5F',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // ─── Identity Row ─────────────────────────────────────────────────────────
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    marginTop: -22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoInitial: {
    fontSize: 22,
    fontWeight: '800',
  },
  storeInfoBlock: {
    flex: 1,
    paddingTop: 6,
    gap: 4,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeNameLarge: {
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    opacity: 0.7,
    maxWidth: 120,
  },
  description: {
    fontSize: 12,
    opacity: 0.6,
    lineHeight: 17,
    marginTop: 2,
  },
  actionCol: {
    flexDirection: 'column',
    gap: 6,
    paddingTop: 8,
  },
  waBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Catalog label ────────────────────────────────────────────────────────
  catalogLabel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  catalogLabelText: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ─── Products ─────────────────────────────────────────────────────────────
  columnWrapper: {
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  productsListContent: {
    paddingBottom: 24,
  },
  productCard: {
    width: (width - 30) / 2,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 7,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 6,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  productInfo: { gap: 2 },
  productCategory: { fontSize: 10, opacity: 0.55, textTransform: 'uppercase', letterSpacing: 0.3 },
  productName: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: { fontWeight: '800', fontSize: 14 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  waSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── States ───────────────────────────────────────────────────────────────
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: {
    flex: 1,
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  errorSubtitle: { fontSize: 13, opacity: 0.6, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, alignItems: 'center' },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
});
