"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatLkr } from "@/lib/store-types";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );

  if (!items.length) {
    return (
      <main className="section-wrap cart-page">
        <p className="eyebrow">Your selection</p>
        <h1 className="page-title">Your bag is quiet.</h1>
        <p className="empty-cart-copy">
          Find a piece that feels right for your space.
        </p>
        <Link className="button button-dark" href="/#collection">
          Browse the collection <span aria-hidden="true">↗</span>
        </Link>
      </main>
    );
  }

  return (
    <main className="section-wrap cart-page">
      <p className="eyebrow">Your selection</p>
      <h1 className="page-title">
        Your bag<span className="title-count">({items.length})</span>
      </h1>
      <div className="cart-layout">
        <div className="cart-lines">
          {items.map((item) => (
            <article className="cart-line" key={item.variantId}>
              <Link className="cart-line-image" href={`/products/${item.slug}`}>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    unoptimized
                    sizes="120px"
                  />
                ) : (
                  <div className="product-image-placeholder" />
                )}
              </Link>
              <div className="cart-line-info">
                <h2>
                  <Link href={`/products/${item.slug}`}>{item.name}</Link>
                </h2>
                <p>
                  {item.color}
                  {item.material ? ` · ${item.material}` : ""}
                </p>
                {item.dimensions && <p>{item.dimensions}</p>}
                <div
                  className="quantity-control"
                  aria-label={`Quantity for ${item.name}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity - 1)
                    }
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity + 1)
                    }
                    aria-label="Increase quantity"
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="cart-line-end">
                <strong>{formatLkr(item.unitPrice * item.quantity)}</strong>
                <button
                  className="remove-item"
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeItem(item.variantId)}
                >
                  <X size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <aside className="order-summary">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatLkr(subtotal)}</strong>
          </div>
          <p className="summary-note">
            Delivery details and final availability are confirmed with our team.
          </p>
          <Link className="button button-dark checkout-button" href="/checkout">
            Continue to checkout <span aria-hidden="true">↗</span>
          </Link>
          <Link className="continue-shopping" href="/#collection">
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}
