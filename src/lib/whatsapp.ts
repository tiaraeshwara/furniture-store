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
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  totalAmount: number;
  items: CartItem[];
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(amount);

export function generateWhatsAppOrderLink(phone: string, order: OrderDetails) {
  const groupedItems = new Map<string, CartItem[]>();
  for (const item of order.items) {
    const group = groupedItems.get(item.productName) ?? [];
    group.push(item);
    groupedItems.set(item.productName, group);
  }

  const itemLines = [...groupedItems.entries()]
    .map(([productName, variants]) => {
      const variantLines = variants.map((item) => {
        const finish = [item.color, item.material].filter(Boolean).join(" / ");
        return `  - ${finish} × ${item.quantity} — LKR ${formatAmount(item.unitPrice * item.quantity)}`;
      });
      return `*${productName}*\n${variantLines.join("\n")}`;
    })
    .join("\n");

  const message = [
    `*FURNITURE ORDER ${order.orderId}*`,
    "",
    `*Customer:* ${order.customerName}`,
    `*Email:* ${order.customerEmail}`,
    `*Phone:* ${order.customerPhone}`,
    `*Delivery:* ${order.address}, ${order.city}`,
    "",
    "*Items:*",
    itemLines,
    "",
    `*Total: LKR ${formatAmount(order.totalAmount)}*`,
    "Payment method: WhatsApp order",
    "Please confirm availability, delivery fee, and payment instructions.",
  ].join("\n");

  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
}
