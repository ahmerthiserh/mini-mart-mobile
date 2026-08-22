import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PlaceholderGlow } from '@/components/placeholder-glow';
import { StoreCard, StoreItem } from '@/components/stores/store-card';
import { StoreFilterHeader, BusinessTypeOption } from '@/components/stores/store-filter-header';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

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
  
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeOption[]>([]);
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    fetchBusinessTypes();
  }, []);

  const fetchBusinessTypes = async () => {
    try {
      const response = await fetch(api.ENDPOINTS.BUSINESS_TYPES);
      if (response.ok) {
        const data = await response.json();
        const typesList = Array.isArray(data) ? data : (data.data || []);
        setBusinessTypes(typesList);
      }
    } catch (e) {
      console.log('Error fetching business types', e);
    }
  };

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
      let fetchedStores: StoreItem[] = [];
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
    router.push(`/stores/${store.id}` as any);
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

  // Filter stores based on search & selected business type
  const filteredStores = stores.filter((store) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = store.store_name?.toLowerCase().includes(q);
      const descMatch = store.description?.toLowerCase().includes(q);
      const locMatch = store.location?.toLowerCase().includes(q);
      if (!nameMatch && !descMatch && !locMatch) return false;
    }

    if (selectedBusinessTypeId !== null) {
      const selectedType = businessTypes.find(b => Number(b.id) === Number(selectedBusinessTypeId));
      
      if (store.business_type_id != null) {
        if (Number(store.business_type_id) !== Number(selectedBusinessTypeId)) {
          return false;
        }
      } else if (store.business_type_name && selectedType) {
        const sName = store.business_type_name.toLowerCase();
        const tName = selectedType.name.toLowerCase();
        if (!sName.includes(tName) && !tName.includes(sName)) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  });

  if (activeStore === null) {
    return (
      <ThemedView style={styles.container}>
        {/* Search & Business Category Filters Component */}
        <StoreFilterHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          businessTypes={businessTypes}
          stores={stores}
          selectedBusinessTypeId={selectedBusinessTypeId}
          onSelectBusinessType={setSelectedBusinessTypeId}
        />

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
        ) : filteredStores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color="#A0A0A0" />
            <ThemedText style={styles.errorTitle}>No Stores Found</ThemedText>
            <ThemedText style={styles.errorSubtitle}>
              {searchQuery || selectedBusinessTypeId !== null 
                ? 'No stores match your selected business filter or search query.' 
                : 'There are currently no active merchant stores available.'}
            </ThemedText>
            {(searchQuery || selectedBusinessTypeId !== null) && (
              <TouchableOpacity 
                style={[styles.retryBtn, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedBusinessTypeId(null);
                }}
              >
                <ThemedText style={[styles.retryBtnText, { color: isDark ? '#000' : '#fff' }]}>Reset Filters</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredStores}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.storeColumnWrapper}
            contentContainerStyle={styles.storesListContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
            renderItem={({ item: store }) => (
              <StoreCard store={store} onPress={handleStorePress} />
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
                  <Image source={{ uri: product.image }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} contentFit="contain" transition={200} />
                )}
              </View>

              <View style={styles.productInfo}>
                {product.category?.name ? <ThemedText style={styles.productCategory}>{product.category.name}</ThemedText> : null}
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
  storeColumnWrapper: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  storesListContent: {
    paddingVertical: 12,
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
