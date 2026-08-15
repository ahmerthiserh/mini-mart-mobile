import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PlaceholderGlow } from '@/components/placeholder-glow';
import api from '@/config/api';

type Category = {
  id: number;
  title: string;
};

export interface CategoriesListProps {
  activeCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  refreshTrigger?: number;
  loadingCategoryId?: number | null;
}

export function CategoriesList({ activeCategoryId, onSelectCategory, refreshTrigger, loadingCategoryId }: CategoriesListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(api.ENDPOINTS.CATEGORIES);
        const data = await response.json();
        if (response.ok) {
          // Prepend "All" category at the start
          setCategories([{ id: 0, title: 'All' }, ...data]);
        }
      } catch (error) {
        console.error('Failed to fetch categories list', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
        {[1, 2, 3, 4, 5].map((item) => (
          <PlaceholderGlow key={item} style={{ width: 70, height: 24, borderRadius: 12 }} borderRadius={12} />
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
      {categories.map((category) => {
        const isActive = category.id === 0 ? activeCategoryId === null : activeCategoryId === category.id;
        const isChipLoading = loadingCategoryId === category.id;
        return (
          <TouchableOpacity 
            key={category.id} 
            onPress={() => onSelectCategory(category.id === 0 ? null : category.id)}
            style={[
              styles.categoryChip, 
              isActive && (isDark ? styles.categoryChipActiveDark : styles.categoryChipActiveLight),
              { borderColor: isDark ? '#333' : '#e0e0e0' }
            ]}
          >
            {isChipLoading ? (
              <ActivityIndicator 
                size="small" 
                color={isActive ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')} 
                style={{ marginRight: 6 }}
              />
            ) : null}
            <ThemedText style={[
              styles.categoryText, 
              isActive && (isDark ? styles.categoryTextActiveDark : styles.categoryTextActiveLight)
            ]}>
              {category.title}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoriesContent: {
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryChipActiveLight: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryChipActiveDark: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  categoryTextActiveLight: {
    color: '#fff',
  },
  categoryTextActiveDark: {
    color: '#000',
  },
});
