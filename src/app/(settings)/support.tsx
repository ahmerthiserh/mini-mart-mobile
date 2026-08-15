import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import api from "@/config/api";

export default function SupportScreen() {
  const isDark = useColorScheme() === "dark";
  const cardBg = isDark ? "#141414" : "#FFFFFF";
  const borderColor = isDark ? "#2A2A2A" : "#EAEAEA";

  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [supportWhatsapp, setSupportWhatsapp] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(api.ENDPOINTS.SETTINGS, {
          headers: api.getHeaders(),
        });
        const data = await response.json();
        if (response.ok) {
          setSupportWhatsapp(data.support_whatsapp || null);
          setSupportEmail(data.support_email || null);
        }
      } catch (error) {
        console.error("Failed to load support settings", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const submitContactForm = async () => {
    if (!name || !email || !message) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (Name, Email, Message).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(api.ENDPOINTS.CONTACT, {
        method: "POST",
        headers: api.getHeaders(),
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your message has been sent successfully!");
        setSubject("");
        setMessage("");
      } else {
        Alert.alert("Error", data.message || "Failed to send message.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "A network error occurred while sending your message.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>

        <View style={styles.contactGrid}>
          {isLoadingSettings ? (
            <ActivityIndicator
              color="#4A90E2"
              style={{ flex: 1, marginVertical: 20 }}
            />
          ) : (
            <>
              {supportWhatsapp && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, "")}`,
                    )
                  }
                  style={[
                    styles.contactCard,
                    { backgroundColor: cardBg, borderColor: borderColor },
                  ]}
                >
                  <View
                    style={[styles.iconBox, { backgroundColor: "#25D36620" }]}
                  >
                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                  </View>
                  <ThemedText style={styles.contactTitle}>WhatsApp</ThemedText>
                  <ThemedText style={styles.contactDesc}>
                    {supportWhatsapp}
                  </ThemedText>
                </TouchableOpacity>
              )}

              {supportEmail && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
                  style={[
                    styles.contactCard,
                    { backgroundColor: cardBg, borderColor: borderColor },
                  ]}
                >
                  <View
                    style={[styles.iconBox, { backgroundColor: "#F5A62320" }]}
                  >
                    <Ionicons name="mail" size={24} color="#F5A623" />
                  </View>
                  <ThemedText style={styles.contactTitle}>Email Us</ThemedText>
                  <ThemedText style={styles.contactDesc}>
                    {supportEmail}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <ThemedText style={styles.sectionTitle}>Send us a Message</ThemedText>
        <View
          style={[
            styles.formContainer,
            { backgroundColor: cardBg, borderColor: borderColor },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { color: isDark ? "#FFF" : "#000", borderColor: borderColor },
            ]}
            placeholder="Your Name *"
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[
              styles.input,
              { color: isDark ? "#FFF" : "#000", borderColor: borderColor },
            ]}
            placeholder="Your Email *"
            placeholderTextColor={isDark ? "#666" : "#999"}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[
              styles.input,
              { color: isDark ? "#FFF" : "#000", borderColor: borderColor },
            ]}
            placeholder="Subject (Optional)"
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: isDark ? "#FFF" : "#000", borderColor: borderColor },
            ]}
            placeholder="How can we help you? *"
            placeholderTextColor={isDark ? "#666" : "#999"}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={submitContactForm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.submitBtnText}>Send Message</ThemedText>
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  contactGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  contactCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  contactDesc: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },

  formContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  submitBtn: {
    height: 48,
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
