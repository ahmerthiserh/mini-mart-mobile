import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/Colors';

export default function StoreProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [market, setMarket] = useState('');
  const [shopNumber, setShopNumber] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  // Image local URIs (null = not changed)
  const [newLogo, setNewLogo] = useState<string | null>(null);
  const [newCover, setNewCover] = useState<string | null>(null);

  const borderColor = isDark ? '#2A2A2A' : '#E8E8E8';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const inputBg = isDark ? '#1C1C1E' : '#F5F5F7';
  const primary = Colors[isDark ? 'dark' : 'light'].primary;

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    setLoading(true);
    try {
      const res = await fetch(api.ENDPOINTS.VENDOR.STORE, { headers: api.getHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setStore(data);
        setStoreName(data.store_name ?? '');
        setDescription(data.description ?? '');
        setPhone(data.phone_number ?? '');
        setWhatsapp(data.whatsapp_number ?? '');
        setMarket(data.market ?? '');
        setShopNumber(data.shop_number ?? '');
        setOpeningHours(data.opening_hours ?? '');
      }
    } catch {
      showToast('Failed to load store profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'logo' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === 'logo') setNewLogo(result.assets[0].uri);
      else setNewCover(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!storeName.trim()) {
      showToast('Store name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('store_name', storeName.trim());
      if (description) formData.append('description', description);
      if (phone) formData.append('phone_number', phone);
      if (whatsapp) formData.append('whatsapp_number', whatsapp);
      if (market) formData.append('market', market);
      if (shopNumber) formData.append('shop_number', shopNumber);
      if (openingHours) formData.append('opening_hours', openingHours);

      if (newLogo) {
        const filename = newLogo.split('/').pop() ?? 'logo.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        formData.append('logo', { uri: newLogo, name: filename, type: `image/${ext}` } as any);
      }
      if (newCover) {
        const filename = newCover.split('/').pop() ?? 'cover.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        formData.append('cover_image', { uri: newCover, name: filename, type: `image/${ext}` } as any);
      }

      const res = await fetch(api.ENDPOINTS.VENDOR.STORE, {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          Accept: 'application/json',
          // Do NOT set Content-Type — let the browser/native set it with boundary for multipart
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Store profile updated!', 'success');
        setStore(data.store ?? data);
        setNewLogo(null);
        setNewCover(null);
      } else {
        const msg = data?.message || data?.errors ? Object.values(data.errors ?? {})[0] : 'Update failed';
        showToast(String(msg), 'error');
      }
    } catch (e) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const logoUri = newLogo ?? store?.logo;
  const coverUri = newCover ?? store?.cover_image;

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* ── Cover image ── */}
          <TouchableOpacity style={styles.coverWrapper} onPress={() => pickImage('cover')} activeOpacity={0.85}>
            <View style={[styles.cover, { backgroundColor: isDark ? '#1A1A2E' : '#C7D2FE' }]}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={isDark ? '#555' : '#AAA'} />
                  <ThemedText style={styles.coverPlaceholderText}>Tap to add cover image</ThemedText>
                </View>
              )}
              {/* Edit badge */}
              <View style={styles.coverEditBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
                <ThemedText style={styles.coverEditText}>Edit Cover</ThemedText>
              </View>
            </View>

            {/* ── Logo ── */}
            <TouchableOpacity
              style={[styles.logoWrapper, { borderColor: isDark ? '#0A0A0A' : '#fff', backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8' }]}
              onPress={() => pickImage('logo')}
              activeOpacity={0.85}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <ThemedText style={styles.logoInitial}>
                  {storeName?.charAt(0)?.toUpperCase() ?? '?'}
                </ThemedText>
              )}
              <View style={styles.logoEditBadge}>
                <Ionicons name="camera" size={11} color="#fff" />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* ── Form fields ── */}
          <View style={styles.formSection}>
            <ThemedText style={styles.sectionLabel}>STORE DETAILS</ThemedText>

            <Field
              label="Store Name *"
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g. Tiger's Electronics"
              isDark={isDark}
              inputBg={inputBg}
              borderColor={borderColor}
            />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief about your store…"
              multiline
              isDark={isDark}
              inputBg={inputBg}
              borderColor={borderColor}
            />
          </View>

          <View style={styles.formSection}>
            <ThemedText style={styles.sectionLabel}>CONTACT</ThemedText>
            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+234..."
              keyboardType="phone-pad"
              isDark={isDark}
              inputBg={inputBg}
              borderColor={borderColor}
            />
            <Field
              label="WhatsApp Number"
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+234..."
              keyboardType="phone-pad"
              isDark={isDark}
              inputBg={inputBg}
              borderColor={borderColor}
            />
          </View>

          <View style={styles.formSection}>
            <ThemedText style={styles.sectionLabel}>LOCATION</ThemedText>
            <Field
              label="Market / Area"
              value={market}
              onChangeText={setMarket}
              placeholder="e.g. Computer Village"
              isDark={isDark}
              inputBg={inputBg}
              borderColor={borderColor}
            />
            <Field
              label="Shop Number"
              value={shopNumber}
              onChangeText={setShopNumber}
              placeholder="e.g. Shop 45B"
              isDark={isDark}
              inputBg={inputBg}
              borderColor={borderColor}
            />
            <Field
              label="Opening Hours"
              value={openingHours}
              onChangeText={setOpeningHours}
              placeholder="e.g. Mon–Sat 9am–6pm"
              isDark={isDark}
              inputBg={inputBg}
              borderColor={borderColor}
            />
          </View>

          {/* Store status info */}
          {store && (
            <View style={[styles.statusCard, { backgroundColor: cardBg, borderColor }]}>
              <StatusRow label="Status" value={store.is_verified ? 'Verified ✓' : 'Unverified'} valueColor={store.is_verified ? '#10B981' : '#F59E0B'} />
              <StatusRow label="Approval" value={store.approval_status ?? '—'} />
              <StatusRow label="Slots Used" value={`${store.used_slots ?? 0} / ${store.total_slots ?? 0}`} />
            </View>
          )}
          {/* ── Save button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, { opacity: saving ? 0.65 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </ThemedView>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType, isDark, inputBg, borderColor,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
  multiline?: boolean; keyboardType?: any; isDark: boolean; inputBg: string; borderColor: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <ThemedText style={fieldStyles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#555' : '#AAA'}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          { backgroundColor: inputBg, borderColor, color: isDark ? '#fff' : '#111' },
        ]}
      />
    </View>
  );
}

function StatusRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={statusStyles.row}>
      <ThemedText style={statusStyles.label}>{label}</ThemedText>
      <ThemedText style={[statusStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</ThemedText>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', opacity: 0.6, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});

const statusStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#33333330' },
  label: { fontSize: 13, opacity: 0.6 },
  value: { fontSize: 13, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Save button
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },

  // Cover
  coverWrapper: { position: 'relative', marginBottom: 48 },
  cover: { width: '100%', height: 160, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  coverPlaceholder: { alignItems: 'center', gap: 6 },
  coverPlaceholderText: { fontSize: 13, opacity: 0.5 },
  coverEditBadge: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  coverEditText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Logo
  logoWrapper: {
    position: 'absolute',
    bottom: -44,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: { fontSize: 30, fontWeight: '800' },
  logoEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form
  formSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },

  // Status card
  statusCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
});
