import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/Colors";
import api from "@/config/api";

interface WhatsAppContact {
  title: string;
  phone: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const primaryColor = Colors[isDark ? "dark" : "light"].primary;

  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([]);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [whatsappChannelUrl, setWhatsappChannelUrl] = useState<string | null>(null);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.fetchWithTimeout(api.ENDPOINTS.SETTINGS, {
          headers: api.getHeaders(),
        });
        const data = await response.json();
        if (response.ok && data) {
          setSupportEmail(data.support_email || null);
          setWhatsappChannelUrl(data.whatsapp_channel_url || null);
          setWhatsappGroupUrl(data.whatsapp_group_url || null);

          // Parse multiple WhatsApp contacts if present
          let parsedContacts: WhatsAppContact[] = [];
          if (data.whatsapp_contacts) {
            try {
              const raw = typeof data.whatsapp_contacts === 'string' 
                ? JSON.parse(data.whatsapp_contacts) 
                : data.whatsapp_contacts;
              if (Array.isArray(raw)) {
                parsedContacts = raw;
              }
            } catch (e) {
              console.warn("Could not parse whatsapp_contacts json", e);
            }
          }

          if (parsedContacts.length === 0 && data.support_whatsapp) {
            parsedContacts = [{ title: "WhatsApp Support", phone: data.support_whatsapp }];
          }

          setWhatsappContacts(parsedContacts);
        }
      } catch (error) {
        console.error("Failed to load support settings", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const openLink = async (url: string, errorMsg: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      Alert.alert("Link Error", errorMsg);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* QUICK LINK TO FAQ & HELP CENTER */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.faqBanner,
            {
              backgroundColor: isDark ? "#0284C720" : "#E0F2FE",
              borderColor: "#0284C740",
            },
          ]}
          onPress={() => router.push("/(settings)/help")}
        >
          <View style={styles.faqBannerContent}>
            <Ionicons name="help-circle-outline" size={22} color="#0284C7" />
            <View style={styles.faqBannerText}>
              <ThemedText style={styles.faqBannerTitle}>Have Questions First?</ThemedText>
              <ThemedText style={styles.faqBannerSubtitle}>
                Browse our Help & FAQ section for instant answers
              </ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#0284C7" />
        </TouchableOpacity>

        <ThemedText style={styles.sectionTitle}>Customer Support Channels</ThemedText>

        {isLoadingSettings ? (
          <ActivityIndicator color={primaryColor} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.channelGrid}>
            {/* DYNAMIC WHATSAPP SUPPORT CONTACT LINES */}
            {whatsappContacts.map((contact, idx) => (
              <TouchableOpacity
                key={`wa-${idx}`}
                activeOpacity={0.8}
                style={[styles.channelCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() =>
                  openLink(
                    `https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}`,
                    "Could not launch WhatsApp."
                  )
                }
              >
                <View style={[styles.channelIconBox, { backgroundColor: "#25D36618" }]}>
                  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                </View>
                <View style={styles.channelTextContainer}>
                  <ThemedText style={styles.channelTitle}>{contact.title || "WhatsApp Support"}</ThemedText>
                  <ThemedText style={styles.channelDesc}>{contact.phone}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </TouchableOpacity>
            ))}

            {/* OFFICIAL EMAIL */}
            {supportEmail && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.channelCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => openLink(`mailto:${supportEmail}`, "Could not launch email client.")}
              >
                <View style={[styles.channelIconBox, { backgroundColor: "#0284C718" }]}>
                  <Ionicons name="mail" size={24} color="#0284C7" />
                </View>
                <View style={styles.channelTextContainer}>
                  <ThemedText style={styles.channelTitle}>Email Support</ThemedText>
                  <ThemedText style={styles.channelDesc}>{supportEmail}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}

            {/* WHATSAPP OFFICIAL CHANNEL */}
            {whatsappChannelUrl && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.channelCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => openLink(whatsappChannelUrl, "Could not open WhatsApp Channel link.")}
              >
                <View style={[styles.channelIconBox, { backgroundColor: "#16A34A18" }]}>
                  <Ionicons name="megaphone-outline" size={24} color="#16A34A" />
                </View>
                <View style={styles.channelTextContainer}>
                  <ThemedText style={styles.channelTitle}>Official WhatsApp Channel</ThemedText>
                  <ThemedText style={styles.channelDesc}>Get latest updates & deals</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}

            {/* WHATSAPP COMMUNITY / GROUP */}
            {whatsappGroupUrl && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.channelCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => openLink(whatsappGroupUrl, "Could not open WhatsApp Group link.")}
              >
                <View style={[styles.channelIconBox, { backgroundColor: "#9333EA18" }]}>
                  <Ionicons name="people-outline" size={24} color="#9333EA" />
                </View>
                <View style={styles.channelTextContainer}>
                  <ThemedText style={styles.channelTitle}>Community WhatsApp Group</ThemedText>
                  <ThemedText style={styles.channelDesc}>Connect with buyers & sellers</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
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
    gap: 16,
  },
  faqBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  faqBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  faqBannerText: {
    flex: 1,
    gap: 1,
  },
  faqBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0284C7",
  },
  faqBannerSubtitle: {
    fontSize: 11,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  channelGrid: {
    gap: 10,
    marginBottom: 8,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  channelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  channelTextContainer: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  channelDesc: {
    fontSize: 12,
    opacity: 0.6,
  },
});
