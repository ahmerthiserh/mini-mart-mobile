import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, useColorScheme, Dimensions, ActivityIndicator } from 'react-native';
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

type Category = {
  id: number;
  title: string;
  icon?: string;
  image?: string;
};

type Product = {
  id: number;
  name: string;
  price: string;
  category?: { name: string };
  image?: string;
};

export default function CategoriesScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const response = await fetch(api.ENDPOINTS.CATEGORIES);
      if (!response.ok) {
        setCategoriesError('Server error');
        return;
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      setCategoriesError('Connection failed. Please check if the server is running.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCategoryProducts = async (categoryId: number) => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const response = await fetch(api.ENDPOINTS.CATEGORY_PRODUCTS(categoryId));
      if (!response.ok) {
        setProductsError('Server error');
        return;
      }
      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch category products', error);
      setProductsError('Connection failed. Please check if the server is running.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    setActiveCategory(category);
    fetchCategoryProducts(category.id);
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

  const borderColor = isDark ? '#333' : '#EAEAEA';
  const cardBg = isDark ? '#141414' : '#FFFFFF';

  if (activeCategory === null) {
    return (
      <ThemedView style={styles.container}>
        {loadingCategories ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].text} />
          </View>
        ) : categoriesError ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>
            <Ionicons name="cloud-offline-outline" size={48} color="#FFA62B" />
            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Connection Failed</ThemedText>
            <ThemedText style={{ fontSize: 13, opacity: 0.6, textAlign: 'center', lineHeight: 18, marginBottom: 12 }}>
              Unable to connect to the server at {api.BASE_URL.replace('/api', '')}. Please check your connection or server status.
            </ThemedText>
            <TouchableOpacity 
              style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }} 
              onPress={fetchCategories}
            >
              <ThemedText style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#000' : '#fff' }}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoriesGridContent}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.mainCategoryCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]} 
                onPress={() => handleCategoryPress(cat)}
              >
                <View style={[styles.mainCategoryIcon, { backgroundColor: isDark ? '#333' : '#e0e0e0', overflow: 'hidden' }]}>
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                  ) : (
                    <ThemedText style={{ fontSize: 18, fontWeight: '800' }}>
                      {cat.title.substring(0, 1).toUpperCase()}
                    </ThemedText>
                  )}
                </View>
                <ThemedText style={styles.mainCategoryTitle} numberOfLines={2}>{cat.title}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.activeCategoryHeader}>
        <TouchableOpacity onPress={() => setActiveCategory(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors[isDark ? 'dark' : 'light'].text} />
        </TouchableOpacity>
        <ThemedText style={styles.activeCategoryTitle}>{activeCategory.title}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loadingProducts ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].text} />
          </View>
        ) : productsError ? (
          <View style={{ paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center', gap: 12 }}>
            <Ionicons name="cloud-offline-outline" size={48} color="#FFA62B" />
            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Connection Failed</ThemedText>
            <ThemedText style={{ fontSize: 13, opacity: 0.6, textAlign: 'center', lineHeight: 18, marginBottom: 12 }}>
              Unable to fetch products in {activeCategory.title}. Please check your connection or server status.
            </ThemedText>
            <TouchableOpacity 
              style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }} 
              onPress={() => fetchCategoryProducts(activeCategory.id)}
            >
              <ThemedText style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#000' : '#fff' }}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={isDark ? '#444' : '#CCC'} />
            <ThemedText style={styles.emptyStateText}>No products found in {activeCategory.title}</ThemedText>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {products.map((product) => (
              <TouchableOpacity 
                key={product.id} 
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
                  <ThemedText style={styles.productCategory}>{product.category?.name || activeCategory.title}</ThemedText>
                  <ThemedText type="default" style={styles.productName} numberOfLines={1}>{product.name}</ThemedText>
                  <View style={styles.productFooter}>
                    <ThemedText style={styles.productPrice}>₦{parseFloat(product.price).toLocaleString()}</ThemedText>
                    <TouchableOpacity 
                      style={[styles.addButton, { backgroundColor: addedToCart.has(product.id) ? 'Colors.light.success' : (Colors[isDark ? 'dark' : 'light'].primary) }]}
                      onPress={() => handleAddToCart(product)}
                    >
                      {addedToCart.has(product.id) ? (
                        <Ionicons name="cart" size={16} color="#fff" />
                      ) : (
                        <Ionicons name="add" size={18} color={Colors[isDark ? 'dark' : 'light'].background} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const NUM_COLUMNS = 4;
const GRID_PADDING = 12;
const GRID_GAP = 8;
const ITEM_WIDTH = Math.floor((width - (GRID_PADDING * 2) - (GRID_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoriesGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 16,
    gap: GRID_GAP,
  },
  mainCategoryCard: {
    width: ITEM_WIDTH,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    gap: 8,
  },
  mainCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCategoryTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  activeCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  activeCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: '500',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 11,
  },
  productCard: {
    width: (width - 50) / 2,
    marginBottom: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 12,
  },
  productInfo: {
    gap: 4,
  },
  productCategory: {
    fontSize: 11,
    opacity: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    fontWeight: '800',
    fontSize: 15,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
