"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatLkr, type ProductCardData } from "@/lib/store-types";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const variant = product.variants.find((item) => item.stock > 0);
  const image = product.images[0];

  return (
    <article className="product-card">
      <Link className="product-image-link" href={`/products/${product.slug}`}>
        <div className="product-image-wrap">
          {image ? (
            <Image
              className="product-image"
              src={image}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 650px) 45vw, 25vw"
            />
          ) : (
            <div
              className="product-image-placeholder"
              aria-label="No product image"
            />
          )}
          <span className="product-category">{product.category.name}</span>
          <span className="product-open" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </Link>
      <div className="product-meta">
        <div>
          <h3>
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <p>
            {product.variants.length
              ? `${product.variants.length} finish${product.variants.length === 1 ? "" : "es"}`
              : "Made to order"}
          </p>
        </div>
        <div className="product-price-block">
          <strong>
            {formatLkr(product.basePrice + (variant?.priceDelta ?? 0))}
          </strong>
          <button
            className="quick-add"
            type="button"
            aria-label={
              variant
                ? `Add ${product.name} to bag`
                : `${product.name} is sold out`
            }
            disabled={!variant}
            onClick={() =>
              variant &&
              addItem({
                variantId: variant.id,
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: image ?? "",
                color: variant.color,
                material: variant.material,
                dimensions: product.dimensions,
                unitPrice: product.basePrice + variant.priceDelta,
                quantity: 1,
                stock: variant.stock,
              })
            }
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      {!variant && <p className="stock-note">Currently unavailable</p>}
    </article>
  );
}
