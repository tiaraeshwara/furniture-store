import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/lib/store-types";
import ProductCard from "@/components/product-card";

type HomeProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { q = "", category = "" } = await searchParams;
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Made for the way you live</p>
          <h1>
            Room to
            <br />
            feel at home.
          </h1>
          <p className="hero-description">
            Thoughtful furniture, honest materials, and pieces that make the
            everyday feel considered.
          </p>
          <a className="button button-light" href="#collection">
            Explore the collection <span aria-hidden="true">↘</span>
          </a>
          <div className="hero-note">
            <span className="hero-note-line" /> Considered design. Lasting
            comfort.
          </div>
        </div>
        <div
          className="hero-image"
          role="img"
          aria-label="Sunlit contemporary living room with warm timber furniture"
        />
        <div className="hero-index">
          01 <span /> 04
        </div>
      </section>

      <section className="collection section-wrap" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your next favourite</p>
            <h2>The collection</h2>
          </div>
          <form className="search-form" action="/">
            <label className="sr-only" htmlFor="product-search">
              Search furniture
            </label>
            <input
              id="product-search"
              type="search"
              name="q"
              placeholder="Search the collection"
              defaultValue={q}
            />
            {category && (
              <input type="hidden" name="category" value={category} />
            )}
            <button type="submit" aria-label="Search">
              ⌕
            </button>
          </form>
        </div>

        <nav className="category-nav" aria-label="Shop by category">
          <Link
            className={!category ? "category-link active" : "category-link"}
            href={q ? `/?q=${encodeURIComponent(q)}` : "/"}
          >
            All pieces
          </Link>
          {categories.map((item) => {
            const href = `/?category=${encodeURIComponent(item.slug)}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
            return (
              <Link
                key={item.id}
                className={
                  category === item.slug
                    ? "category-link active"
                    : "category-link"
                }
                href={href}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as ProductCardData}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden="true">
              ✳
            </span>
            <h3>
              {q || category
                ? "No pieces found"
                : "The collection is taking shape"}
            </h3>
            <p>
              {q || category
                ? "Try another search or browse everything."
                : "New pieces will appear here as soon as they are added."}
            </p>
            {(q || category) && (
              <Link className="text-link" href="/">
                Browse all pieces <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="service-band">
        <div>
          <span className="service-number">01</span>
          <h3>Made to be lived in</h3>
          <p>Practical details, quality materials, and comfort that lasts.</p>
        </div>
        <div>
          <span className="service-number">02</span>
          <h3>Considered materials</h3>
          <p>Natural finishes and tactile textures chosen with care.</p>
        </div>
        <div>
          <span className="service-number">03</span>
          <h3>Here to help</h3>
          <p>Talk with our team about sizing, finishes, and delivery.</p>
        </div>
      </section>
    </main>
  );
}
