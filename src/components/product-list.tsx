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
   FlatList,
   RefreshControl,
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
import { analytics } from "@/services/analytics";

const { width } = Dimensions.get("window");
const BRAND_BLUE = "#0284C7";

type Product = {
   id: number;
   name: string;
   price: string;
   is_featured?: boolean;
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

      const borderColor = isDark ? "#2C2C2E" : "#EFEFEF";
      const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";

      const [products, setProducts] = useState<Product[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());
      const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
      const [isFetchingMore, setIsFetchingMore] = useState(false);

      const trackedImpressions = React.useRef(new Set<number>());
      const onViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: any[] }) => {
         const newVisibleIds: number[] = [];
         viewableItems.forEach((item) => {
            const pId = Number(item.item?.id);
            if (pId && !trackedImpressions.current.has(pId)) {
               trackedImpressions.current.add(pId);
               newVisibleIds.push(pId);
            }
         });
         if (newVisibleIds.length > 0) {
            analytics.trackProductImpressions(newVisibleIds);
         }
      }).current;

      const viewabilityConfig = React.useRef({
         itemVisiblePercentThreshold: 50,
         minimumViewTime: 250,
      }).current;

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
            if (!url) {
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
            const response = await fetch(api.ENDPOINTS.ADD_TO_CART, {
               method: "POST",
               headers: api.getHeaders(token),
               body: JSON.stringify({ product_id: product.id, quantity: 1 }),
            });
            if (!response.ok) {
               const errText = await response.text();
               console.error("Failed to add to cart:", response.status, errText);
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
                     colors={[BRAND_BLUE]}
                  />
               ) : undefined
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListFooterComponent={
               isFetchingMore ? (
                  <ActivityIndicator
                     color={BRAND_BLUE}
                     style={{ marginVertical: 20 }}
                  />
               ) : (
                  <View style={{ height: 24 }} />
               )
            }
            ListEmptyComponent={
               loading ? (
                  <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center", width: "100%" }}>
                     <ActivityIndicator size="large" color={BRAND_BLUE} />
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
                           { backgroundColor: BRAND_BLUE },
                        ]}
                        onPress={() => {
                           fetchProducts();
                           if (props.onErrorRetry) {
                              props.onErrorRetry();
                           }
                        }}
                     >
                        <ThemedText style={styles.retryButtonText}>
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
            renderItem={({ item: product }) => {
               const isItemAdded = addedToCart.has(product.id);

               return (
                  <TouchableOpacity
                     activeOpacity={0.88}
                     style={[
                        styles.productCard,
                        {
                           borderColor,
                           backgroundColor: cardBg,
                           shadowColor: "#000",
                           shadowOpacity: isDark ? 0.35 : 0.05,
                        },
                     ]}
                     onPress={() => router.push(`/product/${product.id}` as any)}
                  >
                     {/* Product Image Box */}
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
                              transition={250}
                           />
                        )}
                        {product.is_featured && (
                           <View style={styles.featuredBadge}>
                              <Ionicons name="rocket" size={9} color="#FFF" />
                              <ThemedText style={styles.featuredBadgeText}>Boosted</ThemedText>
                           </View>
                        )}
                     </View>

                     {/* Product Details Info */}
                     <View style={styles.productInfo}>
                        {/* Clean, Visible Category Name */}
                        {product.category?.name ? (
                           <ThemedText
                              numberOfLines={1}
                              style={[
                                 styles.productCategory,
                                 { color: isDark ? "#38BDF8" : "#0284C7" },
                              ]}
                           >
                              {product.category.name.toUpperCase()}
                           </ThemedText>
                        ) : null}

                        <ThemedText
                           type="default"
                           style={styles.productName}
                           numberOfLines={2}
                        >
                           {product.name}
                        </ThemedText>

                        <View style={styles.productFooter}>
                           <ThemedText style={styles.productPrice}>
                              ₦{parseFloat(product.price).toLocaleString()}
                           </ThemedText>

                           <View style={styles.actionButtons}>
                              {/* Add to Cart Action Button - Fixed Blue / Green */}
                              <TouchableOpacity
                                 activeOpacity={0.8}
                                 style={[
                                    styles.addButton,
                                    {
                                       backgroundColor: isItemAdded ? "#10B981" : BRAND_BLUE,
                                    },
                                 ]}
                                 onPress={() => handleAddToCart(product)}
                              >
                                 <Ionicons
                                    name={isItemAdded ? "checkmark" : "add"}
                                    size={16}
                                    color="#FFF"
                                 />
                              </TouchableOpacity>
                           </View>
                        </View>
                     </View>
                  </TouchableOpacity>
               );
            }}
         />
      );
   },
);

const styles = StyleSheet.create({
   columnWrapper: {
      paddingHorizontal: 12,
      justifyContent: "space-between",
   },
   productCard: {
      width: (width - 32) / 2,
      marginBottom: 12,
      borderWidth: 1,
      borderRadius: 16,
      padding: 8,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
   },
   productImageContainer: {
      width: "100%",
      aspectRatio: 1.05,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 6,
      position: "relative",
   },
   productInfo: {
      gap: 2,
      justifyContent: "space-between",
      flex: 1,
   },
   productCategory: {
      fontSize: 10,
      fontWeight: "700",
      color: BRAND_BLUE,
      letterSpacing: 0.5,
   },
   productName: {
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
      height: 36, // Exactly 2 lines space
   },
   productFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
   },
   productPrice: {
      fontWeight: "800",
      fontSize: 16,
   },
   actionButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
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
      color: "#FFF",
   },
   featuredBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      backgroundColor: "#F59E0B",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 3,
      zIndex: 2,
   },
   featuredBadgeText: {
      color: "#FFF",
      fontSize: 9,
      fontWeight: "800",
      textTransform: "uppercase",
   },
});
