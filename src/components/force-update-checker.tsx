import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import api from '@/config/api';

const isUpdateRequired = (current: string, minimum: string): boolean => {
  if (!current || !minimum) return false;
  const currentParts = current.split('.').map(Number);
  const minParts = minimum.split('.').map(Number);
  for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
    const c = currentParts[i] || 0;
    const m = minParts[i] || 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false;
};

export function ForceUpdateChecker() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch(api.ENDPOINTS.SETTINGS, {
          headers: api.getHeaders(),
        });
        if (response.ok) {
          const settings = await response.json();
          const minVersion = settings.minimum_app_version;
          const currentVersion = Constants.expoConfig?.version || '1.0.0';

          if (minVersion && isUpdateRequired(currentVersion, minVersion)) {
            setShowUpdateModal(true);
          }
        }
      } catch (e) {
        console.error('Failed to check app version:', e);
      }
    };

    checkVersion();
  }, []);

  const handleUpdate = () => {
    const playStoreId = Constants.expoConfig?.android?.package || 'minimart.vetristech.com';
    Linking.openURL(`market://details?id=${playStoreId}`);
  };

  return (
    <Modal visible={showUpdateModal} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            A new version of Mini-Mart is available. Please update the app from the Play Store to continue using it.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
