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
import api from "@/config/api";

import { MenuHeader } from "@/components/menu/menu-header";
import { SellerCtaCard } from "@/components/menu/seller-cta-card";
import { QuickDiscovery } from "@/components/menu/quick-discovery";
import { MenuItemsList, MenuItemType } from "@/components/menu/menu-items-list";

const MENU_ITEMS: MenuItemType[] = [
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
  const [storeData, setStoreData] = React.useState<any>(null);

  React.useEffect(() => {
    if (isLoggedIn && token) {
      setStoreData(null);
      fetch(api.ENDPOINTS.VENDOR.STORE, {
        headers: api.getHeaders(token),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.id) {
            setStoreData(data);
          } else {
            setStoreData(null);
          }
        })
        .catch(() => setStoreData(null));
    } else {
      setStoreData(null);
    }
  }, [isLoggedIn, token]);

  const hasStore = !!(storeData && storeData.id);
  const storeName = storeData?.store_name;

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

  const handleMenuItemPress = (item: MenuItemType) => {
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
        {/* PROFILE / GUEST HEADER */}
        <MenuHeader
          isLoggedIn={isLoggedIn}
          user={user}
          isDark={isDark}
          cardBg={cardBg}
          borderColor={borderColor}
          getInitials={getInitials}
          onSignIn={() => router.push("/(auth)/login")}
          onRegister={() => router.push("/(auth)/register")}
          onProfilePress={() => router.push("/(settings)/personal-info")}
        />

        {/* BECOME OR UPDATE SELLER CTA FOR LOGGED IN USERS */}
        {isLoggedIn && (
          <SellerCtaCard
            isDark={isDark}
            hasStore={hasStore}
            storeName={storeName}
            onPress={() => {
              if (hasStore) {
                const slug = storeData?.seller_type_slug || "physical-business";
                const name = storeData?.seller_type_name || "Physical Business";
                router.push({
                  pathname: "/(seller)/onboarding",
                  params: {
                    typeSlug: slug,
                    typeName: name,
                  },
                } as any);
              } else {
                router.push("/(seller)/select-type" as any);
              }
            }}
            onVerificationPress={() => {
              const slug = storeData?.seller_type_slug || "physical-business";
              const name = storeData?.seller_type_name || "Physical Business";
              router.push({
                pathname: "/(seller)/verification",
                params: {
                  typeSlug: slug,
                  typeName: name,
                  storeName: storeName || "Your Store",
                },
              } as any);
            }}
          />
        )}

        {/* QUICK DISCOVERY SECTION FOR GUESTS */}
        {!isLoggedIn && (
          <QuickDiscovery
            cardBg={cardBg}
            borderColor={borderColor}
            isDark={isDark}
            onStoresPress={() => router.push("/stores")}
            onCategoriesPress={() => router.push("/categories")}
          />
        )}

        {/* ACCOUNT / SERVICES MENU */}
        <MenuItemsList
          menuItems={MENU_ITEMS}
          isLoggedIn={isLoggedIn}
          isDark={isDark}
          cardBg={cardBg}
          borderColor={borderColor}
          primaryColor={primaryColor}
          onItemPress={handleMenuItemPress}
        />

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
