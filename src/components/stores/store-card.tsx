import React from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { PlaceholderGlow } from '@/components/placeholder-glow';

const { width } = Dimensions.get('window');

export type StoreItem = {
  id: number;
  store_name: string;
  store_slug: string;
  description?: string;
  logo?: string;
  cover_image?: string;
  is_verified?: boolean;
  location?: string;
  whatsapp_url?: string;
  business_type_id?: number;
  business_type_name?: string;
  seller_type_name?: string;
  seller_type_slug?: string;
  business_mode?: string;
};

interface StoreCardProps {
  store: StoreItem;
  onPress: (store: StoreItem) => void;
}

export function StoreCard({ store, onPress }: StoreCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? '#333' : '#EAEAEA';
  const cardBg = isDark ? '#141414' : '#FFFFFF';

  return (
    <TouchableOpacity 
      style={[styles.storeCard, { borderColor, backgroundColor: cardBg }]} 
      onPress={() => onPress(store)}
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
            <Ionicons name="checkmark-circle" size={12} color="#00C853" />
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
            <ThemedText style={{ fontSize: 16, fontWeight: '800' }}>
              {store.store_name ? store.store_name.charAt(0).toUpperCase() : 'S'}
            </ThemedText>
          )}
        </View>

        <View style={styles.storeInfoText}>
          <ThemedText style={styles.storeName} numberOfLines={1}>{store.store_name}</ThemedText>
          {store.business_type_name && (
            <View style={[styles.businessBadge, { backgroundColor: isDark ? '#222' : '#F2F2F7' }]}>
              <ThemedText style={styles.businessBadgeText} numberOfLines={1}>
                {store.business_type_name}
              </ThemedText>
            </View>
          )}
          {store.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color={isDark ? '#AAA' : '#666'} style={{ marginTop: 1 }} />
              <ThemedText style={styles.locationText} numberOfLines={2}>{store.location}</ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  storeCard: {
    width: (width - 34) / 2,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  coverContainer: {
    width: '100%',
    height: 70,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  storeBody: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 0,
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    marginTop: -20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storeInfoText: {
    width: '100%',
    paddingTop: 4,
    gap: 2,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  businessBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 1,
  },
  businessBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
  },
  locationText: {
    flex: 1,
    fontSize: 10,
    opacity: 0.6,
    lineHeight: 14,
  },
});
