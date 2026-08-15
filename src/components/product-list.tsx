import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useColorScheme,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { PlaceholderGlow } from "@/components/placeholder-glow";
import api from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

type Product = {
  id: number;
  name: string;
  price: string;
  category?: { name: string };
  image?: string;
  whatsapp_number?: string;
  whatsapp_url?: string;
};

export interface ProductListRef {
  refresh: (isRefresh?: boolean) => Promise<void>;
}

export interface ProductListProps {
  categoryId?: number | null;
  onErrorRetry?: () => void;
  ListHeaderComponent?: React.ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadingStateChange?: (loading: boolean) => void;
}

const productCache: Record<string, Product[]> = {};

export const ProductList = forwardRef<ProductListRef, ProductListProps>(
  (props, ref) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const router = useRouter();
    const { token } = useAuth();
    const { refreshCart } = useCart();
    const { showToast } = useToast();

    const borderColor = isDark ? "#333" : "#EAEAEA";
    const cardBg = isDark ? "#141414" : "#FFFFFF";

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    useImperativeHandle(ref, () => ({
      refresh: (isRefresh = true) => fetchProducts(isRefresh),
    }));

    useEffect(() => {
      fetchProducts();
    }, [props.categoryId]);

    const fetchProducts = async (isRefresh = false, url?: string) => {
      const catQuery = props.categoryId
        ? `category_id=${props.categoryId}`
        : "";
      const cacheKey = catQuery || "all";

      if (!url) {
        if (!isRefresh && productCache[cacheKey]) {
          setProducts(productCache[cacheKey]);
          setLoading(false);
          props.onLoadingStateChange?.(false);
        } else {
          setProducts([]);
          setLoading(true);
          props.onLoadingStateChange?.(true);
        }
      } else {
        setIsFetchingMore(true);
      }

      setError(null);
      try {
        const fetchUrl =
          url || `${api.ENDPOINTS.PRODUCTS}${catQuery ? "?" + catQuery : ""}`;
        const response = await fetch(fetchUrl);

        if (!response.ok) {
          if (!url && !productCache[cacheKey]) {
            console.error("Server error:", await response.text());
            setError("Server error. Please try again.");
          }
          return;
        }

        const data = await response.json();

        let fetchedProducts = [];
        if (Array.isArray(data)) {
          fetchedProducts = data;
          setNextPageUrl(null);
        } else if (data.data && Array.isArray(data.data)) {
          fetchedProducts = data.data;
          setNextPageUrl(data.next_page_url || null);
        }

        if (!url) {
          productCache[cacheKey] = fetchedProducts;
          setProducts(fetchedProducts);
        } else {
          setProducts((prev) => [...prev, ...fetchedProducts]);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
        if (!url && !productCache[cacheKey]) {
          setError("Connection failed. Please check if the server is running.");
        }
      } finally {
        if (!url && !isRefresh) {
          setLoading(false);
          props.onLoadingStateChange?.(false);
        }
        setIsFetchingMore(false);
      }
    };

    const handleLoadMore = () => {
      if (nextPageUrl && !isFetchingMore) {
        fetchProducts(false, nextPageUrl);
      }
    };

    const handleAddToCart = async (product: Product) => {
      if (addedToCart.has(product.id)) {
        router.push("/cart");
        return;
      }

      try {
        const response = await fetch(`${api.ENDPOINTS.CART}/add`, {
          method: "POST",
          headers: api.getHeaders(token),
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        });
        if (!response.ok) {
          console.error("Failed to add to cart");
          showToast("Could not add item to cart", "error");
        } else {
          setAddedToCart((prev) => {
            const newSet = new Set(prev);
            newSet.add(product.id);
            return newSet;
          });
          refreshCart();
          showToast(`${product.name} added to cart`, "success");
        }
      } catch (error) {
        console.error("Error adding to cart", error);
        showToast("Network error", "error");
      }
    };

    const handleWhatsAppPress = (product: Product) => {
      const message = `Hello! I am interested in buying: ${product.name} (₦${parseFloat(product.price).toLocaleString()})`;
      const encodedMsg = encodeURIComponent(message);

      let url = "";
      if (product.whatsapp_number) {
        const cleanNum = product.whatsapp_number.replace(/[^0-9]/g, "");
        url = `https://wa.me/${cleanNum}?text=${encodedMsg}`;
      } else if (product.whatsapp_url) {
        url = product.whatsapp_url.includes("?")
          ? `${product.whatsapp_url}&text=${encodedMsg}`
          : `${product.whatsapp_url}?text=${encodedMsg}`;
      } else {
        showToast("Merchant WhatsApp number not available", "error");
        return;
      }

      Linking.openURL(url).catch(() => {
        showToast("Could not open WhatsApp", "error");
      });
    };

    return (
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={props.ListHeaderComponent}
        refreshControl={
          props.onRefresh ? (
            <RefreshControl
              refreshing={props.refreshing || false}
              onRefresh={props.onRefresh}
              tintColor={isDark ? "#fff" : "#000"}
              colors={["#000"]}
            />
          ) : undefined
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <ActivityIndicator
              color={isDark ? "#fff" : "#000"}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <View style={{ height: 20 }} />
          )
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center", width: "100%" }}>
              <ActivityIndicator size="large" color={Colors[isDark ? "dark" : "light"].primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={48}
                color="#FFA62B"
                style={styles.errorIcon}
              />
              <ThemedText style={styles.errorTitle}>
                Connection Failed
              </ThemedText>
              <ThemedText style={styles.errorSubtitle}>
                Unable to connect to the server at{" "}
                {api.BASE_URL.replace("/api", "")}. Please check your connection
                or server status.
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: Colors[isDark ? "dark" : "light"].primary,
                  },
                ]}
                onPress={() => {
                  fetchProducts();
                  if (props.onErrorRetry) {
                    props.onErrorRetry();
                  }
                }}
              >
                <ThemedText
                  style={[
                    styles.retryButtonText,
                    { color: isDark ? "#000" : "#fff" },
                  ]}
                >
                  Try Again
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons
                name="cube-outline"
                size={48}
                color="#A0A0A0"
                style={styles.errorIcon}
              />
              <ThemedText style={styles.errorTitle}>
                No Products Found
              </ThemedText>
              <ThemedText style={styles.errorSubtitle}>
                There are currently no products available in this category.
              </ThemedText>
            </View>
          )
        }
        renderItem={({ item: product }) => (
          <TouchableOpacity
            style={[
              styles.productCard,
              { borderColor, backgroundColor: cardBg },
            ]}
            onPress={() => router.push(`/product/${product.id}` as any)}
          >
            <View style={styles.productImageContainer}>
              <PlaceholderGlow
                style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                borderRadius={12}
              />
              {product.image && (
                <Image
                  source={{ uri: product.image }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                  contentFit="cover"
                  transition={200}
                />
              )}
            </View>

            <View style={styles.productInfo}>
              <ThemedText style={styles.productCategory}>
                {product.category?.name || "Uncategorized"}
              </ThemedText>
              <ThemedText
                type="default"
                style={styles.productName}
                numberOfLines={1}
              >
                {product.name}
              </ThemedText>
              <View style={styles.productFooter}>
                <ThemedText style={styles.productPrice}>
                  ₦{parseFloat(product.price).toLocaleString()}
                </ThemedText>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={() => handleWhatsAppPress(product)}
                  >
                    <Ionicons name="logo-whatsapp" size={17} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      {
                        backgroundColor:
                          Colors[isDark ? "dark" : "light"].primary,
                      },
                    ]}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={Colors[isDark ? "dark" : "light"].background}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  },
);

const styles = StyleSheet.create({
  columnWrapper: {
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  productCard: {
    width: (width - 34) / 2, // 2 columns with tight spacing
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 6,
  },
  productImageContainer: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 6,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    gap: 2,
  },
  productCategory: {
    fontSize: 11,
    opacity: 0.6,
  },
  productName: {
    fontSize: 13,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  productPrice: {
    fontWeight: "700",
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  whatsappButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    width: "100%",
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
