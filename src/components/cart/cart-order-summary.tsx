import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAlert } from '@/context/AlertContext';

interface CartOrderSummaryProps {
  subtotal: number;
  selectedItemsCount: number;
  selectedItems: number[];
  isDark: boolean;
  borderColor: string;
  brandBlue: string;
  inAppCheckoutStatus?: string;
  token: string | null;
}

export const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({
  subtotal,
  selectedItemsCount,
  selectedItems,
  isDark,
  borderColor,
  brandBlue,
  inAppCheckoutStatus,
  token,
}) => {
  const router = useRouter();
  const { showConfirm } = useAlert();
  const shippingFee = subtotal > 0 ? 5000 : 0;
  const total = subtotal > 0 ? subtotal + shippingFee : 0;

  const handleCheckoutPress = () => {
    if (!token) {
      showConfirm(
        'Login Required',
        'You need to log in to proceed to checkout.',
        () => router.push('/(auth)/login' as any),
        undefined,
        'Log In',
        'Cancel'
      );
    } else {
      router.push({ pathname: '/checkout', params: { selectedItems: JSON.stringify(selectedItems) } });
    }
  };

  return (
    <View style={styles.summaryContainer}>
      <ThemedText type="subtitle" style={styles.summaryTitle}>Order Summary</ThemedText>
      
      <View style={styles.summaryRow}>
        <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
        <ThemedText style={styles.summaryValue}>₦{subtotal.toLocaleString()}</ThemedText>
      </View>
      <View style={styles.summaryRow}>
        <ThemedText style={styles.summaryLabel}>Shipping</ThemedText>
        <ThemedText style={styles.summaryValue}>₦{shippingFee.toLocaleString()}</ThemedText>
      </View>
      <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: borderColor }]}>
        <ThemedText style={styles.totalLabel}>Total</ThemedText>
        <ThemedText style={[styles.totalValue, { color: isDark ? "#38BDF8" : brandBlue }]}>
          ₦{total.toLocaleString()}
        </ThemedText>
      </View>

      {/* GLOBAL IN-APP CHECKOUT BUTTON */}
      {inAppCheckoutStatus !== 'inactive' && (
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.checkoutButton, { backgroundColor: brandBlue, opacity: selectedItemsCount === 0 ? 0.5 : 1 }]}
            disabled={selectedItemsCount === 0}
            onPress={handleCheckoutPress}
          >
            <ThemedText style={styles.checkoutButtonText}>
              Proceed to In-App Checkout
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionButtonContainer: {
    marginTop: 12,
  },
  checkoutButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
