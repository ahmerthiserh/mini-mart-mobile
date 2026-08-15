import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import api from '@/config/api';

export default function AddressesScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleDeleteAddress = async (addressId: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this shipping address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(api.ENDPOINTS.SHIPPING_ADDRESS(addressId), {
                method: 'DELETE',
                headers: api.getHeaders(token),
              });
              if (res.ok) {
                fetchAddresses();
              } else {
                Alert.alert('Error', 'Failed to delete address.');
              }
            } catch (error) {
              console.error('Failed to delete address:', error);
            }
          }
        }
      ]
    );
  };

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(api.ENDPOINTS.SHIPPING_ADDRESSES, {
        headers: api.getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();
    }, [token])
  );
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {isLoading ? (
          <ActivityIndicator color={isDark ? '#FFF' : '#000'} style={{ marginVertical: 40 }} />
        ) : addresses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="location-outline" size={48} color={isDark ? '#444' : '#CCC'} />
            <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>No saved addresses</ThemedText>
          </View>
        ) : (
          addresses.map((addr) => (
          <TouchableOpacity 
            key={addr.id} 
            style={[
              styles.addressCard, 
              { backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1 }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
                  <Ionicons 
                    name="location" 
                    size={18} 
                    color={isDark ? '#FFF' : '#000'} 
                  />
                </View>
                <ThemedText style={styles.cardType}>Shipping Address</ThemedText>
              </View>
              {addr.isDefault && (
                <View style={[styles.defaultBadge, { backgroundColor: isDark ? '#333' : '#EFEFEF' }]}>
                  <ThemedText style={styles.defaultText}>Default</ThemedText>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.addressBody}>
              <ThemedText style={styles.addressText}>{addr.addressLine1}</ThemedText>
              {addr.addressLine2 ? <ThemedText style={styles.addressText}>{addr.addressLine2}</ThemedText> : null}
              <ThemedText style={styles.addressText}>{addr.city}, {addr.state} {addr.zip}</ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.cardFooter}>
              <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                <ThemedText style={styles.deleteText}>Delete</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push({ pathname: '/(addresses)/edit-address', params: { id: addr.id } })} style={styles.editButton}>
                <ThemedText style={[styles.editText, { color: isDark ? '#AAA' : '#666' }]}>Edit</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )))}

        <TouchableOpacity 
          onPress={() => router.push('/add-address')}
          style={[
            styles.addButton, 
            { backgroundColor: isDark ? '#111' : '#F9F9F9', borderColor: borderColor, borderWidth: 1, borderStyle: 'dashed' }
          ]}
        >
          <View style={[styles.addIconBox, { backgroundColor: isDark ? '#FFF' : '#000' }]}>
            <Ionicons name="add" size={18} color={isDark ? '#000' : '#FFF'} />
          </View>
          <ThemedText style={styles.addButtonText}>Add New Address</ThemedText>
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
  addressCard: {
    borderRadius: 16,
    padding: 12,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardType: {
    fontSize: 14,
    fontWeight: '700',
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
    marginVertical: 8,
  },
  addressBody: {
    gap: 2,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    opacity: 0.6,
    lineHeight: 16,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
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
