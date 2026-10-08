export type ProductVariantData = {
  id: string;
  color: string;
  material: string | null;
  stock: number;
  priceDelta: number;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  images: string[];
  dimensions: string | null;
  category: { name: string; slug: string };
  variants: ProductVariantData[];
};

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  color: string;
  material: string | null;
  dimensions: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
};

export function formatLkr(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(amount);
}
