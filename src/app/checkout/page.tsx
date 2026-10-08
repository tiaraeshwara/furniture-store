"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatLkr } from "@/lib/store-types";

type OrderResult = {
  orderId: string;
  paymentMethod: "WHATSAPP" | "PAYHERE";
  whatsappUrl?: string;
  payhere?: { url: string; fields: Record<string, string> };
};

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"WHATSAPP" | "PAYHERE">(
    "WHATSAPP",
  );

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    const form = new FormData(event.currentTarget);
    const customer = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customer,
          paymentMethod,
          items: items.map(({ variantId, quantity }) => ({
            variantId,
            quantity,
          })),
        }),
      });
      const result = (await response.json()) as OrderResult | { error: string };
      if (!response.ok)
        throw new Error(
          "error" in result ? result.error : "Unable to place this order.",
        );
      const successfulOrder = result as OrderResult;
      if (
        successfulOrder.paymentMethod === "PAYHERE" &&
        successfulOrder.payhere
      ) {
        clearCart();
        const form = document.createElement("form");
        form.method = "POST";
        form.action = successfulOrder.payhere.url;
        for (const [name, value] of Object.entries(
          successfulOrder.payhere.fields,
        )) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }
      if (!successfulOrder.whatsappUrl)
        throw new Error("WhatsApp checkout is not configured.");
      setOrder(successfulOrder);
      clearCart();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to place this order. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <main className="section-wrap checkout-page confirmation-page">
        <span className="confirmation-mark" aria-hidden="true">
          ✓
        </span>
        <p className="eyebrow">
          Order {order.orderId.slice(0, 8).toUpperCase()}
        </p>
        <h1 className="page-title">One last step.</h1>
        <p className="confirmation-copy">
          Your order is saved. Send the details to our team on WhatsApp so we
          can confirm availability and delivery.
        </p>
        <a
          className="button button-dark"
          href={order.whatsappUrl ?? "/"}
          target="_blank"
          rel="noreferrer"
        >
          Continue on WhatsApp <ArrowUpRight size={17} />
        </a>
        <Link className="continue-shopping" href="/">
          Back to the collection
        </Link>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="section-wrap checkout-page">
        <p className="eyebrow">Checkout</p>
        <h1 className="page-title">Your bag is empty.</h1>
        <Link className="button button-dark" href="/#collection">
          Browse the collection <ArrowUpRight size={17} />
        </Link>
      </main>
    );
  }

  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );

  return (
    <main className="section-wrap checkout-page">
      <Link className="back-link" href="/cart">
        <ArrowLeft size={15} /> Back to bag
      </Link>
      <p className="eyebrow">Checkout · Secure order</p>
      <h1 className="page-title">
        Where should we
        <br />
        bring it?
      </h1>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={placeOrder}>
          <h2>Your details</h2>
          <label>
            Full name
            <input
              name="customerName"
              autoComplete="name"
              minLength={2}
              required
            />
          </label>
          <div className="form-two-col">
            <label>
              Email address
              <input
                name="customerEmail"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Phone number
              <input
                name="customerPhone"
                type="tel"
                autoComplete="tel"
                minLength={7}
                required
              />
            </label>
          </div>
          <label>
            Delivery address
            <textarea
              name="address"
              autoComplete="street-address"
              rows={3}
              required
            />
          </label>
          <label>
            City
            <input name="city" autoComplete="address-level2" required />
          </label>
          <fieldset className="payment-selector">
            <legend>Payment method</legend>
            <label
              className={
                paymentMethod === "PAYHERE"
                  ? "payment-choice selected"
                  : "payment-choice"
              }
            >
              <input
                type="radio"
                name="payment-choice"
                value="PAYHERE"
                checked={paymentMethod === "PAYHERE"}
                onChange={() => setPaymentMethod("PAYHERE")}
              />
              <span>
                <strong>PayHere</strong>
                <small>Pay securely online</small>
              </span>
            </label>
            <label
              className={
                paymentMethod === "WHATSAPP"
                  ? "payment-choice selected"
                  : "payment-choice"
              }
            >
              <input
                type="radio"
                name="payment-choice"
                value="WHATSAPP"
                checked={paymentMethod === "WHATSAPP"}
                onChange={() => setPaymentMethod("WHATSAPP")}
              />
              <span>
                <strong>Order via WhatsApp</strong>
                <small>Send your order to our team</small>
              </span>
            </label>
          </fieldset>
          {errorMessage && (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            className="button button-dark checkout-button"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Preparing checkout…"
              : paymentMethod === "PAYHERE"
                ? "Continue to PayHere"
                : "Place WhatsApp order"}{" "}
            <ArrowUpRight size={17} />
          </button>
          <p className="checkout-terms">
            {paymentMethod === "PAYHERE"
              ? "You will be redirected to PayHere to complete payment."
              : "We will send your order details to WhatsApp for confirmation."}
          </p>
        </form>
        <aside className="order-summary checkout-summary">
          <h2>
            Your pieces <span>{items.length}</span>
          </h2>
          {items.map((item) => (
            <div className="checkout-item" key={item.variantId}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.color} · Qty {item.quantity}
                </span>
              </div>
              <strong>{formatLkr(item.unitPrice * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-row total-row">
            <span>Subtotal</span>
            <strong>{formatLkr(subtotal)}</strong>
          </div>
          <p className="summary-note">
            Delivery cost is confirmed with our team after your order.
          </p>
        </aside>
      </div>
    </main>
  );
}
