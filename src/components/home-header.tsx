import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface HomeHeaderProps {
  showSearch?: boolean;
  showBack?: boolean;
  title?: string;
  backHref?: string;
}

export function HomeHeader({ showSearch = true, showBack = false, title, backHref }: HomeHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
      <View style={styles.header}>
        {showBack && (
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else if (backHref) {
                router.push(backHref as any);
              } else {
                router.push('/');
              }
            }} 
            style={[styles.iconButton, { backgroundColor: isDark ? '#222' : '#f0f0f0' }]}
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        )}

        {showSearch ? (
          <TouchableOpacity 
            style={[styles.searchBar, { backgroundColor: isDark ? '#222' : '#f0f0f0' }]}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search-outline" size={20} color={isDark ? '#888' : '#666'} />
            <ThemedText style={styles.searchText}>Search products...</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.titleContainer}>
            {title && <ThemedText style={styles.headerTitle}>{title}</ThemedText>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchText: {
    fontSize: 14,
    opacity: 0.6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4747',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});
