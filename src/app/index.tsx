import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { CategoriesList } from '@/components/categories-list';
import { ProductList, ProductListRef } from '@/components/product-list';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const productListRef = useRef<ProductListRef>(null);

  const handleSelectCategory = (id: number | null) => {
    setActiveCategoryId(id);
    setIsCategoryLoading(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    if (productListRef.current) {
      await productListRef.current.refresh();
    }
    setRefreshing(false);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ProductList 
        ref={productListRef} 
        categoryId={activeCategoryId} 
        onLoadingStateChange={setIsCategoryLoading}
        onErrorRetry={() => setRefreshTrigger(prev => prev + 1)}
        ListHeaderComponent={
          <View style={styles.categoriesHeader}>
            <CategoriesList 
              activeCategoryId={activeCategoryId} 
              onSelectCategory={handleSelectCategory} 
              loadingCategoryId={isCategoryLoading ? (activeCategoryId ?? 0) : null}
              refreshTrigger={refreshTrigger}
            />
          </View>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoriesHeader: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
});
