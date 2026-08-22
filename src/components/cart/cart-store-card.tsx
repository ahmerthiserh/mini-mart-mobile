import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { CartItemRow, CartItemType } from './cart-item-row';

export type StoreGroup = {
  storeName: string;
  storeWhatsapp: string | null;
  items: CartItemType[];
};

interface CartStoreCardProps {
  group: StoreGroup;
  selectedItems: number[];
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  brandBlue: string;
  updatingId: number | null;
  sendingStoreKey: string | null;
  whatsappOrderStatus?: string;
  onToggleStoreSelection: (items: CartItemType[]) => void;
  onToggleSelection: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemoveItem: (id: number) => void;
  onSendStoreCartToWhatsApp: (group: StoreGroup) => void;
}

export const CartStoreCard: React.FC<CartStoreCardProps> = ({
  group,
  selectedItems,
  isDark,
  cardBg,
  borderColor,
  brandBlue,
  updatingId,
  sendingStoreKey,
  whatsappOrderStatus,
  onToggleStoreSelection,
  onToggleSelection,
  onUpdateQuantity,
  onRemoveItem,
  onSendStoreCartToWhatsApp,
}) => {
  const allStoreSelected = group.items.map(i => i.id).every(id => selectedItems.includes(id));
  const selectedStoreItemsCount = group.items.filter(i => selectedItems.includes(i.id)).length;
  const isSending = sendingStoreKey === group.storeName;
  const canShowWhatsApp = whatsappOrderStatus !== 'inactive' && Boolean(group.storeWhatsapp);

  return (
    <View style={[styles.storeCard, { backgroundColor: cardBg, borderColor }]}>
      {/* STORE HEADER */}
      <View style={[styles.storeHeader, { borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={styles.storeHeaderLeft}
          onPress={() => onToggleStoreSelection(group.items)}
        >
          <Ionicons 
            name={allStoreSelected ? "checkbox" : "square-outline"} 
            size={22} 
            color={brandBlue} 
          />
          <Ionicons name="storefront-outline" size={18} color={isDark ? "#38BDF8" : brandBlue} />
          <ThemedText style={styles.storeTitle} numberOfLines={1}>
            {group.storeName}
          </ThemedText>
        </TouchableOpacity>

        {/* PER-STORE WHATSAPP ORDER BUTTON */}
        {canShowWhatsApp && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.storeWhatsappBtn, { opacity: selectedStoreItemsCount === 0 || isSending ? 0.5 : 1 }]}
            disabled={selectedStoreItemsCount === 0 || isSending}
            onPress={() => onSendStoreCartToWhatsApp(group)}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={14} color="#FFF" />
                <ThemedText style={styles.storeWhatsappBtnText}>
                  Order Store
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* STORE ITEMS LIST */}
      <View style={styles.storeItemsList}>
        {group.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            isDark={isDark}
            updating={updatingId === item.id}
            borderColor={borderColor}
            brandBlue={brandBlue}
            onToggleSelection={onToggleSelection}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  storeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  storeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  storeTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  storeWhatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  storeWhatsappBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  storeItemsList: {
    padding: 10,
    gap: 12,
  },
});
