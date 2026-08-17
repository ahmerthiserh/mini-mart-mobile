import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 70 }, (_, i) => 2010 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

type DobPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dobString: string) => void;
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  insetsBottom: number;
  primaryColor: string;
};

export function DobPickerModal({
  visible,
  onClose,
  onConfirm,
  isDark,
  cardBg,
  borderColor,
  insetsBottom,
  primaryColor,
}: DobPickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(2000);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(15);

  const handleConfirm = () => {
    const formattedDay = String(selectedDay).padStart(2, "0");
    const formattedMonth = String(selectedMonth).padStart(2, "0");
    onConfirm(`${formattedDay} / ${formattedMonth} / ${selectedYear}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: cardBg,
              borderColor,
              paddingBottom: Math.max(insetsBottom + 16, 28),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Date of Birth</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            {/* DAY COLUMN */}
            <View style={styles.pickerCol}>
              <ThemedText style={styles.pickerColLabel}>Day</ThemedText>
              <ScrollView style={styles.scrollCol} showsVerticalScrollIndicator={false}>
                {DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pickerItem, selectedDay === d && { backgroundColor: primaryColor + "20" }]}
                    onPress={() => setSelectedDay(d)}
                  >
                    <ThemedText
                      style={[styles.pickerItemText, selectedDay === d && { color: primaryColor, fontWeight: "800" }]}
                    >
                      {String(d).padStart(2, "0")}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* MONTH COLUMN */}
            <View style={styles.pickerCol}>
              <ThemedText style={styles.pickerColLabel}>Month</ThemedText>
              <ScrollView style={styles.scrollCol} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pickerItem, selectedMonth === idx + 1 && { backgroundColor: primaryColor + "20" }]}
                    onPress={() => setSelectedMonth(idx + 1)}
                  >
                    <ThemedText
                      style={[
                        styles.pickerItemText,
                        selectedMonth === idx + 1 && { color: primaryColor, fontWeight: "800" },
                      ]}
                    >
                      {m}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* YEAR COLUMN */}
            <View style={styles.pickerCol}>
              <ThemedText style={styles.pickerColLabel}>Year</ThemedText>
              <ScrollView style={styles.scrollCol} showsVerticalScrollIndicator={false}>
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.pickerItem, selectedYear === y && { backgroundColor: primaryColor + "20" }]}
                    onPress={() => setSelectedYear(y)}
                  >
                    <ThemedText
                      style={[styles.pickerItemText, selectedYear === y && { color: primaryColor, fontWeight: "800" }]}
                    >
                      {y}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: primaryColor }]} onPress={handleConfirm}>
            <ThemedText style={styles.confirmBtnText}>Confirm Date of Birth</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, gap: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: "800" },
  pickerRow: { flexDirection: "row", gap: 10, height: 180, marginTop: 6 },
  pickerCol: { flex: 1, gap: 6 },
  pickerColLabel: { fontSize: 11, fontWeight: "700", textAlign: "center", opacity: 0.6, textTransform: "uppercase" },
  scrollCol: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "rgba(140, 140, 140, 0.2)" },
  pickerItem: { paddingVertical: 8, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  pickerItemText: { fontSize: 13, fontWeight: "600" },
  confirmBtn: { height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginTop: 10 },
  confirmBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
