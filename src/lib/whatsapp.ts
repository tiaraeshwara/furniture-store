export interface CartItem {
  productName: string;
  color: string;
  material?: string;
  dimensions?: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDetails {
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  totalAmount: number;
  items: CartItem[];
}

export function generateWhatsAppOrderLink(
  phone: string,
  order: OrderDetails
): string {
  const itemLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.productName}* (${item.color}${item.material ? ` / ${item.material}` : ''})\n` +
        `   Qty: ${item.quantity} | Price: LKR ${(item.unitPrice * item.quantity).toLocaleString()}`
    )
    .join('\n');

  const message = `🛋️ *NEW FURNITURE ORDER* (#${order.orderId})\n\n` +
    `👤 *Customer Info:*\n` +
    `• Name: ${order.customerName}\n` +
    `• Phone: ${order.customerPhone}\n` +
    `• Address: ${order.address}, ${order.city}\n\n` +
    `📦 *Order Items:*\n${itemLines}\n\n` +
    `💰 *Total Amount:* LKR ${order.totalAmount.toLocaleString()}\n` +
    `💳 *Payment Method:* WhatsApp Direct\n\n` +
    `Please confirm availability and dispatch timelines.`;

  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
}