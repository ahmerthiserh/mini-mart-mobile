import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import api from '@/config/api';

// MOCK_CARDS removed

export default function PaymentScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  
  const { token } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getBrandIcon = (brand: string) => {
    const b = brand.toLowerCase();
    if (b === 'visa') return 'cc-visa';
    if (b === 'mastercard') return 'cc-mastercard';
    if (b === 'amex') return 'cc-amex';
    if (b === 'discover') return 'cc-discover';
    return 'credit-card';
  };

  const fetchCards = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(api.ENDPOINTS.PAYMENT_METHODS, {
        headers: api.getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        setCards(data.map((c: any) => ({
          ...c,
          color: c.brand.toLowerCase() === 'visa' ? '#1A1F71' : '#FF5F00',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCards();
    }, [token])
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {isLoading ? (
          <ActivityIndicator color={isDark ? '#FFF' : '#000'} style={{ marginVertical: 40 }} />
        ) : cards.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="card-outline" size={48} color={isDark ? '#444' : '#CCC'} />
            <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>No saved cards</ThemedText>
          </View>
        ) : (
          cards.map((card) => (
          <TouchableOpacity 
            key={card.id} 
            style={[
              styles.paymentCard, 
              { backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1 }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBox, { backgroundColor: card.color + '15' }]}>
                  <FontAwesome5 name={getBrandIcon(card.brand)} size={20} color={card.color} />
                </View>
                <View>
                  <ThemedText style={styles.cardBrand}>{card.brand}</ThemedText>
                  <ThemedText style={styles.cardNumber}>•••• •••• •••• {card.last4}</ThemedText>
                </View>
              </View>
              {card.isDefault && (
                <View style={[styles.defaultBadge, { backgroundColor: isDark ? '#333' : '#EFEFEF' }]}>
                  <ThemedText style={styles.defaultText}>Default</ThemedText>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.cardFooter}>
              <View style={styles.expiryBox}>
                <ThemedText style={styles.expiryLabel}>Expires</ThemedText>
                <ThemedText style={styles.expiryValue}>{card.expiry}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => router.push({ pathname: '/(payment)/edit-payment', params: { id: card.id } })} style={styles.editButton}>
                <ThemedText style={[styles.editText, { color: isDark ? '#AAA' : '#666' }]}>Edit</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )))}

        <TouchableOpacity 
          onPress={() => router.push('/add-payment')}
          style={[
            styles.addButton, 
            { backgroundColor: isDark ? '#111' : '#F9F9F9', borderColor: borderColor, borderWidth: 1, borderStyle: 'dashed' }
          ]}
        >
          <View style={[styles.addIconBox, { backgroundColor: isDark ? '#FFF' : '#000' }]}>
            <Ionicons name="add" size={18} color={isDark ? '#000' : '#FFF'} />
          </View>
          <ThemedText style={styles.addButtonText}>Add New Payment Method</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  paymentCard: {
    borderRadius: 16,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '600',
    letterSpacing: 1,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryBox: {
    gap: 2,
  },
  expiryLabel: {
    fontSize: 10,
    opacity: 0.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  expiryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  addIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
