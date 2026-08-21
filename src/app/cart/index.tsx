import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/Colors';

type CartItemType = {
  id: number;
  product_id: number;
  name: string;
  price: string;
  quantity: number;
  category: string | null;
  image: string | null;
  preferred_colors?: string | null;
};

export default function CartScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { token, user } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const subtotal = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  const toggleSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const cardBg = isDark ? '#1A1A1A' : '#F8F9FA';
  const borderColor = isDark ? '#333' : '#e0e0e0';

  const fetchCart = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(api.ENDPOINTS.CART, {
        headers: api.getHeaders(token),
      });
      if (!response.ok) {
        setError('Server responded with an error');
        return;
      }
      const data = await response.json();
      setCartItems(data.items || []);
      if (data.items) {
        setSelectedItems(data.items.map((i: any) => i.id));
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
      setError('Connection failed. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [token])
  );

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      return removeItem(itemId);
    }

    setUpdating(itemId);
    try {
      const response = await fetch(`${api.ENDPOINTS.CART}/${itemId}`, {
        method: 'PUT',
        headers: api.getHeaders(token),
        body: JSON.stringify({ quantity: newQuantity }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.items || []);
        refreshCart();
        refreshCart();
        // showToast('Quantity updated', 'success'); // Optional, might be noisy
      } else {
        showToast(data.message || 'Failed to update quantity', 'error');
      }
    } catch (error) {
      console.error('Failed to update quantity', error);
      showToast('Network error', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      const response = await fetch(`${api.ENDPOINTS.CART}/${itemId}`, {
        method: 'DELETE',
        headers: api.getHeaders(token),
      });
      
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.items || []);
        refreshCart();
        refreshCart();
        showToast('Item removed', 'info');
      } else {
        showToast(data.message || 'Failed to remove item', 'error');
      }
    } catch (error) {
      console.error('Failed to remove item', error);
      showToast('Network error', 'error');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].text} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }]}>
        <Ionicons name="cloud-offline-outline" size={48} color="#FFA62B" />
        <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Connection Failed</ThemedText>
        <ThemedText style={{ fontSize: 13, opacity: 0.6, textAlign: 'center', lineHeight: 18, marginBottom: 12 }}>
          Unable to connect to the server at {api.BASE_URL.replace('/api', '')}. Please check your connection or server status.
        </ThemedText>
        <TouchableOpacity 
          style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, backgroundColor: Colors[isDark ? 'dark' : 'light'].primary }} 
          onPress={() => {
            setLoading(true);
            fetchCart();
          }}
        >
          <ThemedText style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#000' : '#fff' }}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>Your Cart ({cartItems.length})</ThemedText>
        </View>

        <View style={styles.cartList}>
          {cartItems.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.5 }}>
              <Ionicons name="cart-outline" size={48} color={Colors[isDark ? 'dark' : 'light'].text} />
              <ThemedText style={{ marginTop: 16 }}>Your cart is empty</ThemedText>
            </View>
          ) : (
            cartItems.map((item) => (
              <View key={item.id} style={[styles.cartItem, { backgroundColor: cardBg, opacity: updating === item.id ? 0.5 : 1 }]}>
                <TouchableOpacity 
                   onPress={() => toggleSelection(item.id)}
                   style={{ padding: 4 }}
                >
                   <Ionicons 
                      name={selectedItems.includes(item.id) ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={Colors[isDark ? 'dark' : 'light'].primary} 
                   />
                </TouchableOpacity>
                <View style={[styles.itemImagePlaceholder, { backgroundColor: isDark ? '#333' : '#E0E0E0', overflow: 'hidden' }]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                  ) : (
                    <Ionicons name="image-outline" size={24} color={isDark ? '#666' : '#999'} style={{ alignSelf: 'center', marginTop: 18 }} />
                  )}
                </View>
                
                <View style={styles.itemDetails}>
                  {item.category ? <ThemedText style={styles.itemCategory}>{item.category}</ThemedText> : null}
                  <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
                  {item.preferred_colors && (
                    <ThemedText style={styles.itemColor}>Color: {item.preferred_colors}</ThemedText>
                  )}
                  <ThemedText style={styles.itemPrice}>₦{parseFloat(item.price).toLocaleString()}</ThemedText>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 16 }}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={[styles.qtyButton, { borderColor, opacity: item.quantity <= 1 ? 0.5 : 1 }]} 
                      onPress={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}
                    >
                      <Ionicons name="remove" size={16} color={Colors[isDark ? 'dark' : 'light'].text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                    <TouchableOpacity 
                      style={[styles.qtyButton, { borderColor }]} 
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                    >
                      <Ionicons name="add" size={16} color={Colors[isDark ? 'dark' : 'light'].text} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => removeItem(item.id)} disabled={updating === item.id}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.summaryContainer}>
          <ThemedText type="subtitle" style={styles.summaryTitle}>Order Summary</ThemedText>
          
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>₦{subtotal.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Shipping</ThemedText>
            <ThemedText style={styles.summaryValue}>{subtotal > 0 ? '₦5,000' : '₦0'}</ThemedText>
          </View>
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: borderColor }]}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>₦{(subtotal > 0 ? subtotal + 5000 : 0).toLocaleString()}</ThemedText>
          </View>

          <TouchableOpacity 
            style={[styles.checkoutButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary, opacity: selectedItems.length === 0 ? 0.5 : 1 }]}
            disabled={selectedItems.length === 0}
            onPress={() => {
              if (!token) {
                Alert.alert("Login Required", "You need to log in to proceed to checkout.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Log In", onPress: () => router.push('/(auth)/login' as any) }
                ]);
              } else {
                router.push({ pathname: '/checkout', params: { selectedItems: JSON.stringify(selectedItems) } });
              }
            }}
          >
            <ThemedText style={[styles.checkoutButtonText, { color: Colors[isDark ? 'dark' : 'light'].background }]}>
              Proceed to Checkout
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
  },
  cartList: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 32,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  itemCategory: {
    fontSize: 11,
    opacity: 0.6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemColor: {
    fontSize: 12,
    opacity: 0.6,
    marginVertical: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 12,
    textAlign: 'center',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  checkoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
