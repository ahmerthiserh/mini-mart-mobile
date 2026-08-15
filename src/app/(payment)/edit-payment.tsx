import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import api from '@/config/api';

export default function EditPaymentScreen() {
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  
  const [name, setName] = useState('Jane Doe');
  const [expiry, setExpiry] = useState('');
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    fetchCard();
  }, [id, token]);
  
  const fetchCard = async () => {
    if (!token || !id) return;
    try {
      setIsLoading(true);
      const res = await fetch(api.ENDPOINTS.PAYMENT_METHODS, {
        headers: api.getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        const found = data.find((c: any) => c.id.toString() === id.toString());
        if (found) {
          setCard(found);
          setExpiry(found.expiry);
          // Assuming cardholder name is not stored, but could be derived or just static for now
        }
      }
    } catch (error) {
      console.error('Failed to fetch card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !id) return;
    try {
      setIsSaving(true);
      const res = await fetch(api.ENDPOINTS.PAYMENT_METHOD(id as string), {
        method: 'PUT',
        headers: api.getHeaders(token),
        body: JSON.stringify({ expiry }),
      });
      if (res.ok) {
        router.back();
      }
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !id) return;
    try {
      setIsSaving(true);
      const res = await fetch(api.ENDPOINTS.PAYMENT_METHOD(id as string), {
        method: 'DELETE',
        headers: api.getHeaders(token),
      });
      if (res.ok) {
        router.back();
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {isLoading ? (
          <ActivityIndicator color={isDark ? '#FFF' : '#000'} style={{ marginVertical: 40 }} />
        ) : !card ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 40 }}>Card not found</ThemedText>
        ) : (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <View style={styles.header}>
              <View style={[styles.iconBox, { backgroundColor: card.brand.toLowerCase() === 'visa' ? '#1A1F7115' : '#FF5F0015' }]}>
                <Ionicons name="card" size={24} color={card.brand.toLowerCase() === 'visa' ? '#1A1F71' : '#FF5F00'} />
              </View>
              <View>
                <ThemedText style={styles.brandText}>{card.brand}</ThemedText>
                <ThemedText style={styles.cardInfo}>Ending in {card.last4}</ThemedText>
              </View>
            </View>
          
          <View style={styles.divider} />
          
          <ThemedText style={styles.label}>Cardholder Name</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            value={name}
            onChangeText={setName}
          />
          
          <ThemedText style={styles.label}>Expiry Date</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            value={expiry}
            onChangeText={setExpiry}
          />

          <TouchableOpacity style={[styles.saveButton, { opacity: isSaving ? 0.7 : 1 }]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.saveText}>Save Changes</ThemedText>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isSaving}>
            <ThemedText style={styles.deleteText}>Remove Card</ThemedText>
          </TouchableOpacity>
        </View>
        )}

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
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardInfo: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
    opacity: 0.2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#00C853',
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteText: {
    color: '#FF3D00',
    fontSize: 14,
    fontWeight: '600',
  },
});
