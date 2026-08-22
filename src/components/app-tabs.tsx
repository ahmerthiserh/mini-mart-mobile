import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { HomeHeader } from "@/components/home-header";
import { Colors } from "@/constants/Colors";
import { HIDDEN_ROUTES } from "@/constants/hidden-routes";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function AppTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { cartCount } = useCart();
  const { user } = useAuth();

  const canManageProducts = !!(
    user?.can_manage_products ||
    user?.is_seller ||
    (Array.isArray(user?.roles) &&
      (user.roles.includes("seller") || user.roles.includes("Seller"))) ||
    (Array.isArray(user?.permissions) &&
      user.permissions.includes("manage products"))
  );

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors[isDark ? "dark" : "light"].background,
          borderTopColor: isDark ? "#333" : "#e0e0e0",
        },
        tabBarActiveTintColor: Colors[isDark ? "dark" : "light"].text,
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          headerShown: true,
          header: () => <HomeHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bag-handle" : "bag-handle-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: "Store",
          headerShown: true,
          header: () => <HomeHeader showSearch={false} title="Stores Directory" />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "storefront" : "storefront-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(seller)/manage-store"
        options={{
          title: "Manage Store",
          href: canManageProducts ? "/(seller)/manage-store" : null,
          headerShown: true,
          header: () => <HomeHeader showSearch={false} title="Manage Store" />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          headerShown: true,
          header: () => <HomeHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          headerShown: true,
          header: () => <HomeHeader />,
          tabBarBadge:
            cartCount > 0 ? (cartCount > 9 ? "9+" : cartCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#FF4747",
            color: "#fff",
            fontSize: 10,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="menu" 
        options={{
          title: 'Menu',
          headerShown: true,
          header: () => <HomeHeader showSearch={false} title="Menu" />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'menu' : 'menu-outline'} size={23} color={color} />
          )
        }} 
      />

      {HIDDEN_ROUTES.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            href: null,
            title: route.title,
            headerShown: !route.customHeader,
            tabBarStyle: { display: "none" },
            header: route.customHeader
              ? undefined
              : () => (
                  <HomeHeader
                    showSearch={false}
                    showBack={true}
                    title={route.title}
                    backHref={route.backHref}
                  />
                ),
          }}
        />
      ))}

      {/* Auth Screens - Hidden from footer and hides the footer entirely */}
      <Tabs.Screen
        name="(auth)/login"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(auth)/register"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(auth)/forgot-password"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />

      {/* Search Screen - Hidden from footer and hides the footer entirely */}
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />

      {/* Store Products Catalog Screen */}
      <Tabs.Screen
        name="stores/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
