import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/config/api";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function LoginScreen() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, token, isLoading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/");
    }
  }, [token, isLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Please enter both email and password.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(api.ENDPOINTS.LOGIN, {
        method: "POST",
        headers: api.getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.access_token, data.user);
        router.replace("/");
      } else {
        showToast(data.message || "Invalid credentials.", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast("Could not connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const borderColor = isDark ? "#333" : "#EAEAEA";
  const inputBg = isDark ? "#141414" : "#F9F9F9";

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.logoImage} 
              contentFit="contain" 
            />
            <ThemedText style={styles.subtitle}>
              Enter your details to sign in to your account
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email Address</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor,
                    backgroundColor: inputBg,
                    color: isDark ? "#FFF" : "#000",
                  },
                ]}
                placeholder="hello@example.com"
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View
                style={[
                  styles.passwordContainer,
                  { borderColor, backgroundColor: inputBg },
                ]}
              >
                <TextInput
                  style={[
                    styles.passwordInput,
                    { color: isDark ? "#FFF" : "#000" },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? "#666" : "#999"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={isDark ? "#666" : "#999"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <ThemedText
                style={[
                  styles.forgotPasswordText,
                  { color: Colors[isDark ? "dark" : "light"].primary },
                ]}
              >
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  backgroundColor: Colors[isDark ? "dark" : "light"].primary,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? "#000" : "#FFF"} />
              ) : (
                <ThemedText
                  style={[
                    styles.loginButtonText,
                    { color: isDark ? "#000" : "#FFF" },
                  ]}
                >
                  Sign In
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Don't have an account?{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <ThemedText
                style={[
                  styles.signupText,
                  { color: Colors[isDark ? "dark" : "light"].primary },
                ]}
              >
                Sign up
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 40,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  eyeButton: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loginButton: {
    height: 48,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  logoutText: {
    color: "#FF4747",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    opacity: 0.6,
  },
  signupText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
