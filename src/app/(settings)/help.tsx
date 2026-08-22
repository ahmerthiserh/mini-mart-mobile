import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useColorScheme,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/Colors";

interface FAQItem {
  id: string;
  category: "Orders & Delivery" | "Seller & Store" | "Payment & Account";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "1",
    category: "Orders & Delivery",
    question: "How do I track my active order status?",
    answer:
      "Go to Menu > My Orders, tap on any order to view real-time status updates (Pending, Confirmed, Processing, Shipped, or Delivered).",
  },
  {
    id: "2",
    category: "Orders & Delivery",
    question: "Can I cancel or modify an order?",
    answer:
      "Orders can be cancelled before seller confirmation directly from the Order Details page. Once an order is confirmed or shipped, please reach out to Customer Support.",
  },
  {
    id: "3",
    category: "Seller & Store",
    question: "How do I start selling on Mini-Mart?",
    answer:
      "Navigate to Menu > Become a Seller, choose your Business Type, fill in your business name and details, and upload your store logo/profile picture to activate your store.",
  },
  {
    id: "4",
    category: "Seller & Store",
    question: "What are product upload slots and how do I buy more?",
    answer:
      "Product slots allow vendors to list active items on Mini-Mart. You can check your available slots or purchase additional slot packages via Manage Store > Buy Slots.",
  },
  {
    id: "5",
    category: "Seller & Store",
    question: "How do I edit or unpublish my product listings?",
    answer:
      "Open Manage Store. Tap 'Edit' on any product card to modify images, pricing, unit quantities, or description. You can also toggle between Published and Draft status directly on the product card badge.",
  },
  {
    id: "6",
    category: "Seller & Store",
    question: "How do I complete store verification?",
    answer:
      "Submit your identity and business registration documents (CAC / Govt ID) under Menu > Seller Verification. Once reviewed by our admin team, your store gets a Verified badge.",
  },
  {
    id: "7",
    category: "Payment & Account",
    question: "What payment methods are supported on Mini-Mart?",
    answer:
      "Mini-Mart supports online payment via Cards, Bank Transfer, USSD, and saved payment methods processed securely through Paystack & Flutterwave.",
  },
  {
    id: "8",
    category: "Payment & Account",
    question: "How do I update my shipping addresses?",
    answer:
      "Go to Menu > Shipping Addresses to add, edit, or set a primary delivery location for fast checkout.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#EAEAEA";
  const primaryColor = Colors[isDark ? "dark" : "light"].primary;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = ["All", "Orders & Delivery", "Seller & Store", "Payment & Account"];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER AREA */}
        <View style={styles.headerArea}>
          <ThemedText style={styles.greetingText}>
            Hi there, how can we help?
          </ThemedText>

          {/* SEARCH BAR */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                borderColor,
              },
            ]}
          >
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
              placeholder="Search help articles & FAQs..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CATEGORY FILTER PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected
                      ? "#0284C7"
                      : isDark
                      ? "#2C2C2E"
                      : "#F2F2F7",
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <ThemedText
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? "#FFF" : isDark ? "#DDD" : "#444" },
                  ]}
                >
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* QUICK CONTACT SUPPORT BANNER */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.supportBanner, { backgroundColor: cardBg, borderColor }]}
          onPress={() => router.push("/(settings)/support" as any)}
        >
          <View style={styles.supportBannerLeft}>
            <View style={[styles.supportIconBg, { backgroundColor: primaryColor + "15" }]}>
              <Ionicons name="headset-outline" size={22} color={primaryColor} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={styles.supportBannerTitle}>
                Still need assistance?
              </ThemedText>
              <ThemedText style={styles.supportBannerSub}>
                Contact our 24/7 Support Team
              </ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </TouchableOpacity>

        {/* FAQ LIST */}
        <ThemedText style={styles.sectionTitle}>
          Frequently Asked Questions
        </ThemedText>

        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyFaq}>
            <Ionicons name="help-circle-outline" size={44} color="#8E8E93" />
            <ThemedText style={styles.emptyText}>
              No help articles found matching "{searchQuery}"
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.faqContainer, { backgroundColor: cardBg, borderColor }]}>
            {filteredFaqs.map((faq, index) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <View key={faq.id}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.faqRow,
                      index !== 0 && { borderTopWidth: 1, borderTopColor: borderColor },
                    ]}
                    onPress={() => toggleFaq(faq.id)}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <ThemedText style={styles.faqCategoryBadge}>
                        {faq.category}
                      </ThemedText>
                      <ThemedText style={styles.faqQuestion}>
                        {faq.question}
                      </ThemedText>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#8E8E93"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <ThemedText style={styles.faqAnswer}>
                        {faq.answer}
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
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
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  headerArea: {
    gap: 12,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  categoryScroll: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  supportBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  supportBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  supportIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  supportBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  supportBannerSub: {
    fontSize: 12,
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  faqContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqCategoryBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
    textTransform: "uppercase",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.75,
  },
  emptyFaq: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: "center",
  },
});
