import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { login, token, isLoading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/");
    }
  }, [token, isLoading]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidPhone = phone.startsWith('0') && phone.length > 0 && phone.length <= 11;
  const isFormValid = 
    name.trim().length > 0 && 
    email.includes('@') && 
    isValidPhone && 
    password.length >= 6 && 
    password === passwordConfirmation;

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !passwordConfirmation) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    if (password !== passwordConfirmation) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(api.ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify({ 
          name, 
          email, 
          phone,
          password, 
          password_confirmation: passwordConfirmation 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Account created successfully!", "success");
        await login(data.access_token, data.user);
        router.replace('/');
      } else {
        showToast(data.message || "Please check your information.", "error");
      }
    } catch (error) {
      console.error('Register error:', error);
      showToast("Could not connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const borderColor = isDark ? '#333' : '#EAEAEA';
  const inputBg = isDark ? '#141414' : '#F9F9F9';

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>

          <View style={styles.header}>
            <ThemedText style={styles.title}>Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>Sign up to start shopping</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, backgroundColor: inputBg, color: isDark ? '#FFF' : '#000' }]}
                placeholder="Jane Doe"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email Address</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, backgroundColor: inputBg, color: isDark ? '#FFF' : '#000' }]}
                placeholder="hello@example.com"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Phone Number</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, backgroundColor: inputBg, color: isDark ? '#FFF' : '#000' }]}
                placeholder="+234 800 000 0000"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={[styles.passwordContainer, { borderColor, backgroundColor: inputBg }]}>
                <TextInput
                  style={[styles.passwordInput, { color: isDark ? '#FFF' : '#000' }]}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={isDark ? '#666' : '#999'} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <View style={[styles.passwordContainer, { borderColor, backgroundColor: inputBg }]}>
                <TextInput
                  style={[styles.passwordInput, { color: isDark ? '#FFF' : '#000' }]}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  secureTextEntry={!showPasswordConfirmation}
                />
                <TouchableOpacity onPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)} style={styles.eyeButton}>
                  <Ionicons name={showPasswordConfirmation ? "eye-off" : "eye"} size={20} color={isDark ? '#666' : '#999'} />
                </TouchableOpacity>
              </View>
              <ThemedText style={[styles.errorText, { opacity: (passwordConfirmation.length > 0 && password !== passwordConfirmation) ? 1 : 0 }]}>
                Passwords do not match
              </ThemedText>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary, opacity: (!isFormValid || loading) ? 0.5 : 1 }]} 
              onPress={handleRegister}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#FFF'} />
              ) : (
                <ThemedText style={[styles.loginButtonText, { color: isDark ? '#000' : '#FFF' }]}>Sign Up</ThemedText>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <ThemedText style={[styles.signupText, { color: Colors[isDark ? 'dark' : 'light'].primary }]}>Sign in</ThemedText>
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
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  eyeButton: {
    padding: 12,
  },
  loginButton: {
    height: 48,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    opacity: 0.6,
  },
  signupText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
