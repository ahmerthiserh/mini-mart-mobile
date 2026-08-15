import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, useColorScheme, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import * as WebBrowser from 'expo-web-browser';

export default function SettingsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [promoEmails, setPromoEmails] = useState(true);

  const handleOpenPrivacyPolicy = async () => {
    await WebBrowser.openBrowserAsync('https://mini-mart.vetristech.com/privacy-policy');
  };

  const handleOpenDeleteAccount = async () => {
    await WebBrowser.openBrowserAsync('https://mini-mart.vetristech.com/account-deletion');
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <ThemedText style={styles.sectionHeader}>{title}</ThemedText>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <SectionHeader title="Notifications" />
        <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <View style={[styles.row, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
                <Ionicons name="notifications" size={18} color={isDark ? '#FFF' : '#000'} />
              </View>
              <ThemedText style={styles.rowText}>Push Notifications</ThemedText>
            </View>
            <Switch value={pushNotifs} onValueChange={setPushNotifs} trackColor={{ true: '#00C853' }} />
          </View>

          <View style={[styles.row, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
                <Ionicons name="mail" size={18} color={isDark ? '#FFF' : '#000'} />
              </View>
              <ThemedText style={styles.rowText}>Email Updates</ThemedText>
            </View>
            <Switch value={emailNotifs} onValueChange={setEmailNotifs} trackColor={{ true: '#00C853' }} />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
                <Ionicons name="pricetag" size={18} color={isDark ? '#FFF' : '#000'} />
              </View>
              <ThemedText style={styles.rowText}>Promotional Emails</ThemedText>
            </View>
            <Switch value={promoEmails} onValueChange={setPromoEmails} trackColor={{ true: '#00C853' }} />
          </View>
        </View>

        <SectionHeader title="Security & Legal" />
        <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={[styles.row, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
                <Ionicons name="lock-closed" size={18} color={isDark ? '#FFF' : '#000'} />
              </View>
              <ThemedText style={styles.rowText}>Change Password</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#666' : '#999'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenPrivacyPolicy} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
                <Ionicons name="document-text" size={18} color={isDark ? '#FFF' : '#000'} />
              </View>
              <ThemedText style={styles.rowText}>Privacy Policy</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#666' : '#999'} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="Account" />
        <View style={[styles.sectionContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TouchableOpacity onPress={() => router.push('/(settings)/personal-info')} style={[styles.row, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
                <Ionicons name="person" size={18} color={isDark ? '#FFF' : '#000'} />
              </View>
              <ThemedText style={styles.rowText}>Personal Information</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#666' : '#999'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenDeleteAccount} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FF474720' }]}>
                <Ionicons name="trash" size={18} color="#FF4747" />
              </View>
              <ThemedText style={[styles.rowText, { color: '#FF4747' }]}>Delete Account</ThemedText>
            </View>
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
    gap: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -12,
    paddingHorizontal: 8,
    opacity: 0.5,
  },
  sectionContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
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
  rowText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
