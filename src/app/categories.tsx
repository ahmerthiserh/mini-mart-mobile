import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, useColorScheme, Dimensions, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PlaceholderGlow } from '@/components/placeholder-glow';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type StoreItem = {
  id: number;
  store_name: string;
  store_slug: string;
  description?: string;
  logo?: string;
  cover_image?: string;
  is_verified?: boolean;
  rating?: number;
  reviews_count?: number;
  location?: string;
  whatsapp_url?: string;
};

type Product = {
  id: number;
  name: string;
  price: string;
  category?: { name: string };
  image?: string;
};

export default function StoresScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [activeStore, setActiveStore] = useState<StoreItem | null>(null);
  
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

  const borderColor = isDark ? '#333' : '#EAEAEA';
  const cardBg = isDark ? '#141414' : '#FFFFFF';

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async (isRefresh = false) => {
    if (!isRefresh) setLoadingStores(true);
    setStoresError(null);
    try {
      const response = await fetch(api.ENDPOINTS.STORES);
      if (!response.ok) {
        setStoresError('Server error while loading stores.');
        return;
      }
      const data = await response.json();
      let fetchedStores = [];
      if (Array.isArray(data)) {
        fetchedStores = data;
      } else if (data.data && Array.isArray(data.data)) {
        fetchedStores = data.data;
      }
      setStores(fetchedStores);
    } catch (error) {
      console.error('Failed to fetch stores', error);
      setStoresError('Connection failed. Please check your network.');
    } finally {
      setLoadingStores(false);
      setRefreshing(false);
    }
  };

  const fetchStoreProducts = async (storeId: number) => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const response = await fetch(api.ENDPOINTS.STORE_PRODUCTS(storeId));
      if (!response.ok) {
        setProductsError('Server error while fetching store products.');
        return;
      }
      const data = await response.json();
      let fetchedProducts = [];
      if (Array.isArray(data)) {
        fetchedProducts = data;
      } else if (data.data && Array.isArray(data.data)) {
        fetchedProducts = data.data;
      }
      setStoreProducts(fetchedProducts);
    } catch (error) {
      console.error('Failed to fetch store products', error);
      setProductsError('Connection failed. Please check your network.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleStorePress = (store: StoreItem) => {
    setActiveStore(store);
    fetchStoreProducts(store.id);
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
          const newSet = new Set(prev);
          newSet.add(product.id);
          return newSet;
        });
        refreshCart();
        showToast(`${product.name} added to cart`, 'success');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeStore) {
      fetchStoreProducts(activeStore.id);
      setRefreshing(false);
    } else {
      fetchStores(true);
    }
  };

  if (activeStore === null) {
    return (
      <ThemedView style={styles.container}>
        {loadingStores ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].primary} />
          </View>
        ) : storesError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#FFA62B" />
            <ThemedText style={styles.errorTitle}>Connection Failed</ThemedText>
            <ThemedText style={styles.errorSubtitle}>{storesError}</ThemedText>
            <TouchableOpacity 
              style={[styles.retryBtn, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }]}
              onPress={() => fetchStores()}
            >
              <ThemedText style={[styles.retryBtnText, { color: isDark ? '#000' : '#fff' }]}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        ) : stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color="#A0A0A0" />
            <ThemedText style={styles.errorTitle}>No Stores Found</ThemedText>
            <ThemedText style={styles.errorSubtitle}>There are currently no active merchant stores available.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={stores}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.storesListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
            renderItem={({ item: store }) => (
              <TouchableOpacity 
                style={[styles.storeCard, { borderColor, backgroundColor: cardBg }]} 
                onPress={() => handleStorePress(store)}
              >
                {/* Cover / Header Banner */}
                <View style={styles.coverContainer}>
                  <PlaceholderGlow style={StyleSheet.absoluteFill} />
                  {store.cover_image ? (
                    <Image source={{ uri: store.cover_image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#262626' : '#E8E8E8' }]} />
                  )}
                  {store.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#00C853" />
                      <ThemedText style={styles.verifiedText}>Verified</ThemedText>
                    </View>
                  )}
                </View>

                {/* Store Body */}
                <View style={styles.storeBody}>
                  {/* Logo Overlay */}
                  <View style={[styles.logoContainer, { borderColor: cardBg, backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                    {store.logo ? (
                      <Image source={{ uri: store.logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                    ) : (
                      <ThemedText style={{ fontSize: 20, fontWeight: '800' }}>
                        {store.store_name.charAt(0).toUpperCase()}
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.storeInfoText}>
                    <ThemedText style={styles.storeName} numberOfLines={1}>{store.store_name}</ThemedText>
                    {store.location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color={isDark ? '#AAA' : '#666'} />
                        <ThemedText style={styles.locationText} numberOfLines={1}>{store.location}</ThemedText>
                      </View>
                    )}
                    {store.description && (
                      <ThemedText style={styles.storeDescription} numberOfLines={2}>{store.description}</ThemedText>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ThemedView>
    );
  }

  // Active Store Products View
  return (
    <ThemedView style={styles.container}>
      <View style={[styles.activeHeader, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => setActiveStore(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors[isDark ? 'dark' : 'light'].text} />
        </TouchableOpacity>
        <ThemedText style={styles.activeTitle} numberOfLines={1}>{activeStore.store_name}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {loadingProducts ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].primary} />
        </View>
      ) : productsError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#FFA62B" />
          <ThemedText style={styles.errorTitle}>Connection Failed</ThemedText>
          <ThemedText style={styles.errorSubtitle}>{productsError}</ThemedText>
          <TouchableOpacity 
            style={[styles.retryBtn, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }]}
            onPress={() => fetchStoreProducts(activeStore.id)}
          >
            <ThemedText style={[styles.retryBtnText, { color: isDark ? '#000' : '#fff' }]}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      ) : storeProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color="#A0A0A0" />
          <ThemedText style={styles.errorTitle}>No Products Found</ThemedText>
          <ThemedText style={styles.errorSubtitle}>This store has not uploaded any products yet.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={storeProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.productsListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
          renderItem={({ item: product }) => (
            <TouchableOpacity 
              style={[styles.productCard, { borderColor, backgroundColor: cardBg }]}
              onPress={() => router.push(`/product/${product.id}` as any)}
            >
              <View style={styles.productImageContainer}>
                <PlaceholderGlow style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} borderRadius={12} />
                {product.image && (
                  <Image source={{ uri: product.image }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} contentFit="cover" transition={200} />
                )}
              </View>

              <View style={styles.productInfo}>
                <ThemedText style={styles.productCategory}>{product.category?.name || 'General'}</ThemedText>
                <ThemedText type="default" style={styles.productName} numberOfLines={1}>{product.name}</ThemedText>
                <View style={styles.productFooter}>
                  <ThemedText style={styles.productPrice}>₦{parseFloat(product.price).toLocaleString()}</ThemedText>
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }]}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Ionicons name="add" size={18} color={Colors[isDark ? 'dark' : 'light'].background} />
                  </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storesListContent: {
    padding: 12,
    gap: 14,
  },
  storeCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  storeBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
    position: 'relative',
    flexDirection: 'row',
    gap: 12,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    marginTop: -24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storeInfoText: {
    flex: 1,
    paddingTop: 6,
    gap: 2,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    opacity: 0.6,
  },
  storeDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  columnWrapper: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  productsListContent: {
    paddingVertical: 10,
  },
  productCard: {
    width: (width - 34) / 2,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 6,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 6,
  },
  productInfo: {
    gap: 2,
  },
  productCategory: {
    fontSize: 11,
    opacity: 0.6,
  },
  productName: {
    fontSize: 13,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  productPrice: {
    fontWeight: '700',
    fontSize: 14,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
