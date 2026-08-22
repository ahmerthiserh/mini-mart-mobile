import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import api from '@/config/api';
import { ActivityIndicator, Modal, FlatList } from 'react-native';

const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 
  'Taraba', 'Yobe', 'Zamfara'
];

export default function EditAddressScreen() {
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const { showAlert } = useAlert();
  
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStateModalVisible, setIsStateModalVisible] = useState(false);

  React.useEffect(() => {
    const fetchAddress = async () => {
      if (!token || !id) return;
      try {
        const res = await fetch(api.ENDPOINTS.SHIPPING_ADDRESSES, {
          headers: api.getHeaders(token),
        });
        const data = await res.json();
        if (res.ok) {
          const addr = data.find((a: any) => a.id.toString() === id.toString());
          if (addr) {
            setAddressLine1(addr.address_line_1);
            setAddressLine2(addr.address_line_2 || '');
            setCity(addr.city);
            setState(addr.state);
            setZip(addr.zip);
          }
        }
      } catch (err) {
        console.error('Error fetching address:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAddress();
  }, [id, token]);

  const handleUpdate = async () => {
    setError('');
    if (!token || !id || !addressLine1 || !city || !state || !zip) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(api.ENDPOINTS.SHIPPING_ADDRESS(id as string), {
        method: 'PUT',
        headers: api.getHeaders(token),
        body: JSON.stringify({
          address_line_1: addressLine1,
          address_line_2: addressLine2,
          city,
          state,
          zip,
        }),
      });

      if (response.ok) {
        showAlert({
          title: 'Success',
          message: 'Address updated successfully.',
          iconName: 'checkmark-circle-outline',
          iconColor: '#10B981',
          confirmText: 'OK',
          onConfirm: () => router.back(),
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update address');
      }
    } catch (err) {
      setError('Network error updating address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    showAlert({
      title: 'Delete Address',
      message: 'Are you sure you want to remove this address?',
      iconName: 'trash-outline',
      iconColor: '#EF4444',
      confirmText: 'Delete',
      confirmBtnColor: '#EF4444',
      cancelText: 'Cancel',
      onConfirm: async () => {
        if (!token || !id) return;
        setIsSubmitting(true);
        try {
          const response = await fetch(api.ENDPOINTS.SHIPPING_ADDRESS(id as string), {
            method: 'DELETE',
            headers: api.getHeaders(token),
          });
          if (response.ok) {
            router.back();
          } else {
            showAlert({ title: 'Error', message: 'Failed to delete address', iconName: 'alert-circle-outline', iconColor: '#EF4444' });
          }
        } catch (err) {
          showAlert({ title: 'Error', message: 'Network error', iconName: 'alert-circle-outline', iconColor: '#EF4444' });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };
  
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <ThemedText style={styles.label}>Address Line 1</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="Street address, P.O. box, etc."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={addressLine1}
            onChangeText={setAddressLine1}
          />

          <ThemedText style={styles.label}>Address Line 2 (Optional)</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="Apartment, suite, unit, etc."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={addressLine2}
            onChangeText={setAddressLine2}
          />
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <ThemedText style={styles.label}>State</ThemedText>
              <TouchableOpacity 
                style={[styles.input, { justifyContent: 'center', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]}
                onPress={() => setIsStateModalVisible(true)}
              >
                <ThemedText numberOfLines={1} style={{ color: state ? (isDark ? '#FFF' : '#000') : (isDark ? '#666' : '#999'), fontSize: 14 }}>
                  {state || "Select State"}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.flex1}>
              <ThemedText style={styles.label}>City</ThemedText>
              <TextInput 
                style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
                placeholder="Lagos"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <ThemedText style={styles.label}>Zip / Postal Code</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="100001"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={zip}
            keyboardType="number-pad"
            onChangeText={setZip}
          />
          
          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <TouchableOpacity style={[styles.saveButton, { opacity: isSubmitting ? 0.7 : 1 }]} onPress={handleUpdate} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.saveText}>Save Changes</ThemedText>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isSubmitting}>
            <ThemedText style={styles.deleteText}>Remove Address</ThemedText>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isStateModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsStateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select State</ThemedText>
                <TouchableOpacity onPress={() => setIsStateModalVisible(false)}>
                  <ThemedText style={styles.modalClose}>Close</ThemedText>
                </TouchableOpacity>
              </View>
              <FlatList
                data={NIGERIA_STATES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.stateItem, { borderBottomColor: borderColor }]}
                    onPress={() => {
                      setState(item);
                      setIsStateModalVisible(false);
                    }}
                  >
                    <ThemedText style={[styles.stateItemText, state === item && { color: '#4A90E2', fontWeight: 'bold' }]}>
                      {item}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

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
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E215',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  typeButtonTextActive: {
    color: '#4A90E2',
    opacity: 1,
  },
  errorText: {
    color: '#FF3D00',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  stateItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  stateItemText: {
    fontSize: 16,
  },
});
