import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, useColorScheme, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatCartOrderWhatsAppMessage } from '@/utils/whatsapp';
import { CartItemType } from '@/components/cart/cart-item-row';
import { CartStoreCard, StoreGroup } from '@/components/cart/cart-store-card';
import { CartOrderSummary } from '@/components/cart/cart-order-summary';
import api from '@/config/api';

const BRAND_BLUE = '#0284C7';

export default function CartScreen() {
  const isDark = useColorScheme() === 'dark';
  const { token, user } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  const { showWarning, showError } = useAlert();

  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [sendingStoreKey, setSendingStoreKey] = useState<string | null>(null);
  const [settings, setSettings] = useState<{
    in_app_checkout_status?: string;
    whatsapp_order_status?: string;
  }>({});

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#EAEAEA';

  const subtotal = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  // --- API CALLS ---
  const fetchSettings = async () => {
    try {
      const response = await api.fetchWithTimeout(api.ENDPOINTS.SETTINGS, {
        headers: api.getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data || {});
      }
    } catch (e) {
      console.warn('Could not fetch app settings', e);
    }
  };

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
    } catch (err) {
      console.error('Failed to fetch cart', err);
      setError('Connection failed. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
      fetchSettings();
    }, [token])
  );

  // --- SELECTION HANDLERS ---
  const toggleSelection = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleStoreSelection = (storeItems: CartItemType[]) => {
    const storeItemIds = storeItems.map(i => i.id);
    const allSelected = storeItemIds.every(id => selectedItems.includes(id));
    if (allSelected) {
      setSelectedItems(prev => prev.filter(id => !storeItemIds.includes(id)));
    } else {
      setSelectedItems(prev => Array.from(new Set([...prev, ...storeItemIds])));
    }
  };

  // --- CART ITEM ACTIONS ---
  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      return removeItem(itemId);
    }

    setUpdatingId(itemId);
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
      } else {
        showToast(data.message || 'Failed to update quantity', 'error');
      }
    } catch (err) {
      console.error('Failed to update quantity', err);
      showToast('Network error', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setUpdatingId(itemId);
    try {
      const response = await fetch(`${api.ENDPOINTS.CART}/${itemId}`, {
        method: 'DELETE',
        headers: api.getHeaders(token),
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems(data.items || []);
        refreshCart();
        showToast('Item removed', 'info');
      } else {
        showToast(data.message || 'Failed to remove item', 'error');
      }
    } catch (err) {
      console.error('Failed to remove item', err);
      showToast('Network error', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // --- STORE GROUPING ---
  const storeGroups = cartItems.reduce<Record<string, StoreGroup>>((acc, item) => {
    const storeKey = item.store_name || 'Mini-Mart Official';
    if (!acc[storeKey]) {
      acc[storeKey] = {
        storeName: storeKey,
        storeWhatsapp: item.store_whatsapp || null,
        items: [],
      };
    }
    acc[storeKey].items.push(item);
    return acc;
  }, {});

  // --- WHATSAPP ORDER HANDLER ---
  const sendStoreCartToWhatsApp = async (group: StoreGroup) => {
    const selectedStoreItems = group.items.filter(item => selectedItems.includes(item.id));
    if (selectedStoreItems.length === 0) {
      showWarning('No Items Selected', `Please select at least one item from ${group.storeName} to order via WhatsApp.`);
      return;
    }

    const whatsappNum = group.storeWhatsapp || '';
    if (!whatsappNum) {
      showWarning('WhatsApp Unavailable', `${group.storeName} does not have a registered WhatsApp contact number.`);
      return;
    }

    const cleanNum = whatsappNum.replace(/[^0-9]/g, '');
    if (!cleanNum) {
      showWarning('WhatsApp Unavailable', `${group.storeName} has an invalid WhatsApp contact number.`);
      return;
    }

    setSendingStoreKey(group.storeName);
    try {
      const message = formatCartOrderWhatsAppMessage({
        storeName: group.storeName,
        items: selectedStoreItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customerName: user?.name,
      });

      const encodedMsg = encodeURIComponent(message);
      const url = `https://wa.me/${cleanNum}?text=${encodedMsg}`;

      await Linking.openURL(url);

      // Record WhatsApp order on backend for Admin Statistics & clear items from cart
      let recordSuccess = false;
      try {
        const res = await api.fetchWithTimeout(api.ENDPOINTS.RECORD_WHATSAPP_ORDER, {
          method: 'POST',
          headers: api.getHeaders(token),
          body: JSON.stringify({
            cart_item_ids: selectedStoreItems.map(i => i.id),
          }),
        });
        if (res.ok) {
          recordSuccess = true;
        } else {
          console.warn('Record WhatsApp Order API status:', res.status, await res.text());
        }
      } catch (e) {
        console.error('Failed to record WhatsApp order on backend', e);
      }

      // If record order API failed, manually delete items from server cart database
      if (!recordSuccess) {
        for (const item of selectedStoreItems) {
          try {
            await fetch(api.ENDPOINTS.REMOVE_CART_ITEM(item.id), {
              method: 'DELETE',
              headers: api.getHeaders(token),
            });
          } catch (err) {
            console.error('Failed to remove item from cart', err);
          }
        }
      }

      const removedIds = new Set(selectedStoreItems.map(i => i.id));
      setSelectedItems(prev => prev.filter(id => !removedIds.has(id)));
      setCartItems(prev => prev.filter(i => !removedIds.has(i.id)));
      refreshCart();
      showToast(`WhatsApp order recorded! Items from ${group.storeName} cleared.`, 'success');
    } catch (err) {
      showError('WhatsApp Error', 'Unable to open WhatsApp. Please check if WhatsApp is installed.');
    } finally {
      setSendingStoreKey(null);
    }
  };

  // --- RENDER STATES ---
  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={BRAND_BLUE} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centered, styles.errorContainer]}>
        <Ionicons name="cloud-offline-outline" size={48} color="#FFA62B" />
        <ThemedText style={styles.errorTitle}>Connection Failed</ThemedText>
        <ThemedText style={styles.errorText}>
          Unable to connect to the server at {api.BASE_URL.replace('/api', '')}. Please check your connection.
        </ThemedText>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            setLoading(true);
            fetchCart();
          }}
        >
          <ThemedText style={styles.retryText}>Try Again</ThemedText>
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
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={48} color={isDark ? '#FFF' : '#000'} />
              <ThemedText style={{ marginTop: 16 }}>Your cart is empty</ThemedText>
            </View>
          ) : (
            Object.values(storeGroups).map((group) => (
              <CartStoreCard
                key={group.storeName}
                group={group}
                selectedItems={selectedItems}
                isDark={isDark}
                cardBg={cardBg}
                borderColor={borderColor}
                brandBlue={BRAND_BLUE}
                updatingId={updatingId}
                sendingStoreKey={sendingStoreKey}
                whatsappOrderStatus={settings.whatsapp_order_status}
                onToggleStoreSelection={toggleStoreSelection}
                onToggleSelection={toggleSelection}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onSendStoreCartToWhatsApp={sendStoreCartToWhatsApp}
              />
            ))
          )}
        </View>

        {cartItems.length > 0 && (
          <CartOrderSummary
            subtotal={subtotal}
            selectedItemsCount={selectedItems.length}
            selectedItems={selectedItems}
            isDark={isDark}
            borderColor={borderColor}
            brandBlue={BRAND_BLUE}
            inAppCheckoutStatus={settings.in_app_checkout_status}
            token={token}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700',
  },
  cartList: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    opacity: 0.5,
  },
  errorContainer: {
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: BRAND_BLUE,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
