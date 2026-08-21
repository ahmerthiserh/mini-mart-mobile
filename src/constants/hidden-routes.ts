export type HiddenRoute = {
  name: string;
  title: string;
  backHref: any;
};

export const HIDDEN_ROUTES: HiddenRoute[] = [
  // Orders
  {
    name: "(orders)/orders",
    title: "My Orders",
    backHref: "/menu",
  },
  {
    name: "(orders)/order-details",
    title: "Order Details",
    backHref: "/(orders)/orders",
  },
  {
    name: "(orders)/track-order",
    title: "Track Order",
    backHref: "/(orders)/order-details",
  },
  // Payment
  {
    name: "(payment)/payment",
    title: "Payment Methods",
    backHref: "/menu",
  },
  {
    name: "(payment)/edit-payment",
    title: "Edit Payment",
    backHref: "/(payment)/payment",
  },
  {
    name: "(payment)/add-payment",
    title: "Add Payment",
    backHref: "/(payment)/payment",
  },
  // Addresses
  {
    name: "(addresses)/addresses",
    title: "Shipping Addresses",
    backHref: "/menu",
  },
  {
    name: "(addresses)/add-address",
    title: "Add Address",
    backHref: "/(addresses)/addresses",
  },
  {
    name: "(addresses)/edit-address",
    title: "Edit Address",
    backHref: "/(addresses)/addresses",
  },
  // Settings
  {
    name: "(settings)/settings",
    title: "Settings",
    backHref: "/menu"
  },
  {
    name: "(settings)/personal-info",
    title: "Personal Info",
    backHref: "/(settings)/settings",
  },
  {
    name: "(settings)/help",
    title: "Help",
    backHref: "/menu"
  },
  {
    name: "(settings)/support",
    title: "Support",
    backHref: "/menu"
  },

  // Product
  { 
    name: "product/[id]", 
    title: "Product Details", 
    backHref: "/" 
  },
  
  // Checkout
  { name: "checkout", title: "Checkout", backHref: "/cart" },
  
  // Seller
  { name: "(seller)/select-type", title: "Select Business Type", backHref: "/menu" },
  { name: "(seller)/onboarding", title: "Store Registration", backHref: "/(seller)/select-type" },
  { name: "(seller)/verification", title: "Seller Verification", backHref: "/menu" },
  { name: "(seller)/buy-slots", title: "Buy Product Slots", backHref: "/(seller)/manage-store" },
  { name: "(seller)/add-product", title: "Add New Product", backHref: "/(seller)/manage-store" },
];
