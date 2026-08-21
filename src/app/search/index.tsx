import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/config/api';

type Product = {
  id: number;
  name: string;
  price: string;
  category?: { name: string };
  image?: string;
};

export default function SearchScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchProducts(searchQuery);
      } else {
        setProducts([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchProducts = async (query: string) => {
    setLoading(true);
    try {
      // In a real app, you'd want an endpoint like /api/products?search=...
      // For now we fetch all products and filter locally for simplicity
      const response = await fetch(api.ENDPOINTS.PRODUCTS);
      const data = await response.json();
      if (response.ok && data.data) {
        const lowerQuery = query.toLowerCase();
        const filtered = data.data.filter((p: Product) => 
          p.name.toLowerCase().includes(lowerQuery) || 
          (p.category?.name && p.category.name.toLowerCase().includes(lowerQuery))
        );
        setProducts(filtered);
      }
    } catch (error) {
      console.error('Failed to search products', error);
    } finally {
      setLoading(false);
    }
  };

  const borderColor = isDark ? '#333' : '#EAEAEA';
  const inputBg = isDark ? '#141414' : '#F9F9F9';
  const cardBg = isDark ? '#1a1a1a' : '#f5f5f5';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: isDark ? '#222' : '#f0f0f0' }]}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <View style={[styles.searchContainer, { backgroundColor: inputBg, borderColor }]}>
            <Ionicons name="search-outline" size={20} color={isDark ? '#888' : '#666'} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]}
              placeholder="Search products..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
          </View>
        ) : searchQuery.trim().length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search" size={64} color={isDark ? '#333' : '#e0e0e0'} />
            <ThemedText style={styles.emptyText}>Type to start searching</ThemedText>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cube-outline" size={64} color={isDark ? '#333' : '#e0e0e0'} />
            <ThemedText style={styles.emptyText}>No products found for "{searchQuery}"</ThemedText>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.productItem, { backgroundColor: cardBg }]}
                onPress={() => router.push(`/product/${item.id}` as any)}
              >
                <View style={[styles.imageContainer, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} contentFit="contain" transition={200} />
                  ) : (
                    <Ionicons name="image-outline" size={24} color={isDark ? '#666' : '#999'} />
                  )}
                </View>
                <View style={styles.productDetails}>
                  <ThemedText style={styles.productName} numberOfLines={1}>{item.name}</ThemedText>
                  {item.category?.name ? <ThemedText style={styles.productCategory}>{item.category.name}</ThemedText> : null}
                  <ThemedText style={styles.productPrice}>₦{parseFloat(item.price).toLocaleString()}</ThemedText>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  productItem: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 13,
    opacity: 0.6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
});
