import React from "react";
import { StyleSheet, ScrollView, View, TouchableOpacity, useColorScheme, ActivityIndicator, KeyboardAvoidingView, Platform, Text, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IdentityForm } from "@/components/verification/identity-form";
import { BusinessForm } from "@/components/verification/business-form";
import { StoreForm } from "@/components/verification/store-form";
import { DobPickerModal } from "@/components/verification/dob-picker-modal";
import { VerificationHeaderCard } from "@/components/verification/verification-header-card";
import { VerificationTierTabs } from "@/components/verification/verification-tier-tabs";
import { useSellerVerification } from "@/hooks/use-seller-verification";

export default function SellerVerificationScreen() {
  const params = useLocalSearchParams<{ storeName?: string; typeSlug?: string }>();
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const state = useSellerVerification(params.storeName, params.typeSlug);

  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const inputBg = isDark ? "#2C2C2E" : "#F8F9FA";

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={state.refreshing} onRefresh={state.refreshStatus} colors={[state.PRIMARY_COLOR]} />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 120, 160) },
          ]}
        >
          <VerificationHeaderCard
            storeName={state.storeName}
            myBadges={state.myBadges}
            showInfo={state.showInfo}
            setShowInfo={state.setShowInfo}
            cardBg={cardBg}
            borderColor={borderColor}
            isDark={isDark}
            primaryColor={state.PRIMARY_COLOR}
          />

          {(state.verificationStatus === "pending" || state.verificationStatus === "under_review") && (
            <View style={[styles.statusBannerCard, { backgroundColor: isDark ? "#2C2C2E" : "#FFFBEB", borderColor: "#F59E0B" }]}>
              <View style={styles.statusBannerRow}>
                <Ionicons name="time" size={22} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.statusBannerTitle}>Verification Under Review</ThemedText>
                  <ThemedText style={styles.statusBannerSub}>
                    Your submitted verification details are currently pending admin review.
                  </ThemedText>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.checkStatusBtn, { borderColor: state.PRIMARY_COLOR }]}
                  onPress={state.refreshStatus}
                  disabled={state.refreshing}
                >
                  {state.refreshing ? (
                    <ActivityIndicator size="small" color={state.PRIMARY_COLOR} />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={15} color={state.PRIMARY_COLOR} />
                      <Text style={[styles.checkStatusBtnText, { color: state.PRIMARY_COLOR }]}>Check Status</Text>
                    </>
                  )}
                </TouchableOpacity>

                {!state.isEditing ? (
                  <TouchableOpacity
                    style={[styles.editToggleBtn, { backgroundColor: state.PRIMARY_COLOR, flex: 1 }]}
                    onPress={() => state.setIsEditing(true)}
                  >
                    <Ionicons name="create-outline" size={16} color="#FFF" />
                    <Text style={styles.editToggleBtnText}>Edit Details</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.editingActiveTag, { flex: 1 }]}>
                    <Ionicons name="create" size={14} color="#3B82F6" />
                    <ThemedText style={styles.editingActiveText}>Editing Enabled</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {state.verificationStatus === "approved" && (
            <View style={[styles.statusBannerCard, { backgroundColor: isDark ? "#143823" : "#ECFDF5", borderColor: "#10B981" }]}>
              <View style={styles.statusBannerRow}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.statusBannerTitle, { color: "#059669" }]}>Verification Approved 🎉</ThemedText>
                  <ThemedText style={styles.statusBannerSub}>
                    Your seller account and business identity have been reviewed and fully verified.
                  </ThemedText>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.checkStatusBtn, { borderColor: "#10B981" }]}
                  onPress={state.refreshStatus}
                  disabled={state.refreshing}
                >
                  {state.refreshing ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={15} color="#10B981" />
                      <Text style={[styles.checkStatusBtnText, { color: "#10B981" }]}>Refresh</Text>
                    </>
                  )}
                </TouchableOpacity>

                {!state.isEditing ? (
                  <TouchableOpacity
                    style={[styles.editToggleBtn, { backgroundColor: "#10B981", flex: 1 }]}
                    onPress={() => state.setIsEditing(true)}
                  >
                    <Ionicons name="create-outline" size={16} color="#FFF" />
                    <Text style={styles.editToggleBtnText}>Update Details</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.editingActiveTag, { flex: 1 }]}>
                    <Ionicons name="create" size={14} color="#10B981" />
                    <ThemedText style={[styles.editingActiveText, { color: "#10B981" }]}>Editing Enabled</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {(state.isEditing || (state.verificationStatus !== "pending" && state.verificationStatus !== "under_review" && state.verificationStatus !== "approved")) && (
            <>
              <VerificationTierTabs
                actionLevels={state.actionLevels}
                activeLevel={state.activeLevel}
                setActiveLevel={state.setActiveLevel}
                myBadges={state.myBadges}
                cardBg={cardBg}
                borderColor={borderColor}
                isDark={isDark}
              />

              <View style={[styles.formCard, { backgroundColor: cardBg, borderColor, borderTopColor: state.currentLevelObj.color, borderTopWidth: 3 }]}>
            <View style={styles.levelBanner}>
              <View style={[styles.levelIconBg, { backgroundColor: state.currentLevelObj.color + "18" }]}>
                <Ionicons name={state.currentLevelObj.icon as any} size={24} color={state.currentLevelObj.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ThemedText style={styles.levelCardTitle}>{state.currentLevelObj.title} Verification</ThemedText>
                  <View style={[styles.tagPill, { backgroundColor: state.currentLevelObj.color + "20" }]}>
                    <ThemedText style={[styles.tagText, { color: state.currentLevelObj.color }]}>{state.currentLevelObj.tag}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.levelCardDesc}>{state.currentLevelObj.desc}</ThemedText>
              </View>
            </View>

            {state.activeLevel === "identity" && (
              <IdentityForm
                idType={state.idType}
                setIdType={state.setIdType}
                fullName={state.fullName}
                setFullName={state.setFullName}
                idNumber={state.idNumber}
                setIdNumber={state.setIdNumber}
                dob={state.dob}
                onOpenDatePicker={() => state.setShowDatePicker(true)}
                idDocumentUri={state.idDocumentUri}
                selfieDocumentUri={state.selfieDocumentUri}
                onPickImage={state.pickImage}
                onTakeCameraPhoto={state.takeCameraPhoto}
                isDark={isDark}
                inputBg={inputBg}
                borderColor={borderColor}
                primaryColor={state.PRIMARY_COLOR}
              />
            )}

            {state.activeLevel === "business" && (
              <BusinessForm
                businessName={state.businessName}
                setBusinessName={state.setBusinessName}
                businessNo={state.businessNo}
                setBusinessNo={state.setBusinessNo}
                isDark={isDark}
                inputBg={inputBg}
                borderColor={borderColor}
              />
            )}

            {state.activeLevel === "physical_store" && (
              <StoreForm
                shopAddress={state.shopAddress}
                setShopAddress={state.setShopAddress}
                shopNo={state.shopNo}
                setShopNo={state.setShopNo}
                generalDocumentUri={state.generalDocumentUri}
                onPickImage={() => state.pickImage("general")}
                onTakeCameraPhoto={() => state.takeCameraPhoto("general")}
                isDark={isDark}
                inputBg={inputBg}
                borderColor={borderColor}
                primaryColor={state.PRIMARY_COLOR}
              />
            )}

            {(() => {
              const activeIdx = state.actionLevels.findIndex((l) => l.id === state.activeLevel);
              const isLastTab = activeIdx === state.actionLevels.length - 1;
              const buttonText = isLastTab ? "Submit for Review" : "Save & Continue";
              const iconName = isLastTab ? "shield-checkmark-outline" : "arrow-forward-outline";
              const buttonBgColor = isLastTab ? "#10B981" : state.currentLevelObj.color;

              return (
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: buttonBgColor }, state.loading && { opacity: 0.7 }]}
                  onPress={state.handleSubmitVerification}
                  disabled={state.loading}
                >
                  {state.loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name={iconName} size={18} color="#FFF" />
                      <Text
                        style={styles.submitBtnText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {buttonText}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })()}
          </View>
        </>
      )}
        </ScrollView>
      </KeyboardAvoidingView>

      <DobPickerModal
        visible={state.showDatePicker}
        onClose={() => state.setShowDatePicker(false)}
        onConfirm={(formattedDob) => state.setDob(formattedDob)}
        isDark={isDark}
        cardBg={cardBg}
        borderColor={borderColor}
        insetsBottom={insets.bottom}
        primaryColor={state.PRIMARY_COLOR}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 160, gap: 10 },
  formCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  levelBanner: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  levelIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  levelCardTitle: { fontSize: 15, fontWeight: "800" },
  tagPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: "800" },
  levelCardDesc: { fontSize: 12, opacity: 0.7, marginTop: 2, lineHeight: 16 },
  submitBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  submitBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14, textAlign: "center", flexShrink: 1 },
  statusBannerCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  statusBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#D97706",
  },
  statusBannerSub: {
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 15,
  },
  checkStatusBtn: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 6,
  },
  checkStatusBtnText: {
    fontWeight: "700",
    fontSize: 13,
  },
  editToggleBtn: {
    height: 38,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  editToggleBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  editingActiveTag: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  editingActiveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
  },
});
