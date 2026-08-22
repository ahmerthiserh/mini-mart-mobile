import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import api from '@/config/api';

export default function AddPaymentScreen() {
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  const router = useRouter();
  const { showSuccess } = useAlert();
  
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();
  
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    setExpiry(formatted);
  };
  
  const luhnCheck = (num: string) => {
    let sum = 0;
    let isSecond = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = parseInt(num[i], 10);
      if (isSecond) {
        d = d * 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      isSecond = !isSecond;
    }
    return sum % 10 === 0;
  };

  const handleSave = async () => {
    setError('');
    if (!token || !cardNumber || !expiry || !name) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setError('Expiry date must be in MM/YY format');
      return;
    }
    
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{16,19}$/.test(cleaned)) {
      setError('Card number must be between 16 and 19 digits');
      return;
    }
    
    if (!luhnCheck(cleaned)) {
      setError('Invalid card number');
      return;
    }

    setIsSubmitting(true);
    try {
      const brand = cleaned.startsWith('4') ? 'Visa' : 'Mastercard';
      const last4 = cleaned.slice(-4);
      
      const response = await fetch(api.ENDPOINTS.PAYMENT_METHODS, {
        method: 'POST',
        headers: api.getHeaders(token),
        body: JSON.stringify({
          card_number: cleaned,
          expiry,
          is_default: false,
        }),
      });

      if (response.ok) {
        setName('');
        setCardNumber('');
        setExpiry('');
        setError('');
        
        showSuccess(
          'Success',
          'Your payment method has been added securely.',
          () => router.replace('/(payment)/payment')
        );
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add payment method');
        console.error('Failed to add payment method:', errorData);
      }
    } catch (error) {
      setError('Network error adding payment method');
      console.error('Error adding payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={[styles.cardPreview, { backgroundColor: isDark ? '#222' : '#1A1F71' }]}>
          <View style={styles.cardPreviewHeader}>
            <Ionicons name="card" size={28} color="#FFF" />
            <Ionicons name="wifi" size={24} color="#FFF" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
          <ThemedText style={styles.previewNumber}>
            {cardNumber || '•••• •••• •••• ••••'}
          </ThemedText>
          <View style={styles.cardPreviewFooter}>
            <View>
              <ThemedText style={styles.previewLabel}>Cardholder</ThemedText>
              <ThemedText style={styles.previewValue}>{name || 'YOUR NAME'}</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.previewLabel}>Expires</ThemedText>
              <ThemedText style={styles.previewValue}>{expiry || 'MM/YY'}</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <ThemedText style={styles.label}>Cardholder Name</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="Ahmad Isah"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={name}
            onChangeText={setName}
          />

          <ThemedText style={styles.label}>Card Number</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={cardNumber}
            keyboardType="number-pad"
            maxLength={23}
            onChangeText={handleCardNumberChange}
          />
          
          <View style={styles.row}>
            <View style={styles.fullWidth}>
              <ThemedText style={styles.label}>Expiry Date</ThemedText>
              <TextInput 
                style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
                placeholder="MM/YY"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={expiry}
                keyboardType="number-pad"
                maxLength={5}
                onChangeText={handleExpiryChange}
              />
            </View>
          </View>
          
          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: isDark ? '#FFF' : '#000', opacity: isSubmitting ? 0.7 : 1 }]} onPress={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color={isDark ? '#000' : '#FFF'} /> : <ThemedText style={[styles.saveText, { color: isDark ? '#000' : '#FFF' }]}>Add Card</ThemedText>}
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
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  cardPreview: {
    padding: 24,
    borderRadius: 20,
    height: 200,
    justifyContent: 'space-between',
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewNumber: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 16,
  },
  cardPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewLabel: {
    color: '#FFF',
    fontSize: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fullWidth: {
    flex: 1,
  },
  errorText: {
    color: '#FF3D00',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
