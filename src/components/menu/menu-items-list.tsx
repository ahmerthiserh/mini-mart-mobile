import React from "react";
import { StyleSheet, View, TouchableOpacity, StyleSheet as RNStyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

export type MenuItemType = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  authRequired: boolean;
};

type MenuItemsListProps = {
  menuItems: MenuItemType[];
  isLoggedIn: boolean;
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  primaryColor: string;
  onItemPress: (item: MenuItemType) => void;
};

export function MenuItemsList({
  menuItems,
  isLoggedIn,
  isDark,
  cardBg,
  borderColor,
  primaryColor,
  onItemPress,
}: MenuItemsListProps) {
  return (
    <>
      <ThemedText
        style={[styles.sectionTitle, { color: isDark ? "#8E8E93" : "#6C6C70" }]}
      >
        {isLoggedIn ? "Account Services" : "Menu & Features"}
      </ThemedText>

      <View style={[styles.menuList, { backgroundColor: cardBg, borderColor }]}>
        {menuItems.map((item, index) => {
          const isLocked = item.authRequired && !isLoggedIn;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onItemPress(item)}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomColor: borderColor },
                index === menuItems.length - 1 && { borderBottomWidth: 0 },
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
    </>
  );
}

const styles = StyleSheet.create({
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
    borderBottomWidth: RNStyleSheet.hairlineWidth,
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
});
