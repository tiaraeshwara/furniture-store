import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminApiError, authorizeAdmin } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const StatusSchema = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
const UpdateSchema = z.object({
  orderId: z.string().uuid(),
  status: StatusSchema,
});
const transitions: Record<
  z.infer<typeof StatusSchema>,
  z.infer<typeof StatusSchema>[]
> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

class OrderUpdateError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409,
  ) {
    super(message);
  }
}

export async function GET(request: NextRequest) {
  try {
    await authorizeAdmin(request);
    const orders = await prisma.order.findMany({
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authorizeAdmin(request);
    const parsed = UpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Choose a valid order and status." },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: parsed.data.orderId },
        include: { items: true },
      });
      if (!current) throw new OrderUpdateError("Order not found.", 404);
      const allowedTransitions =
        current.paymentMethod === "PAYHERE" && current.status === "PENDING"
          ? []
          : transitions[current.status];
      if (!allowedTransitions.includes(parsed.data.status)) {
        throw new OrderUpdateError(
          `Order cannot move from ${current.status} to ${parsed.data.status}.`,
          409,
        );
      }

      const changed = await transaction.order.updateMany({
        where: { id: current.id, status: current.status },
        data: { status: parsed.data.status },
      });
      if (changed.count !== 1)
        throw new OrderUpdateError(
          "Order changed. Refresh and try again.",
          409,
        );

      if (parsed.data.status === "CANCELLED") {
        for (const item of current.items) {
          await transaction.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      return transaction.order.findUnique({ where: { id: current.id } });
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof OrderUpdateError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return adminApiError(error);
  }
}
