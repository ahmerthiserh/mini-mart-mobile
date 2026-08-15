import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { HomeHeader } from "@/components/home-header";
import { Colors } from "@/constants/Colors";
import { useCart } from "@/context/CartContext";

const HIDDEN_ROUTES = [
  // Orders
  {
    name: "(orders)/order-details",
    title: "Order Details",
    backHref: "/(orders)/orders" as any,
  },
  {
    name: "(orders)/track-order",
    title: "Track Order",
    backHref: "/(orders)/order-details" as any,
  },
  // Payment
  {
    name: "(payment)/payment",
    title: "Payment Methods",
    backHref: "/menu" as any,
  },
  {
    name: "(payment)/edit-payment",
    title: "Edit Payment",
    backHref: "/(payment)/payment" as any,
  },
  {
    name: "(payment)/add-payment",
    title: "Add Payment",
    backHref: "/(payment)/payment" as any,
  },
  // Addresses
  {
    name: "(addresses)/addresses",
    title: "Shipping Addresses",
    backHref: "/menu" as any,
  },
  {
    name: "(addresses)/add-address",
    title: "Add Address",
    backHref: "/(addresses)/addresses" as any,
  },
  {
    name: "(addresses)/edit-address",
    title: "Edit Address",
    backHref: "/(addresses)/addresses" as any,
  },
  // Settings
  { name: "(settings)/settings", title: "Settings", backHref: "/menu" as any },
  {
    name: "(settings)/personal-info",
    title: "Personal Info",
    backHref: "/(settings)/settings" as any,
  },
  { name: "(settings)/help", title: "Help", backHref: "/menu" as any },
  { name: "(settings)/support", title: "Support", backHref: "/menu" as any },
  // Product
  { name: "product/[id]", title: "Product Details", backHref: "/" as any },
  // Checkout
  { name: "checkout", title: "Checkout", backHref: "/cart" as any },
];

export default function AppTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { cartCount } = useCart();

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
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: "Stores",
          headerShown: true,
          header: () => <HomeHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "storefront" : "storefront-outline"}
              size={24}
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
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="(orders)/orders" 
        options={{
          title: 'Orders',
          headerShown: true,
          header: () => <HomeHeader showSearch={false} title="My Orders" />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          )
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
              size={24}
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
            <Ionicons name={focused ? 'menu' : 'menu-outline'} size={24} color={color} />
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
            headerShown: true,
            header: () => (
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
    </Tabs>
  );
}
