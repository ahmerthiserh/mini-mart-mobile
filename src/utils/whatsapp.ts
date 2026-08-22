/**
 * Configurable Icons & Formatting Utility for WhatsApp Order & Inquiry Messages
 */

export const WA_ICONS = {
  CART: '🛒',
  STORE: '🏪',
  PACKAGE: '📦',
  PRICE_TAG: '🏷️',
  QUANTITY: '🔢',
  TOTAL: '💰',
  SHIPPING: '🚚',
  CUSTOMER: '👤',
  CHAT: '💬',
  BULLET: '  •',
  TREE_NODE: '    └',
  DIVIDER: '━━━━━━━━━━━━━━━━━━━━━━',
};

export type CartItemForWA = {
  name: string;
  price: string | number;
  quantity: number;
};

export function formatCartOrderWhatsAppMessage(params: {
  storeName: string;
  items: CartItemForWA[];
  customerName?: string | null;
}): string {
  const { storeName, items, customerName } = params;

  let storeSubtotal = 0;
  const itemBlocks = items.map((item) => {
    const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const itemTotal = unitPrice * item.quantity;
    storeSubtotal += itemTotal;

    return `${WA_ICONS.BULLET} *${item.name}*\n${WA_ICONS.TREE_NODE} Qty: ${item.quantity} × ₦${unitPrice.toLocaleString()} = *₦${itemTotal.toLocaleString()}*`;
  });

  const lines = [
    `${WA_ICONS.CART} *MINI-MART ORDER REQUEST*`,
    WA_ICONS.DIVIDER,
    `${WA_ICONS.STORE} *Store:* ${storeName}`,
    '',
    `${WA_ICONS.PACKAGE} *ORDER ITEMS:*`,
    ...itemBlocks,
    WA_ICONS.DIVIDER,
    `${WA_ICONS.TOTAL} *Subtotal:* ₦${storeSubtotal.toLocaleString()}`,
  ];

  if (customerName) {
    lines.push(`${WA_ICONS.CUSTOMER} *Customer:* ${customerName}`);
  }

  lines.push(WA_ICONS.DIVIDER);
  lines.push(`${WA_ICONS.CHAT} *Hello! Please confirm item availability and order placement.*`);

  return lines.join('\n');
}

export function formatProductInquiryWhatsAppMessage(params: {
  productName: string;
  price: string | number;
  quantity: number;
  customerName?: string | null;
}): string {
  const { productName, price, quantity, customerName } = params;
  const unitPrice = typeof price === 'string' ? parseFloat(price) : price;
  const totalPrice = unitPrice * quantity;

  const lines = [
    `${WA_ICONS.CART} *PRODUCT INQUIRY — MINI-MART*`,
    WA_ICONS.DIVIDER,
    `${WA_ICONS.PACKAGE} *Product:* ${productName}`,
    `${WA_ICONS.PRICE_TAG} *Unit Price:* ₦${unitPrice.toLocaleString()}`,
    `${WA_ICONS.QUANTITY} *Quantity:* ${quantity}`,
    `${WA_ICONS.TOTAL} *Total Amount:* *₦${totalPrice.toLocaleString()}*`,
  ];

  if (customerName) {
    lines.push(`${WA_ICONS.CUSTOMER} *Customer:* ${customerName}`);
  }

  lines.push(WA_ICONS.DIVIDER);
  lines.push(`${WA_ICONS.CHAT} *Hello! I am interested in purchasing this product. Is it currently in stock for delivery?*`);

  return lines.join('\n');
}
