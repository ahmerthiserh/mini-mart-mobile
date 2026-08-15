import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, useColorScheme, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const FAQS = [
  {
    id: '1',
    question: 'How do I track my order?',
    answer: 'You can track your order by navigating to the "My Orders" tab, selecting your active order, and tapping "Track Order".',
  },
  {
    id: '2',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day money-back guarantee for unused items in their original packaging. Please contact support to initiate a return.',
  },
  {
    id: '3',
    question: 'How do I change my shipping address?',
    answer: 'Go to Settings > Shipping Addresses. You can add a new address or edit an existing one there.',
  },
];

export default function HelpScreen() {
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerArea}>
          <ThemedText style={styles.greetingText}>Hi there, how can we help?</ThemedText>
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#222' : '#F5F5F5', borderColor: borderColor }]}>
            <Ionicons name="search" size={20} color={isDark ? '#666' : '#999'} />
            <TextInput 
              style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]} 
              placeholder="Search help articles..."
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Frequently Asked Questions</ThemedText>
        
        <View style={[styles.faqContainer, { backgroundColor: cardBg, borderColor: borderColor }]}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <View key={faq.id}>
                <TouchableOpacity 
                  style={[styles.faqRow, index !== 0 && { borderTopWidth: 1, borderTopColor: borderColor }]} 
                  onPress={() => toggleFaq(faq.id)}
                >
                  <ThemedText style={styles.faqQuestion}>{faq.question}</ThemedText>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={isDark ? '#888' : '#666'} 
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <ThemedText style={styles.faqAnswer}>{faq.answer}</ThemedText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

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
  },
  headerArea: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  faqContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingRight: 16,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.7,
  },
});
