import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';

export type CartItemType = {
  id: number;
  product_id: number;
  name: string;
  price: string;
  quantity: number;
  category: string | null;
  image: string | null;
  store_id?: number | null;
  store_name?: string | null;
  store_whatsapp?: string | null;
};

interface CartItemRowProps {
  item: CartItemType;
  isSelected: boolean;
  isDark: boolean;
  updating: boolean;
  borderColor: string;
  brandBlue: string;
  onToggleSelection: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemoveItem: (id: number) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  isSelected,
  isDark,
  updating,
  borderColor,
  brandBlue,
  onToggleSelection,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  return (
    <View style={[styles.cartItem, { opacity: updating ? 0.5 : 1 }]}>
      <TouchableOpacity 
        onPress={() => onToggleSelection(item.id)}
        style={{ padding: 4 }}
      >
        <Ionicons 
          name={isSelected ? "checkbox" : "square-outline"} 
          size={22} 
          color={brandBlue} 
        />
      </TouchableOpacity>

      <View style={[styles.itemImagePlaceholder, { backgroundColor: isDark ? '#333' : '#E0E0E0', overflow: 'hidden' }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="image-outline" size={24} color={isDark ? '#666' : '#999'} style={{ alignSelf: 'center', marginTop: 18 }} />
        )}
      </View>
      
      <View style={styles.itemDetails}>
        {item.category ? (
          <ThemedText style={[styles.itemCategory, { color: isDark ? "#38BDF8" : brandBlue }]}>
            {item.category.toUpperCase()}
          </ThemedText>
        ) : null}
        <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
        <ThemedText style={styles.itemPrice}>₦{parseFloat(item.price).toLocaleString()}</ThemedText>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 14 }}>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={[styles.qtyButton, { borderColor, opacity: item.quantity <= 1 ? 0.5 : 1 }]} 
            onPress={() => item.quantity > 1 && onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={updating || item.quantity <= 1}
          >
            <Ionicons name="remove" size={15} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          
          <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
          
          <TouchableOpacity 
            style={[styles.qtyButton, { borderColor }]} 
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={updating}
          >
            <Ionicons name="add" size={15} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onRemoveItem(item.id)} disabled={updating}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'center',
    gap: 10,
  },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    gap: 3,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 12,
    textAlign: 'center',
  },
});
