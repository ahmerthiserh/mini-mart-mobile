import React from "react";
import { StyleSheet, View, TextInput } from "react-native";
import { ThemedText } from "@/components/themed-text";

type BusinessFormProps = {
  businessName: string;
  setBusinessName: (val: string) => void;
  businessNo: string;
  setBusinessNo: (val: string) => void;
  isDark: boolean;
  inputBg: string;
  borderColor: string;
};

export function BusinessForm({
  businessName,
  setBusinessName,
  businessNo,
  setBusinessNo,
  isDark,
  inputBg,
  borderColor,
}: BusinessFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          Registered Business Name <ThemedText style={styles.optionalTag}>(Optional)</ThemedText>
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
          placeholder="e.g. Mini Mart Logistics Ltd"
          placeholderTextColor={isDark ? "#8E8E93" : "#999"}
          value={businessName}
          onChangeText={setBusinessName}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>
          CAC Registration Number <ThemedText style={styles.optionalTag}>(Optional)</ThemedText>
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: isDark ? "#FFF" : "#000", borderColor }]}
          placeholder="e.g. RC 1234567 or BN 987654"
          placeholderTextColor={isDark ? "#8E8E93" : "#999"}
          value={businessNo}
          onChangeText={setBusinessNo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  optionalTag: { color: "#6B7280", fontWeight: "500", fontSize: 12 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
});
