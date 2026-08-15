import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';

interface AddToCartButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function AddToCartButton({ onPress, style, title = "Add to Cart", icon = "cart" }: AddToCartButtonProps) {
  const isDark = useColorScheme() === 'dark';
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: Colors[isDark ? 'dark' : 'light'].primary },
        style
      ]} 
      onPress={onPress}
    >
      {icon && <Ionicons name={icon} size={20} color={isDark ? '#000' : '#FFF'} />}
      <ThemedText style={[styles.text, { color: isDark ? '#000' : '#FFF' }]}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
