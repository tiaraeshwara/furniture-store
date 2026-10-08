"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatLkr, type ProductCardData } from "@/lib/store-types";

export default function ProductActions({
  product,
}: {
  product: ProductCardData;
}) {
  const availableVariants = product.variants.filter(
    (variant) => variant.stock > 0,
  );
  const [selectedId, setSelectedId] = useState(availableVariants[0]?.id ?? "");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const selected = availableVariants.find(
    (variant) => variant.id === selectedId,
  );

  function addToBag() {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      color: selected.color,
      material: selected.material,
      dimensions: product.dimensions,
      unitPrice: product.basePrice + selected.priceDelta,
      quantity: 1,
      stock: selected.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="product-actions">
      <label htmlFor="finish-select">Finish</label>
      <select
        id="finish-select"
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        disabled={!availableVariants.length}
      >
        {availableVariants.map((variant) => (
          <option key={variant.id} value={variant.id}>
            {variant.color}
            {variant.material ? ` · ${variant.material}` : ""} · {variant.stock}{" "}
            available
          </option>
        ))}
        {!availableVariants.length && (
          <option value="">Currently unavailable</option>
        )}
      </select>
      {selected && (
        <p className="detail-price">
          {formatLkr(product.basePrice + selected.priceDelta)}
        </p>
      )}
      <button
        className="button button-dark add-to-bag"
        type="button"
        onClick={addToBag}
        disabled={!selected}
      >
        {added
          ? "Added to bag"
          : selected
            ? "Add to bag"
            : "Currently unavailable"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="stock-hint">
        {selected
          ? `${selected.stock} available in this finish`
          : "Check back soon for availability."}
      </p>
    </div>
  );
}
