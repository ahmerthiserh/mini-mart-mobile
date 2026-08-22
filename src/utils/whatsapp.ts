/**
 * Plain-Text Formatting Utility for WhatsApp Order & Inquiry Messages
 */

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
  const itemLines = items.map((item, index) => {
    const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const itemTotal = unitPrice * item.quantity;
    storeSubtotal += itemTotal;

    return [
      `  ${index + 1}. *${item.name}*`,
      `      ${item.quantity} x ₦${unitPrice.toLocaleString()} = ₦${itemTotal.toLocaleString()}`,
    ].join('\n');
  });

  const parts = [
    `*ORDER REQUEST*`,
    ``,
    `Store: ${storeName}`,
    customerName ? `Customer: ${customerName}` : null,
    ``,
    `*Items:*`,
    ...itemLines,
    ``,
    `*Total: ₦${storeSubtotal.toLocaleString()}*`,
    ``,
    `Hello, please confirm availability and placement of this order. Thank you.`,
  ];

  return parts.filter((line) => line !== null).join('\n');
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

  const parts = [
    `*PRODUCT INQUIRY*`,
    ``,
    `Product: ${productName}`,
    `Price: ₦${unitPrice.toLocaleString()}`,
    `Quantity: ${quantity}`,
    `*Total: ₦${totalPrice.toLocaleString()}*`,
    ``,
    customerName ? `Customer: ${customerName}\n` : null,
    `Hello, I am interested in purchasing this product. Is it currently available for delivery? Thank you.`,
  ];

  return parts.filter((line) => line !== null).join('\n');
}
