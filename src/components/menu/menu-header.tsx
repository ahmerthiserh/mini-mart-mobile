import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

type MenuHeaderProps = {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  getInitials: (name: string) => string;
  onSignIn: () => void;
  onRegister: () => void;
  onProfilePress: () => void;
};

export function MenuHeader({
  isLoggedIn,
  user,
  isDark,
  cardBg,
  borderColor,
  getInitials,
  onSignIn,
  onRegister,
  onProfilePress,
}: MenuHeaderProps) {
  if (!isLoggedIn) {
    return (
      <View style={[styles.profileSection, { borderColor, backgroundColor: cardBg }]}>
        <View
          style={[
            styles.avatarPlaceholder,
            {
              backgroundColor: isDark ? "#1C2A3A" : "#EBF5FF",
              borderColor: isDark ? "#2C4260" : "#BFDBFE",
            },
          ]}
        >
          <Ionicons name="person" size={22} color="#3B82F6" />
        </View>

        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileName}>Guest User</ThemedText>
          <View style={styles.guestTagRow}>
            <View style={[styles.guestTag, { backgroundColor: isDark ? "#1C2A3A" : "#EBF5FF" }]}>
              <Ionicons name="lock-closed" size={10} color="#3B82F6" />
              <ThemedText style={styles.guestTagText}>Limited access</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.guestActions}>
          <TouchableOpacity
            onPress={onSignIn}
            style={[styles.smallSignInBtn, { backgroundColor: "#3B82F6" }]}
          >
            <ThemedText style={styles.smallSignInText}>Sign In</ThemedText>
            <Ionicons name="arrow-forward" size={13} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRegister}>
            <ThemedText style={[styles.registerLink, { color: isDark ? "#60A5FA" : "#3B82F6" }]}>
              Register
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.profileSection, { borderColor, backgroundColor: cardBg }]}>
      <View
        style={[
          styles.avatarPlaceholder,
          {
            backgroundColor: isDark ? "#1C2A3A" : "#EBF5FF",
            borderColor: isDark ? "#2C4260" : "#BFDBFE",
          },
        ]}
      >
        <ThemedText style={{ fontSize: 18, fontWeight: "800", color: "#3B82F6" }}>
          {user ? getInitials(user.name) : "U"}
        </ThemedText>
      </View>

      <View style={styles.profileInfo}>
        <ThemedText style={styles.profileName} numberOfLines={1}>
          {user?.name || "Account"}
        </ThemedText>
        <View style={styles.guestTagRow}>
          <View style={[styles.guestTag, { backgroundColor: isDark ? "#1C2A3A" : "#EBF5FF" }]}>
            <Ionicons name="checkmark-circle" size={10} color="#3B82F6" />
            <ThemedText style={[styles.guestTagText, { color: "#3B82F6" }]}>Verified User</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.guestActions}>
        <TouchableOpacity
          onPress={onProfilePress}
          style={[styles.smallSignInBtn, { backgroundColor: "#3B82F6" }]}
        >
          <Ionicons name="person-outline" size={14} color="#FFF" />
          <ThemedText style={styles.smallSignInText}>Profile</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  guestTagRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  guestTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  guestTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#3B82F6",
  },
  guestActions: {
    alignItems: "center",
    gap: 8,
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
  registerLink: {
    fontSize: 12,
    fontWeight: "600",
  },
});
