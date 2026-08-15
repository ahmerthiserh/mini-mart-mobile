import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/config/api';

export default function PersonalInfoScreen() {
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('Phone number cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${api.BASE_URL}/user`, {
        method: 'PUT',
        headers: api.getHeaders(token),
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        await updateUser(data.user);
        showToast('Profile updated successfully!', 'success');
        router.back();
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showToast('An error occurred. Check your network.', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.avatarSection}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
            <Ionicons name="person" size={48} color={isDark ? '#666' : '#999'} />
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={() => showToast('Avatar updates will be available in the next release.', 'info')}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="Full Name"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={name}
            onChangeText={setName}
            editable={!saving}
          />

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="Email"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            editable={!saving}
          />

          <ThemedText style={styles.label}>Phone Number</ThemedText>
          <TextInput 
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: borderColor, backgroundColor: isDark ? '#222' : '#F5F5F5' }]} 
            placeholder="Phone Number"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={phone}
            keyboardType="phone-pad"
            onChangeText={setPhone}
            editable={!saving}
          />

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: isDark ? '#FFF' : '#000' }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={isDark ? '#000' : '#FFF'} />
            ) : (
              <ThemedText style={[styles.saveText, { color: isDark ? '#000' : '#FFF' }]}>Save Changes</ThemedText>
            )}
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
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000', // high contrast
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF', 
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
