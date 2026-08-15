// API Configuration for the application

// If testing on a physical Android device, replace this with your computer's local IP address (e.g., 'http://192.168.1.100:8000/api')
// If testing on Android Emulator, 'http://10.0.2.2:8000/api' points to your local machine (e.g., your Laravel backend)
// If testing on iOS Simulator, you can use 'http://localhost:8000/api' or 'http://127.0.0.1:8000/api'

export const API_BASE_URL = 'https://minimart.vetristech.com/api';

export const API_ENDPOINTS = {
  // Authentication & Profile
  LOGIN: `${API_BASE_URL}/login`,
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
  REGISTER: `${API_BASE_URL}/register`,
  LOGOUT: `${API_BASE_URL}/logout`,
  USER_PROFILE: `${API_BASE_URL}/user`,
  UPDATE_PROFILE: `${API_BASE_URL}/user`,
  PUSH_TOKEN: `${API_BASE_URL}/user/push-token`,

  // Products & Reviews
  PRODUCTS: `${API_BASE_URL}/products`,
  PRODUCT_DETAILS: (id: string | number) => `${API_BASE_URL}/products/${id}`,
  PRODUCT_REVIEWS: (id: string | number) => `${API_BASE_URL}/products/${id}/reviews`,
  ADD_REVIEW: (id: string | number) => `${API_BASE_URL}/products/${id}/reviews`,
  
  // Stores & Vendors Directory
  STORES: `${API_BASE_URL}/stores`,
  STORE_DETAILS: (id: string | number) => `${API_BASE_URL}/stores/${id}`,
  STORE_PRODUCTS: (id: string | number) => `${API_BASE_URL}/stores/${id}/products`,

  // Categories
  CATEGORIES: `${API_BASE_URL}/categories`,
  CATEGORY_PRODUCTS: (categoryId: string | number) => `${API_BASE_URL}/categories/${categoryId}/products`,

  // Cart
  CART: `${API_BASE_URL}/cart`,
  ADD_TO_CART: `${API_BASE_URL}/cart/add`,
  UPDATE_CART_ITEM: (itemId: string | number) => `${API_BASE_URL}/cart/${itemId}`,
  REMOVE_CART_ITEM: (itemId: string | number) => `${API_BASE_URL}/cart/${itemId}`,

  // Orders & Payments
  ORDERS: `${API_BASE_URL}/orders`,
  ORDER_DETAILS: (id: string | number) => `${API_BASE_URL}/orders/${id}`,
  VERIFY_PAYMENT: (id: string | number) => `${API_BASE_URL}/orders/${id}/verify-payment`,
  REPAY_ORDER: (id: string | number) => `${API_BASE_URL}/orders/${id}/repay`,

  // Saved Payment Methods
  PAYMENT_METHODS: `${API_BASE_URL}/payment-methods`,
  PAYMENT_METHOD: (id: string | number) => `${API_BASE_URL}/payment-methods/${id}`,

  // Saved Shipping Addresses
  SHIPPING_ADDRESSES: `${API_BASE_URL}/shipping-addresses`,
  SHIPPING_ADDRESS: (id: string | number) => `${API_BASE_URL}/shipping-addresses/${id}`,

  // Support & Settings
  CONTACT: `${API_BASE_URL}/contact`,
  SETTINGS: `${API_BASE_URL}/settings`,

  // Vendor Mobile Endpoints
  VENDOR: {
    DASHBOARD: `${API_BASE_URL}/vendor/dashboard`,
    STORE: `${API_BASE_URL}/vendor/store`,
    PRODUCTS: `${API_BASE_URL}/vendor/products`,
    PRODUCT_DETAILS: (id: string | number) => `${API_BASE_URL}/vendor/products/${id}`,
    ORDERS: `${API_BASE_URL}/vendor/orders`,
    ORDER_DETAILS: (id: string | number) => `${API_BASE_URL}/vendor/orders/${id}`,
    UPDATE_ORDER_STATUS: (id: string | number) => `${API_BASE_URL}/vendor/orders/${id}/status`,
    SUBSCRIPTION_PLANS: `${API_BASE_URL}/vendor/subscriptions/plans`,
    MY_SUBSCRIPTION: `${API_BASE_URL}/vendor/subscriptions/my-subscription`,
    SUBSCRIBE: `${API_BASE_URL}/vendor/subscriptions/subscribe`,
  },

  // Admin Mobile Endpoints
  ADMIN: {
    DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
    SELLERS: `${API_BASE_URL}/admin/sellers`,
    SELLER_DETAILS: (id: string | number) => `${API_BASE_URL}/admin/sellers/${id}`,
    APPROVE_SELLER: (id: string | number) => `${API_BASE_URL}/admin/sellers/${id}/approve`,
    REJECT_SELLER: (id: string | number) => `${API_BASE_URL}/admin/sellers/${id}/reject`,
    ORDERS: `${API_BASE_URL}/admin/orders`,
    ORDER_DETAILS: (id: string | number) => `${API_BASE_URL}/admin/orders/${id}`,
    UPDATE_ORDER_STATUS: (id: string | number) => `${API_BASE_URL}/admin/orders/${id}/status`,
  },
};

let sessionId: string | null = null;
const getSessionId = () => {
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  return sessionId;
};

/**
 * Helper function to get standard headers for fetch requests
 * @param token Optional authentication token (e.g., Bearer token)
 */
export const getHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Session-Id': getSessionId(),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS,
  getHeaders,
};
