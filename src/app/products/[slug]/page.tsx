import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/lib/store-types";
import ProductActions from "./product-actions";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, variants: true },
  });

  if (!product) notFound();

  const firstImage = product.images[0];
  const productData = product as ProductCardData;

  return (
    <main className="detail-page section-wrap">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Collection</Link>
        <span>/</span>
        <Link href={`/?category=${product.category.slug}`}>
          {product.category.name}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <div className="detail-layout">
        <div className="detail-image-wrap">
          {firstImage ? (
            <Image
              className="detail-image"
              src={firstImage}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 760px) 100vw, 58vw"
              priority
            />
          ) : (
            <div className="product-image-placeholder detail-placeholder" />
          )}
        </div>
        <section className="detail-copy">
          <p className="eyebrow">{product.category.name}</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>
          {product.dimensions && (
            <dl className="spec-row">
              <dt>Dimensions</dt>
              <dd>{product.dimensions}</dd>
            </dl>
          )}
          <dl className="spec-row">
            <dt>Available finishes</dt>
            <dd>{product.variants.length}</dd>
          </dl>
          <ProductActions product={productData} />
        </section>
      </div>
    </main>
  );
}
