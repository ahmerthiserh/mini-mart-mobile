import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import api from '@/config/api';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Pending';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TrackOrderScreen() {
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#EAEAEA';
  
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const { token } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && orderId) {
      fetchOrderDetails();
    }
  }, [token, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(api.ENDPOINTS.ORDER_DETAILS(orderId), {
        headers: api.getHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Order not found</ThemedText>
      </ThemedView>
    );
  }

  const items = order.items || [];
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  
  const isPlaced = true;
  const isProcessing = order.status !== 'pending' && !isCancelled;
  const isShipped = items.some((i: any) => i.status === 'shipped' || i.status === 'delivered') && !isCancelled;
  const isDelivered = (order.status === 'delivered' || (items.length > 0 && items.every((i: any) => i.status === 'delivered'))) && !isCancelled;

  let currentStepId = '1';
  if (isDelivered) currentStepId = '4';
  else if (isShipped) currentStepId = '3';
  else if (isProcessing) currentStepId = '2';

  const TRACKING_STEPS = [
    { 
      id: '1', 
      title: 'Order Placed', 
      date: formatDate(order.created_at), 
      completed: isPlaced, 
      current: currentStepId === '1' 
    },
    { 
      id: '2', 
      title: 'Processing', 
      date: isProcessing ? formatDate(order.updated_at) : 'Pending', 
      completed: isProcessing, 
      current: currentStepId === '2' 
    },
    { 
      id: '3', 
      title: 'Shipped', 
      date: isShipped ? formatDate(items.find((i: any) => i.status === 'shipped' || i.status === 'delivered')?.updated_at) : 'Pending', 
      completed: isShipped, 
      current: currentStepId === '3' 
    },
    { 
      id: '4', 
      title: 'Delivered', 
      date: isDelivered ? formatDate(order.updated_at) : 'Pending', 
      completed: isDelivered, 
      current: currentStepId === '4' 
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {isCancelled && (
          <View style={{ marginBottom: 16, backgroundColor: '#FF3D0015', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF3D00', alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF3D00" />
            <ThemedText style={{ color: '#FF3D00', fontWeight: '700', fontSize: 16, marginTop: 4 }}>Order Cancelled</ThemedText>
            <ThemedText style={{ color: '#FF3D00', fontSize: 13, textAlign: 'center', marginTop: 2, opacity: 0.8 }}>This order has been cancelled/refunded.</ThemedText>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <ThemedText style={styles.headerTitle}>Tracking Details</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Order #{order.order_number}</ThemedText>
          <View style={styles.divider} />
          
          <View style={styles.timelineContainer}>
            {TRACKING_STEPS.map((step, index) => {
              const isLast = index === TRACKING_STEPS.length - 1;
              const dotColor = step.completed ? '#00C853' : (isDark ? '#333' : '#E0E0E0');
              const lineColor = step.completed && !step.current ? '#00C853' : (isDark ? '#333' : '#E0E0E0');
              
              return (
                <View key={step.id} style={styles.timelineRow}>
                  {/* Left Timeline Graphics */}
                  <View style={styles.timelineGraphic}>
                    <View style={[
                      styles.dot, 
                      { backgroundColor: dotColor },
                      step.current && styles.currentDot
                    ]}>
                      {step.completed && !step.current && (
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[styles.line, { backgroundColor: lineColor }]} />
                    )}
                  </View>
                  
                  {/* Right Content */}
                  <View style={styles.timelineContent}>
                    <ThemedText style={[
                      styles.stepTitle, 
                      { opacity: step.completed || step.current ? 1 : 0.4 }
                    ]}>
                      {step.title}
                    </ThemedText>
                    <ThemedText style={step.completed || step.current ? { color: isDark ? '#fff' : '#000', fontSize: 13, opacity: 0.5 } : styles.stepDate}>{step.date}</ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
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
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 24,
    opacity: 0.2,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineGraphic: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  currentDot: {
    borderWidth: 5,
    borderColor: '#00C85333', 
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 48,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 36,
    marginTop: -1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepDate: {
    fontSize: 13,
    opacity: 0.5,
  },
});
