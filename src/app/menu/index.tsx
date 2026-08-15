import React from "react";
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
import { useToast } from "@/context/ToastContext";
import { Colors } from "@/constants/Colors";

const MENU_ITEMS = [
  {
    id: "1",
    title: "My Orders",
    subtitle: "Track, manage and view history",
    icon: "cube-outline",
    route: "/(orders)/orders",
    authRequired: true,
  },
  {
    id: "3",
    title: "Payment Methods",
    subtitle: "Saved cards & payment options",
    icon: "card-outline",
    route: "/(payment)/payment",
    authRequired: true,
  },
  {
    id: "4",
    title: "Shipping Addresses",
    subtitle: "Manage delivery destinations",
    icon: "location-outline",
    route: "/(addresses)/addresses",
    authRequired: true,
  },
  {
    id: "5",
    title: "Settings & Profile",
    subtitle: "Account details & security",
    icon: "settings-outline",
    route: "/(settings)/settings",
    authRequired: true,
  },
  {
    id: "6",
    title: "Help Center",
    subtitle: "FAQs & shopping guides",
    icon: "information-circle-outline",
    route: "/(settings)/help",
    authRequired: false,
  },
  {
    id: "7",
    title: "Customer Support",
    subtitle: "Talk to our 24/7 care team",
    icon: "headset-outline",
    route: "/(settings)/support",
    authRequired: false,
  },
];

export default function MenuScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { showToast } = useToast();

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const primaryColor = Colors[isDark ? "dark" : "light"].primary;

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
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            showToast("Successfully logged out", "info");
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleMenuItemPress = (item: (typeof MENU_ITEMS)[0]) => {
    if (item.authRequired && !isLoggedIn) {
      Alert.alert(
        "Sign In Required",
        `Please log in or register to access ${item.title.toLowerCase()}.`,
        [
          { text: "Later", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => router.push("/(auth)/login"),
          },
        ]
      );
      return;
    }
    router.push(item.route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* GUEST HEADER / USER PROFILE HEADER */}
        {!isLoggedIn ? (
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
                  backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                  borderColor: isDark ? "#3A3A3C" : "#E5E5EA",
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={isDark ? "#8E8E93" : "#8E8E93"}
              />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle" style={styles.profileName}>
                Guest User
              </ThemedText>
              <ThemedText style={styles.profileEmail} numberOfLines={1}>
                Sign in for orders & account
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={[styles.smallSignInBtn, { backgroundColor: primaryColor }]}
            >
              <Ionicons name="log-in-outline" size={15} color="#FFF" />
              <ThemedText style={styles.smallSignInText}>Sign In</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          /* LOGGED IN USER CARD */
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
                  backgroundColor: primaryColor + "20",
                  borderColor: primaryColor + "40",
                },
              ]}
            >
              <ThemedText
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: primaryColor,
                }}
              >
                {user ? getInitials(user.name) : "U"}
              </ThemedText>
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle" style={styles.profileName}>
                {user?.name || "Account"}
              </ThemedText>
              <ThemedText style={styles.profileEmail}>
                {user?.email || "Signed in"}
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(settings)/personal-info")}
              style={[styles.editButton, { backgroundColor: primaryColor }]}
            >
              <Ionicons name="pencil" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* QUICK DISCOVERY SECTION FOR GUESTS */}
        {!isLoggedIn && (
          <>
            <ThemedText
              style={[styles.sectionTitle, { color: isDark ? "#8E8E93" : "#6C6C70" }]}
            >
              Explore Mini Mart
            </ThemedText>

            <View style={styles.quickDiscoveryGrid}>
              <TouchableOpacity
                style={[
                  styles.discoveryCard,
                  { backgroundColor: cardBg, borderColor },
                ]}
                onPress={() => router.push("/stores")}
              >
                <View style={[styles.discoveryIconBg, { backgroundColor: "#EBF5FF" }]}>
                  <Ionicons name="storefront-outline" size={22} color="#007AFF" />
                </View>
                <ThemedText style={styles.discoveryTitle}>Stores Directory</ThemedText>
                <ThemedText style={styles.discoverySub}>Find top local merchants</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.discoveryCard,
                  { backgroundColor: cardBg, borderColor },
                ]}
                onPress={() => router.push("/categories")}
              >
                <View style={[styles.discoveryIconBg, { backgroundColor: "#FFF0F5" }]}>
                  <Ionicons name="grid-outline" size={22} color="#FF2D55" />
                </View>
                <ThemedText style={styles.discoveryTitle}>All Categories</ThemedText>
                <ThemedText style={styles.discoverySub}>Browse textiles & products</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ACCOUNT / SERVICES MENU */}
        <ThemedText
          style={[styles.sectionTitle, { color: isDark ? "#8E8E93" : "#6C6C70" }]}
        >
          {isLoggedIn ? "Account Services" : "Menu & Features"}
        </ThemedText>

        <View style={[styles.menuList, { backgroundColor: cardBg, borderColor }]}>
          {MENU_ITEMS.map((item, index) => {
            const isLocked = item.authRequired && !isLoggedIn;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuItemPress(item)}
                style={[
                  styles.menuItem,
                  index < MENU_ITEMS.length - 1 && { borderBottomColor: borderColor },
                  index === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={isLocked ? "#8E8E93" : primaryColor}
                  />
                </View>

                <View style={styles.menuItemTextContainer}>
                  <ThemedText
                    style={[
                      styles.menuItemTitle,
                      isLocked && { opacity: 0.7 },
                    ]}
                  >
                    {item.title}
                  </ThemedText>
                  {item.subtitle && (
                    <ThemedText style={styles.menuItemSub}>
                      {item.subtitle}
                    </ThemedText>
                  )}
                </View>

                {isLocked ? (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={14} color="#8E8E93" />
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isDark ? "#6C6C70" : "#C7C7CC"}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PREFERENCES */}
        <ThemedText
          style={[styles.sectionTitle, { color: isDark ? "#8E8E93" : "#6C6C70" }]}
        >
          App Preferences
        </ThemedText>

        <View style={[styles.menuList, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
              ]}
            >
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={20}
                color={isDark ? "#FFD60A" : "#FF9500"}
              />
            </View>
            <View style={styles.menuItemTextContainer}>
              <ThemedText style={styles.menuItemTitle}>Dark Theme</ThemedText>
              <ThemedText style={styles.menuItemSub}>
                {isDark ? "Dark theme active" : "Light theme active"}
              </ThemedText>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) =>
                Appearance.setColorScheme(val ? "dark" : "light")
              }
              trackColor={{ false: "#E9E9EA", true: "#34C759" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* LOGOUT BUTTON FOR LOGGED-IN USERS */}
        {isLoggedIn && (
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              { backgroundColor: isDark ? "#FF453A20" : "#FF3B3015" },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
            <ThemedText style={styles.logoutText}>Log Out Account</ThemedText>
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
    paddingTop: 12,
  },
  /* GUEST & PROFILE HEADER */
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
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
    fontSize: 12,
    opacity: 0.6,
  },
  smallSignInBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallSignInText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  /* QUICK DISCOVERY GRID */
  quickDiscoveryGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  discoveryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  discoveryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  discoveryTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  discoverySub: {
    fontSize: 11,
    opacity: 0.6,
  },

  /* COMMON SECTION STYLES */
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 1,
  },
  menuList: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTextContainer: {
    flex: 1,
    gap: 2,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuItemSub: {
    fontSize: 12,
    opacity: 0.5,
  },
  lockBadge: {
    padding: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 15,
    fontWeight: "700",
  },
});
