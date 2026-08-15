import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HomeHeader } from '@/components/home-header';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/config/api';

export default function CheckoutScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { cartCount, cartItems, refreshCart } = useCart();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const params = useLocalSearchParams();
  const selectedItemsParam = params.selectedItems as string;
  const selectedIds: number[] = selectedItemsParam ? JSON.parse(selectedItemsParam) : [];

  const itemsToCheckout = selectedIds.length > 0 
    ? cartItems.filter((item: any) => selectedIds.includes(item.id))
    : cartItems;

  useFocusEffect(
    React.useCallback(() => {
      const fetchAddresses = async () => {
        if (!token) return;
        try {
          setLoadingAddresses(true);
          const res = await fetch(api.ENDPOINTS.SHIPPING_ADDRESSES, {
            headers: api.getHeaders(token),
          });
          const data = await res.json();
          if (res.ok) {
            setAddresses(data);
            const defaultAddr = data.find((a: any) => a.is_default);
            if (defaultAddr) {
              setSelectedAddress(defaultAddr.id);
            } else if (data.length > 0) {
              setSelectedAddress(data[0].id);
            }
          }
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
        } finally {
          setLoadingAddresses(false);
        }
      };
      fetchAddresses();
    }, [token])
  );

  const subtotal = itemsToCheckout.reduce((sum: number, item: any) => sum + (parseFloat(item.price || "0") * item.quantity), 0);
  const shipping = subtotal > 0 ? 5000 : 0;
  const total = subtotal + shipping;

  const cardBg = isDark ? Colors.dark.cardBg : Colors.light.cardBg;
  const borderColor = isDark ? Colors.dark.borderColor : Colors.light.borderColor;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a shipping address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(api.ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: api.getHeaders(token),
        body: JSON.stringify({
          shipping_address_id: selectedAddress,
          payment_method: 'transfer',
          cart_item_ids: itemsToCheckout.map((item: any) => item.id),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        refreshCart(); 
        if (data.checkout_url) {
          setPlacedOrderId(data.order.id);
          setPaymentUrl(data.checkout_url);
        } else {
          router.replace(`/(orders)/order-details?orderId=${data.order.id}`); 
        }
      } else {
        Alert.alert('Checkout Failed', data.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      Alert.alert('Error', 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentUrl && placedOrderId) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
        <Tabs.Screen options={{ 
          header: () => <HomeHeader showSearch={false} showBack={true} title="Complete Payment" backHref={`/(orders)/order-details?orderId=${placedOrderId}`} />
        }} />
        <WebView 
          source={{ uri: paymentUrl }} 
          style={{ flex: 1 }} 
          startInLoadingState={true}
          onNavigationStateChange={(navState: any) => {
            if (navState.url.startsWith('https://mini-mart.vetristech.com') || navState.url.startsWith('http://localhost:8000')) {
              router.replace(`/(orders)/order-details?orderId=${placedOrderId}`);
            }
          }}
          renderLoading={() => (
             <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#000' : '#fff' }}>
               <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].primary} />
             </View>
          )}
        />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Shipping Address</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(addresses)/addresses')}>
              <ThemedText style={[styles.editLink, { color: Colors[isDark ? 'dark' : 'light'].primary }]}>Manage</ThemedText>
            </TouchableOpacity>
          </View>

          {loadingAddresses ? (
             <ActivityIndicator color={Colors[isDark ? 'dark' : 'light'].primary} style={{ marginVertical: 20 }} />
          ) : addresses.length === 0 ? (
             <View style={[styles.card, { backgroundColor: cardBg, borderColor, alignItems: 'center', paddingVertical: 30 }]}>
                <Ionicons name="location-outline" size={32} color={isDark ? '#444' : '#CCC'} />
                <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>No addresses found</ThemedText>
                <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push('/(addresses)/add-address')}>
                  <ThemedText style={{ color: Colors[isDark ? 'dark' : 'light'].primary, fontWeight: 'bold' }}>Add Address</ThemedText>
                </TouchableOpacity>
             </View>
          ) : addresses.length === 1 ? (
             <View style={[styles.paymentOption, { backgroundColor: cardBg, borderColor: Colors[isDark ? 'dark' : 'light'].primary }]}>
                <Ionicons name="location" size={24} color={Colors[isDark ? 'dark' : 'light'].primary} />
                <View style={styles.addressDetails}>
                  <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Shipping Address</ThemedText>
                  <ThemedText style={{ opacity: 0.7, fontSize: 13 }}>{addresses[0].address_line_1}, {addresses[0].city}</ThemedText>
                </View>
             </View>
          ) : (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity 
                style={[styles.dropdownHeader, { backgroundColor: cardBg, borderColor: dropdownOpen ? Colors[isDark ? 'dark' : 'light'].primary : borderColor }]}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Ionicons name="location" size={24} color={Colors[isDark ? 'dark' : 'light'].primary} />
                <View style={styles.addressDetails}>
                  {(() => {
                    const selectedAddrObj = addresses.find(a => a.id === selectedAddress) || addresses[0];
                    return (
                      <>
                        <ThemedText style={{ fontWeight: 'bold', marginBottom: 2 }}>
                          Deliver to: {selectedAddrObj.address_line_1.substring(0, 30)}...
                        </ThemedText>
                        <ThemedText style={{ opacity: 0.7, fontSize: 12 }}>
                          {selectedAddrObj.city}, {selectedAddrObj.state}
                        </ThemedText>
                      </>
                    );
                  })()}
                </View>
                <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={[styles.dropdownList, { backgroundColor: cardBg, borderColor }]}>
                  {addresses.map((addr: any) => (
                    <TouchableOpacity
                      key={addr.id}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: borderColor },
                        selectedAddress === addr.id && { backgroundColor: isDark ? '#222' : '#F5F5F5' }
                      ]}
                      onPress={() => {
                        setSelectedAddress(addr.id);
                        setDropdownOpen(false);
                      }}
                    >
                      <Ionicons 
                        name={selectedAddress === addr.id ? "radio-button-on" : "radio-button-off"} 
                        size={18} 
                        color={selectedAddress === addr.id ? Colors[isDark ? 'dark' : 'light'].primary : '#999'} 
                      />
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontWeight: '600', fontSize: 13 }}>{addr.address_line_1}</ThemedText>
                        <ThemedText style={{ opacity: 0.6, fontSize: 12 }}>{addr.city}, {addr.state}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Order Items ({itemsToCheckout.length})</ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor, padding: 12, gap: 12 }]}>
            {itemsToCheckout.map((item: any) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.itemImagePlaceholder, { backgroundColor: isDark ? '#333' : '#E0E0E0', overflow: 'hidden' }]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                  ) : (
                    <Ionicons name="image-outline" size={20} color={isDark ? '#666' : '#999'} style={{ alignSelf: 'center', marginTop: 14 }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '500' }} numberOfLines={1}>{item.name}</ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Qty: {item.quantity}</ThemedText>
                </View>
                <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
                  ₦{(parseFloat(item.price || "0") * item.quantity).toLocaleString()}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor, padding: 16 }]}>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
              <ThemedText style={styles.summaryValue}>₦{subtotal.toLocaleString()}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Shipping</ThemedText>
              <ThemedText style={styles.summaryValue}>₦{shipping.toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 12, marginTop: 12, marginBottom: 0 }]}>
              <ThemedText style={[styles.summaryLabel, { fontWeight: 'bold', fontSize: 16 }]}>Total</ThemedText>
              <ThemedText style={[styles.summaryValue, { fontWeight: 'bold', fontSize: 18, color: Colors[isDark ? 'dark' : 'light'].primary }]}>₦{total.toLocaleString()}</ThemedText>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, { borderTopColor: borderColor, backgroundColor: isDark ? '#000' : '#fff' }]}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={isDark ? '#000' : '#FFF'} size="small" />
              <ThemedText style={[styles.placeOrderText, { color: isDark ? '#000' : '#FFF' }]}>Processing Payment...</ThemedText>
            </View>
          ) : (
            <ThemedText style={[styles.placeOrderText, { color: isDark ? '#000' : '#FFF' }]}>Place Order (₦{total.toLocaleString()})</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressDetails: {
    flex: 1,
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  placeOrderButton: {
    height: 44,
    width: '85%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  placeOrderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
