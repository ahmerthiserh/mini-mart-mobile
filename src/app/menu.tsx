import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Appearance,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";

const MENU_ITEMS = [
  {
    id: "1",
    title: "My Orders",
    icon: "cube-outline",
    route: "/(orders)/orders",
    authRequired: true,
  },
  {
    id: "3",
    title: "Payment Methods",
    icon: "card-outline",
    route: "/(payment)/payment",
    authRequired: true,
  },
  {
    id: "4",
    title: "Shipping Addresses",
    icon: "location-outline",
    route: "/(addresses)/addresses",
    authRequired: true,
  },
  {
    id: "5",
    title: "Settings",
    icon: "settings-outline",
    route: "/(settings)/settings",
    authRequired: true,
  },
  {
    id: "6",
    title: "Help",
    icon: "information-circle-outline",
    route: "/(settings)/help",
    authRequired: false,
  },
  {
    id: "7",
    title: "Support",
    icon: "headset-outline",
    route: "/(settings)/support",
    authRequired: false,
  },
];

export default function MenuScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const cardBg = isDark ? "#1A1A1A" : "#F8F9FA";
  const borderColor = isDark ? "#333" : "#e0e0e0";

  const { user, token, logout } = useAuth();
  const isLoggedIn = !!token;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  const handleMenuItemPress = async (item: typeof MENU_ITEMS[0]) => {
    router.push(item.route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.profileSection,
            { borderColor, backgroundColor: cardBg },
          ]}
        >
          <View
            style={[
              styles.avatarPlaceholder,
              {
                backgroundColor: isDark ? "#222" : "#F0F4F8",
                borderColor: isDark ? "#333" : "#E6F4FE",
              },
            ]}
          >
            {isLoggedIn && user ? (
              <ThemedText
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: isDark ? "#FFF" : "#4A90E2",
                }}
              >
                {getInitials(user.name)}
              </ThemedText>
            ) : (
              <Ionicons
                name="person"
                size={28}
                color={isDark ? "#666" : "#999"}
              />
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="subtitle" style={styles.profileName}>
              {isLoggedIn && user ? user.name : "Guest User"}
            </ThemedText>
            <ThemedText style={styles.profileEmail}>
              {isLoggedIn && user ? user.email : "Sign in to view your profile"}
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() =>
              isLoggedIn
                ? router.push("/(settings)/personal-info")
                : router.push("/(auth)/login")
            }
            style={[
              styles.editButton,
              { backgroundColor: Colors[isDark ? "dark" : "light"].primary },
            ]}
          >
            <Ionicons
              name={isLoggedIn ? "pencil" : "log-in"}
              size={16}
              color={isDark ? "#000" : "#FFF"}
            />
          </TouchableOpacity>
        </View>

        <ThemedText
          style={[styles.sectionTitle, { color: isDark ? "#888" : "#666" }]}
        >
          Account
        </ThemedText>
        <View style={styles.menuList}>
          {MENU_ITEMS.filter((item) => !item.authRequired || isLoggedIn).map(
            (item, index, filteredArray) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuItemPress(item)}
                style={[
                  styles.menuItem,
                  { borderBottomColor: borderColor },
                  index === filteredArray.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: cardBg }]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={Colors[isDark ? "dark" : "light"].text}
                  />
                </View>
                <ThemedText style={styles.menuItemTitle}>
                  {item.title}
                </ThemedText>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#666" : "#999"}
                />
              </TouchableOpacity>
            ),
          )}
        </View>

        <ThemedText
          style={[styles.sectionTitle, { color: isDark ? "#888" : "#666" }]}
        >
          Preferences
        </ThemedText>
        <View style={styles.menuList}>
          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconContainer, { backgroundColor: cardBg }]}>
              <Ionicons
                name={isDark ? "moon-outline" : "sunny-outline"}
                size={20}
                color={Colors[isDark ? "dark" : "light"].text}
              />
            </View>
            <ThemedText style={styles.menuItemTitle}>Dark Mode</ThemedText>
            <Switch
              value={isDark}
              onValueChange={(val) =>
                Appearance.setColorScheme(val ? "dark" : "light")
              }
              trackColor={{ false: "#767577", true: "#00C853" }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        {!isLoggedIn ? (
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={[
              styles.logoutButton,
              { backgroundColor: isDark ? "#4A90E220" : "#4A90E210" },
            ]}
          >
            <Ionicons name="log-in-outline" size={18} color="#4A90E2" />
            <ThemedText style={[styles.logoutText, { color: "#4A90E2" }]}>
              Log In / Register
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              { backgroundColor: isDark ? "#FF474720" : "#FF474710" },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#FF4747" />
            <ThemedText style={styles.logoutText}>Log Out</ThemedText>
          </TouchableOpacity>
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
    paddingBottom: 40,
    paddingTop: 8,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 28,
    gap: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 13,
    opacity: 0.6,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 1,
  },
  menuList: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    gap: 6,
  },
  logoutText: {
    color: "#FF4747",
    fontSize: 14,
    fontWeight: "600",
  },
});
