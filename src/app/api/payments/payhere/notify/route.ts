import { NextResponse } from "next/server";
import { z } from "zod";
import {
  formatPayHereAmount,
  verifyPayHereNotificationHash,
} from "@/lib/payhere";
import { prisma } from "@/lib/prisma";

const NotificationSchema = z.object({
  merchant_id: z.string().min(1),
  order_id: z.string().uuid(),
  payhere_amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  payhere_currency: z.string().length(3),
  status_code: z.string().regex(/^-?\d+$/),
  md5sig: z.string().regex(/^[a-f\d]{32}$/i),
  payment_id: z.string().optional(),
});

const response = (message: string, status = 200) =>
  new NextResponse(message, {
    status,
    headers: { "Content-Type": "text/plain" },
  });

export async function POST(request: Request) {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret)
    return response("Payment service unavailable", 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return response("Invalid notification", 400);
  }

  const fields = Object.fromEntries(
    [...form.entries()].map(([key, value]) => [
      key,
      typeof value === "string" ? value : "",
    ]),
  );
  const parsed = NotificationSchema.safeParse(fields);
  if (!parsed.success) return response("Invalid notification", 400);

  const notification = parsed.data;
  if (
    notification.merchant_id !== merchantId ||
    notification.payhere_currency !== "LKR"
  ) {
    return response("Invalid merchant or currency", 400);
  }
  if (
    !verifyPayHereNotificationHash(
      notification.merchant_id,
      notification.order_id,
      notification.payhere_amount,
      notification.payhere_currency,
      notification.status_code,
      notification.md5sig,
      merchantSecret,
    )
  ) {
    return response("Invalid signature", 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: notification.order_id },
    include: { items: true },
  });
  if (!order || order.paymentMethod !== "PAYHERE")
    return response("Order not found", 404);

  const amount = Number(notification.payhere_amount);
  if (
    !Number.isFinite(amount) ||
    formatPayHereAmount(amount) !== formatPayHereAmount(order.totalAmount)
  ) {
    return response("Amount mismatch", 400);
  }

  if (notification.status_code === "2") {
    await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING", paymentMethod: "PAYHERE" },
      data: { status: "PAID", payhereRef: notification.payment_id ?? null },
    });
    return response("OK");
  }

  if (notification.status_code === "-1" || notification.status_code === "-2") {
    await prisma.$transaction(async (transaction) => {
      const cancelled = await transaction.order.updateMany({
        where: { id: order.id, status: "PENDING", paymentMethod: "PAYHERE" },
        data: { status: "CANCELLED" },
      });
      if (cancelled.count === 1) {
        for (const item of order.items) {
          await transaction.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });
  }

  return response("OK");
}
