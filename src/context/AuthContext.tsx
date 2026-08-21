import React, { createContext, useState, useEffect, useContext } from 'react';
import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../config/api';

const SecureStore = {
  getItemAsync: async (key: string) => {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    }
    return ExpoSecureStore.getItemAsync(key);
  },
  setItemAsync: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } else {
      await ExpoSecureStore.setItemAsync(key, value);
    }
  },
  deleteItemAsync: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } else {
      await ExpoSecureStore.deleteItemAsync(key);
    }
  }
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_seller?: boolean;
  can_manage_products?: boolean;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  refreshUser: (authToken?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    try {
      const res = await fetch(api.ENDPOINTS.USER_PROFILE, {
        headers: api.getHeaders(activeToken),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user || data;
        if (updatedUser) {
          await SecureStore.setItemAsync('auth_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.log('Error refreshing user profile:', error);
    }
  };

  useEffect(() => {
    // Check for saved token and user on app load
    const loadSavedAuth = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('auth_token');
        const savedUser = await SecureStore.getItemAsync('auth_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          refreshUser(savedToken);
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedAuth();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    try {
      await SecureStore.setItemAsync('auth_token', newToken);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      refreshUser(newToken);
    } catch (error) {
      console.error('Failed to save auth data', error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear auth data', error);
    }
  };

  const updateUser = async (newUser: User) => {
    try {
      await SecureStore.setItemAsync('auth_user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error('Failed to update user auth data', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
