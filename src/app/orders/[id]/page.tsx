import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLkr } from "@/lib/store-types";

const statusLabel: Record<string, string> = {
  PENDING: "Awaiting payment confirmation",
  PAID: "Payment received",
  PROCESSING: "Being prepared",
  SHIPPED: "On its way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order) notFound();

  const returnedFromPayment = query.payment === "return";
  const cancelledAtGateway = query.payment === "cancelled";

  return (
    <main className="section-wrap checkout-page confirmation-page">
      <span className="confirmation-mark" aria-hidden="true">
        {order.status === "PAID" ? "✓" : "•"}
      </span>
      <p className="eyebrow">Order {order.id.slice(0, 8).toUpperCase()}</p>
      <h1 className="page-title">
        {order.status === "PAID" ? "Payment received." : "Order received."}
      </h1>
      <p className="confirmation-copy">
        {returnedFromPayment && order.status === "PENDING"
          ? "PayHere returned you to the store. We are waiting for the verified payment notification; this page may take a moment to update."
          : cancelledAtGateway && order.status === "PENDING"
            ? "The payment window was closed. If your payment was not completed, the order will be released after PayHere confirms cancellation."
            : `Current status: ${statusLabel[order.status] ?? order.status}.`}
      </p>
      <div className="confirmation-summary">
        {order.items.map((item) => (
          <div className="checkout-item" key={item.id}>
            <div>
              <strong>{item.variant.product.name}</strong>
              <span>
                {item.variant.color} · Qty {item.quantity}
              </span>
            </div>
            <strong>{formatLkr(item.unitPrice * item.quantity)}</strong>
          </div>
        ))}
        <div className="summary-row total-row">
          <span>Total</span>
          <strong>{formatLkr(order.totalAmount)}</strong>
        </div>
      </div>
      <Link className="continue-shopping" href="/">
        Back to the collection
      </Link>
    </main>
  );
}
