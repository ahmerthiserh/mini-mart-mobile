import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { HomeHeader } from '@/components/home-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PlaceholderGlow } from '@/components/placeholder-glow';
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

type StoreDetails = {
  id: number;
  store_name: string;
  description?: string;
  logo?: string;
  cover_image?: string;
  location?: string;
  is_verified?: boolean;
};

export default function StoreCatalogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();

  const [store, setStore] = useState<StoreDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

  const borderColor = isDark ? '#333' : '#EAEAEA';
  const cardBg = isDark ? '#141414' : '#FFFFFF';

  useEffect(() => {
    if (id) {
      fetchStoreProducts();
    }
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
      let fetchedProducts = [];
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
          const newSet = new Set(prev);
          newSet.add(product.id);
          return newSet;
        });
        refreshCart();
        showToast(`${product.name} added to cart`, 'success');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStoreProducts();
  };

  return (
    <ThemedView style={styles.container}>
      <HomeHeader
        showSearch={false}
        showBack={true}
        title={store?.store_name || 'Store'}
        backHref="/stores"
      />

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
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color="#A0A0A0" />
          <ThemedText style={styles.errorTitle}>No Products Available</ThemedText>
          <ThemedText style={styles.errorSubtitle}>This store has not uploaded any products yet.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
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
  columnWrapper: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  productsListContent: {
    paddingVertical: 12,
  },
  productCard: {
    width: (width - 34) / 2,
    marginBottom: 12,
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
