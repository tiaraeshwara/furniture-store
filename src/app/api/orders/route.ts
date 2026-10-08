import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatPayHereAmount, generatePayHereHash } from "@/lib/payhere";
import { generateWhatsAppOrderLink } from "@/lib/whatsapp";

const CheckoutSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().min(7).max(24),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  paymentMethod: z.enum(["WHATSAPP", "PAYHERE"]),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
});

class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check your details and cart items.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { paymentMethod } = parsed.data;
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const whatsappPhone = process.env.WHATSAPP_BUSINESS_PHONE;

  if (paymentMethod === "PAYHERE" && (!merchantId || !merchantSecret)) {
    return NextResponse.json(
      { error: "PayHere sandbox is not configured." },
      { status: 503 },
    );
  }
  let payHereBaseUrl: string | undefined;
  if (paymentMethod === "PAYHERE") {
    const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
    if (!configuredBaseUrl && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "APP_BASE_URL must be configured for PayHere." },
        { status: 503 },
      );
    }
    try {
      const baseUrl = new URL(configuredBaseUrl || new URL(request.url).origin);
      if (
        baseUrl.username ||
        baseUrl.password ||
        (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:")
      ) {
        throw new Error("Invalid public application URL.");
      }
      payHereBaseUrl = baseUrl.origin;
    } catch {
      return NextResponse.json(
        { error: "APP_BASE_URL must be a valid public URL." },
        { status: 503 },
      );
    }
  }
  if (paymentMethod === "WHATSAPP" && !whatsappPhone) {
    return NextResponse.json(
      { error: "WhatsApp orders are not configured." },
      { status: 503 },
    );
  }

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  try {
    const order = await prisma.$transaction(async (transaction) => {
      const pricedItems: {
        variantId: string;
        quantity: number;
        unitPrice: number;
      }[] = [];
      let totalAmount = 0;

      for (const [variantId, quantity] of quantities) {
        const variant = await transaction.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });
        if (!variant)
          throw new CheckoutError(
            "A selected finish is no longer available.",
            409,
          );

        const stockUpdate = await transaction.productVariant.updateMany({
          where: { id: variantId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (stockUpdate.count !== 1) {
          throw new CheckoutError(
            `${variant.product.name} does not have enough stock.`,
            409,
          );
        }

        const unitPrice = variant.product.basePrice + variant.priceDelta;
        totalAmount += unitPrice * quantity;
        pricedItems.push({ variantId, quantity, unitPrice });
      }

      return transaction.order.create({
        data: {
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail,
          customerPhone: parsed.data.customerPhone,
          address: parsed.data.address,
          city: parsed.data.city,
          totalAmount,
          paymentMethod,
          items: { create: pricedItems },
        },
        include: {
          items: { include: { variant: { include: { product: true } } } },
        },
      });
    });

    if (paymentMethod === "WHATSAPP" && whatsappPhone) {
      const whatsappUrl = generateWhatsAppOrderLink(whatsappPhone, {
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        address: order.address,
        city: order.city,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({
          productName: item.variant.product.name,
          color: item.variant.color,
          material: item.variant.material ?? undefined,
          dimensions: item.variant.product.dimensions ?? undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      return NextResponse.json(
        { orderId: order.id, paymentMethod, whatsappUrl },
        { status: 201 },
      );
    }

    if (!merchantId || !merchantSecret) {
      throw new CheckoutError("PayHere configuration is unavailable.", 503);
    }
    const baseUrl = payHereBaseUrl;
    const fullName = order.customerName.trim().split(/\s+/);
    const firstName = fullName.shift() ?? order.customerName;
    const lastName = fullName.join(" ") || "Customer";
    const itemDescription = order.items
      .map(
        (item) =>
          `${item.variant.product.name} (${item.variant.color}) x ${item.quantity}`,
      )
      .join(", ")
      .slice(0, 200);
    const amount = formatPayHereAmount(order.totalAmount);
    const currency = "LKR";
    const fields: Record<string, string> = {
      merchant_id: merchantId,
      return_url: `${baseUrl}/orders/${order.id}?payment=return`,
      cancel_url: `${baseUrl}/orders/${order.id}?payment=cancelled`,
      notify_url: `${baseUrl}/api/payments/payhere/notify`,
      order_id: order.id,
      items: itemDescription,
      currency,
      amount,
      first_name: firstName,
      last_name: lastName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.address,
      city: order.city,
      country: "Sri Lanka",
      hash: generatePayHereHash(
        merchantId,
        order.id,
        order.totalAmount,
        currency,
        merchantSecret,
      ),
    };
    const payhereUrl =
      process.env.PAYHERE_MODE === "live"
        ? "https://www.payhere.lk/pay/checkout"
        : "https://sandbox.payhere.lk/pay/checkout";
    return NextResponse.json(
      {
        orderId: order.id,
        paymentMethod,
        payhere: { url: payhereUrl, fields },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Unable to place your order right now." },
      { status: 500 },
    );
  }
}
