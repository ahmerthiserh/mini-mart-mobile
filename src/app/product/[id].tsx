import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, Dimensions, ActivityIndicator, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddToCartButton } from '@/components/add-to-cart-button';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type ProductDetails = {
  id: number;
  name: string;
  description: string;
  price: string;
  category?: { name: string };
  images: string[];
  whatsapp_number?: string;
  whatsapp_url?: string;
  seller?: {
    store_name?: string;
    whatsapp_number?: string;
    phone_number?: string;
    whatsapp_url?: string;
  };
};

export default function ProductDetailsScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const { refreshCart, cartItems } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(3);
  const [color, setColor] = useState('');
  
  const imageScrollRef = useRef<ScrollView>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setProduct(null);
    setLoading(true);
    setActiveImageIndex(0);
    setQuantity(3);
    setColor('');
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (product && cartItems.some(item => item.product_id === product.id)) {
      setIsAdded(true);
    } else {
      setIsAdded(false);
    }
  }, [product, id, cartItems]);

  useEffect(() => {
    if (isAdded) {
      setIsAdded(false);
    }
  }, [quantity]);

  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (activeImageIndex + 1) % product.images.length;
      setActiveImageIndex(nextIndex);
      imageScrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(timer);
  }, [product, activeImageIndex]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(api.ENDPOINTS.PRODUCT_DETAILS(id as string));
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        showToast('Product not found', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch product details', error);
      showToast('Network error while loading product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (isAdded) {
      router.push('/cart');
      return;
    }

    if (!product) return;

    if (!color.trim()) {
      showToast('Please enter your preferred color', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch(`${api.ENDPOINTS.CART}/add`, {
        method: 'POST',
        headers: api.getHeaders(token),
        body: JSON.stringify({ 
          product_id: product.id, 
          quantity: quantity,
          preferred_colors: color.trim()
        }),
      });
      if (response.ok) {
        setIsAdded(true);
        refreshCart();
        showToast(`${product.name} added to cart`, 'success');
      } else {
        showToast('Failed to add item to cart', 'error');
      }
    } catch (error) {
      console.error('Failed to add to cart', error);
      showToast('Network error while adding to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWhatsAppPress = () => {
    if (!product) return;
    const rawNumber = product.whatsapp_number || product.seller?.whatsapp_number || product.seller?.phone_number;
    const yardsText = quantity > 1 ? ` (${quantity} yards)` : '';
    const colorText = color.trim() ? ` - Color: ${color.trim()}` : '';
    const message = `Hello! I am interested in buying: ${product.name}${yardsText}${colorText} for ₦${(parseFloat(product.price) * quantity).toLocaleString()}`;
    const encodedMsg = encodeURIComponent(message);

    let url = '';
    if (rawNumber) {
      const cleanNum = rawNumber.replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleanNum}?text=${encodedMsg}`;
    } else if (product.whatsapp_url || product.seller?.whatsapp_url) {
      const baseUrl = (product.whatsapp_url || product.seller?.whatsapp_url)!;
      url = baseUrl.includes('?') ? `${baseUrl}&text=${encodedMsg}` : `${baseUrl}?text=${encodedMsg}`;
    } else {
      showToast('Merchant WhatsApp contact not available', 'error');
      return;
    }

    Linking.openURL(url).catch(() => {
      showToast('Could not open WhatsApp', 'error');
    });
  };

  const cardBg = isDark ? '#1A1A1A' : '#F8F9FA';
  const borderColor = isDark ? '#333' : '#EAEAEA';

  if (loading || !product) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors[isDark ? 'dark' : 'light'].text} />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Carousel Wrapper */}
        <View style={[styles.carouselWrapper, { backgroundColor: isDark ? '#0D0D0D' : '#F5F5F7' }]}>
          <ScrollView 
            ref={imageScrollRef}
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              if (slide !== activeImageIndex) {
                setActiveImageIndex(slide);
              }
            }}
            scrollEventThrottle={16}
          >
            {product.images && product.images.length > 0 ? (
              product.images.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={styles.image} contentFit="contain" transition={200} />
              ))
            ) : (
              <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#111' : '#f5f5f5' }]}>
                <Ionicons name="image-outline" size={64} color={isDark ? '#444' : '#CCC'} />
              </View>
            )}
          </ScrollView>

          {/* Dots Indicator */}
          {product.images && product.images.length > 1 && (
            <View style={styles.dotsContainer}>
              {product.images.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    activeImageIndex === index ? styles.activeDot : styles.inactiveDot,
                    { backgroundColor: activeImageIndex === index ? Colors[isDark ? 'dark' : 'light'].primary : 'rgba(255, 255, 255, 0.4)' }
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail Strip */}
        {product.images && product.images.length > 1 && (
          <View style={styles.thumbnailWrapperOuter}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
              style={styles.thumbnailScroll}
            >
              {product.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnailWrapper,
                    { borderColor: activeImageIndex === index ? Colors[isDark ? 'dark' : 'light'].primary : borderColor, backgroundColor: isDark ? '#0D0D0D' : '#F5F5F7' }
                  ]}
                  onPress={() => {
                    setActiveImageIndex(index);
                    imageScrollRef.current?.scrollTo({ x: index * width, animated: true });
                  }}
                >
                  <Image source={{ uri: img }} style={styles.thumbnail} contentFit="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.detailsContainer}>
          {/* Header Row: Title & Category */}
          <View style={styles.titleCategoryContainer}>
            <ThemedText style={styles.title}>{product.name}</ThemedText>
            <View style={[styles.categoryBadge, { backgroundColor: isDark ? '#222' : '#E6F4FE' }]}>
              <ThemedText style={[styles.categoryText, { color: isDark ? '#90CDF4' : '#4A90E2' }]}>
                {product.category?.name || 'Uncategorized'}
              </ThemedText>
            </View>
          </View>

          {/* Unit Price */}
          <View style={styles.priceRow}>
            <ThemedText style={[styles.priceText, { color: isDark ? '#FFF' : '#4A90E2' }]}>₦{parseFloat(product.price).toLocaleString()}</ThemedText>
            <ThemedText style={styles.priceUnitText}> / yard</ThemedText>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Preferred Color Input */}
          <View style={styles.colorInputContainer}>
            <ThemedText style={styles.sectionTitle}>Preferred Color</ThemedText>
            <View style={[styles.inputWrapper, { borderColor, backgroundColor: isDark ? '#2A2A2A' : '#EEEEEE' }]}>
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFF' : '#000' }]}
                placeholder="e.g., Sky Blue, Royal Blue (Required)"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={color}
                onChangeText={setColor}
              />
            </View>
          </View>

          {/* Description Section */}
          {!!product.description && (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Description</ThemedText>
                <ThemedText style={styles.description}>{product.description}</ThemedText>
              </View>
            </>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Yards Selection and Total Price Row */}
          <View style={styles.yardsPriceRow}>
            {/* Yards selector (Left Side) */}
            <View>
              <ThemedText style={styles.sectionTitle}>Select Yards</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2A2A2A' : '#EEEEEE', borderRadius: 8 }}>
                <TouchableOpacity 
                  onPress={() => setQuantity(Math.max(3, quantity - 1))}
                  disabled={quantity <= 3}
                  style={{ padding: 8, opacity: quantity <= 3 ? 0.3 : 1 }}
                >
                  <Ionicons name="remove" size={16} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
                <ThemedText style={{ paddingHorizontal: 12, fontSize: 14, fontWeight: '700' }}>{quantity} yards</ThemedText>
                <TouchableOpacity 
                  onPress={() => setQuantity(quantity + 1)}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="add" size={16} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Price (Right Side) */}
            <View style={styles.priceColumn}>
              <ThemedText style={styles.totalLabel}>Total Price</ThemedText>
              <ThemedText style={styles.totalPrice}>₦{(parseFloat(product.price) * quantity).toLocaleString()}</ThemedText>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.bottomActionRow}>
            <TouchableOpacity
              style={styles.whatsappOrderButton}
              onPress={handleWhatsAppPress}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            </TouchableOpacity>

            <AddToCartButton 
              onPress={handleAddToCart} 
              style={{ 
                flex: 1,
                backgroundColor: isAdded ? Colors[isDark ? 'dark' : 'light'].success : Colors[isDark ? 'dark' : 'light'].primary 
              }} 
              title={addingToCart ? "Adding..." : (isAdded ? "Go to Checkout" : "Add to Cart")}
              icon={isAdded ? "cart" : "add"}
            />
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
    paddingBottom: 80,
  },
  carouselWrapper: {
    position: 'relative',
    height: 300,
  },
  carousel: {
    height: 300,
  },
  image: {
    width: width,
    height: 300,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 20,
  },
  inactiveDot: {
    width: 8,
  },
  thumbnailWrapperOuter: {
    paddingHorizontal: 24,
    marginTop: 12,
  },
  thumbnailScroll: {
    marginVertical: 4,
  },
  thumbnailList: {
    gap: 12,
    flexDirection: 'row',
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 24,
  },
  colorInputContainer: {
    marginBottom: 0,
  },
  inputWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  titleCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    marginRight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
  },
  priceUnitText: {
    fontSize: 14,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.7,
  },
  yardsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 11,
    opacity: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
  },
  whatsappOrderButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
