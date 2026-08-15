import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/config/api';
import { useAuth } from './AuthContext';

export interface CartItemType {
  id: number;
  product_id: number;
  quantity: number;
  name?: string;
  price?: string;
  image?: string;
}

interface CartContextType {
  cartCount: number;
  cartItems: CartItemType[];
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  cartItems: [],
  refreshCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const { token } = useAuth();

  const refreshCart = async () => {
    try {
      const response = await fetch(api.ENDPOINTS.CART, {
        headers: api.getHeaders(token),
      });
      const data = await response.json();
      if (response.ok && data.items) {
        setCartItems(data.items);
        // Set cart count as the number of unique items (data.items.length)
        setCartCount(data.items.length);
      }
    } catch (error) {
      console.error('Failed to fetch cart count', error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [token]);

  return (
    <CartContext.Provider value={{ cartCount, cartItems, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};
