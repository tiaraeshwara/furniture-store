"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Boxes, ClipboardList, LogOut, Plus, Tag } from "lucide-react";
import { formatLkr } from "@/lib/store-types";

type AdminUser = { id: string; name: string; email: string };
type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  images: string[];
  dimensions: string | null;
  category: Category;
  variants: {
    id: string;
    color: string;
    material: string | null;
    stock: number;
    priceDelta: number;
  }[];
};
type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    variant: {
      color: string;
      material: string | null;
      product: { name: string };
    };
  }[];
};

const nextStatuses: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function availableOrderStatuses(order: Order) {
  if (order.paymentMethod === "PAYHERE" && order.status === "PENDING")
    return [];
  return nextStatuses[order.status] ?? [];
}

async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(body.error || "The request could not be completed.");
  return body;
}

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "orders" | "products" | "categories"
  >("orders");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  async function loadData() {
    const [categoryData, productData, orderData] = await Promise.all([
      adminRequest<{ categories: Category[] }>("/api/admin/categories"),
      adminRequest<{ products: Product[] }>("/api/admin/products"),
      adminRequest<{ orders: Order[] }>("/api/admin/orders"),
    ]);
    setCategories(categoryData.categories);
    setProducts(productData.products);
    setOrders(orderData.orders);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/auth/session")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as { user: AdminUser | null };
        return data.user;
      })
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setCheckingSession(false);
        if (currentUser)
          void loadData().catch((error: unknown) =>
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Unable to load admin data.",
            ),
          );
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await adminRequest<{ user: AdminUser }>(
        "/api/admin/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        },
      );
      setUser(result.user);
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setUser(null);
    setCategories([]);
    setProducts([]);
    setOrders([]);
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setErrorMessage("");
    const form = new FormData(formElement);
    try {
      await adminRequest("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
        }),
      });
      formElement.reset();
      await loadData();
      setNotice("Category created.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create category.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setErrorMessage("");
    const form = new FormData(formElement);
    const images = String(form.get("images") ?? "")
      .split(/\r?\n/)
      .map((image) => image.trim())
      .filter(Boolean);
    const material = String(form.get("material") ?? "").trim();
    try {
      await adminRequest("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          description: form.get("description"),
          basePrice: Number(form.get("basePrice")),
          categoryId: form.get("categoryId"),
          images,
          dimensions: form.get("dimensions") || undefined,
          variants: [
            {
              color: form.get("color"),
              material: material || undefined,
              stock: Number(form.get("stock")),
              priceDelta: Number(form.get("priceDelta") || 0),
            },
          ],
        }),
      });
      formElement.reset();
      await loadData();
      setNotice("Product created.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create product.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveStock(variantId: string, stock: number) {
    setErrorMessage("");
    try {
      await adminRequest("/api/admin/products", {
        method: "PATCH",
        body: JSON.stringify({ variantId, stock }),
      });
      await loadData();
      setNotice("Inventory updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update inventory.",
      );
    }
  }

  async function updateProduct(
    event: FormEvent<HTMLFormElement>,
    productId: string,
  ) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const images = String(form.get("images") ?? "")
      .split(/\r?\n/)
      .map((image) => image.trim())
      .filter(Boolean);
    setBusy(true);
    setErrorMessage("");
    try {
      await adminRequest("/api/admin/products", {
        method: "PATCH",
        body: JSON.stringify({
          productId,
          name: form.get("name"),
          slug: form.get("slug"),
          description: form.get("description"),
          basePrice: Number(form.get("basePrice")),
          categoryId: form.get("categoryId"),
          dimensions: form.get("dimensions") || null,
          images,
        }),
      });
      await loadData();
      setEditingProductId(null);
      setNotice("Product details updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update product.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(orderId: string, status: string) {
    setErrorMessage("");
    try {
      await adminRequest("/api/admin/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId, status }),
      });
      await loadData();
      setNotice("Order status updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update order.",
      );
    }
  }

  if (checkingSession) {
    return <main className="admin-loading">Opening the admin workspace…</main>;
  }

  if (!user) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-panel">
          <span className="admin-mark">f.</span>
          <p className="eyebrow">Fieldroom · Staff access</p>
          <h1>Welcome back.</h1>
          <p className="admin-login-description">
            Sign in to manage the collection and orders.
          </p>
          <form className="admin-form" onSubmit={login}>
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </label>
            {errorMessage && (
              <p className="form-error" role="alert">
                {errorMessage}
              </p>
            )}
            <button
              className="button button-dark"
              type="submit"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-mark">f.</span>
          <div>
            <strong>FIELDROOM</strong>
            <small>ADMINISTRATION</small>
          </div>
        </div>
        <div className="admin-user">
          <span>{user.name}</span>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={logout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>
      <div className="admin-content">
        <div className="admin-title-row">
          <div>
            <p className="eyebrow">Store operations</p>
            <h1>Good work, {user.name.split(" ")[0]}.</h1>
          </div>
          <span className="admin-date">
            {new Intl.DateTimeFormat("en-LK", { dateStyle: "full" }).format(
              new Date(),
            )}
          </span>
        </div>
        <div className="admin-stat-grid">
          <div className="admin-stat">
            <span>Open orders</span>
            <strong>
              {
                orders.filter(
                  (order) => !["DELIVERED", "CANCELLED"].includes(order.status),
                ).length
              }
            </strong>
            <small>Need attention</small>
          </div>
          <div className="admin-stat">
            <span>Products</span>
            <strong>{products.length}</strong>
            <small>In the collection</small>
          </div>
          <div className="admin-stat">
            <span>Low stock</span>
            <strong>
              {
                products
                  .flatMap((product) => product.variants)
                  .filter((variant) => variant.stock <= 2).length
              }
            </strong>
            <small>Variants at 2 or fewer</small>
          </div>
        </div>
        <nav className="admin-tabs" aria-label="Admin sections">
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            <ClipboardList size={16} /> Orders <span>{orders.length}</span>
          </button>
          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            <Boxes size={16} /> Products <span>{products.length}</span>
          </button>
          <button
            className={activeTab === "categories" ? "active" : ""}
            onClick={() => setActiveTab("categories")}
          >
            <Tag size={16} /> Categories <span>{categories.length}</span>
          </button>
        </nav>
        {(errorMessage || notice) && (
          <div
            className={errorMessage ? "admin-alert error" : "admin-alert"}
            role="status"
          >
            {errorMessage || notice}
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setNotice("");
              }}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {activeTab === "orders" && (
          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <h2>Orders</h2>
                <p>
                  Review customer details and move each order through
                  fulfillment.
                </p>
              </div>
            </div>
            {orders.length ? (
              <div className="admin-order-list">
                {orders.map((order) => (
                  <article className="admin-order" key={order.id}>
                    <div className="admin-order-heading">
                      <div>
                        <span className="admin-order-id">
                          {order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`status-label status-${order.status.toLowerCase()}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <time>
                        {new Intl.DateTimeFormat("en-LK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(order.createdAt))}
                      </time>
                    </div>
                    <div className="admin-order-body">
                      <div>
                        <h3>{order.customerName}</h3>
                        <p>
                          {order.customerEmail} · {order.customerPhone}
                        </p>
                        <p>
                          {order.address}, {order.city}
                        </p>
                      </div>
                      <strong>{formatLkr(order.totalAmount)}</strong>
                    </div>
                    <div className="admin-order-items">
                      {order.items.map((item) => (
                        <span key={item.id}>
                          {item.variant.product.name} · {item.variant.color} ×{" "}
                          {item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="admin-order-footer">
                      <span>
                        {order.paymentMethod} · {order.items.length} line
                        {order.items.length === 1 ? "" : "s"}
                      </span>
                      <label>
                        Update status
                        <select
                          value=""
                          disabled={!availableOrderStatuses(order).length}
                          onChange={(event) => {
                            if (event.target.value)
                              void updateOrder(order.id, event.target.value);
                          }}
                        >
                          <option value="">
                            {availableOrderStatuses(order).length
                              ? "Choose status"
                              : "No further actions"}
                          </option>
                          {availableOrderStatuses(order).map((status) => (
                            <option value={status} key={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-empty">No orders yet.</div>
            )}
          </section>
        )}

        {activeTab === "products" && (
          <section className="admin-section admin-products-layout">
            <div className="admin-form-panel">
              <h2>Add a product</h2>
              <p>
                New products are available in the storefront as soon as they are
                saved.
              </p>
              <form className="admin-form" onSubmit={createProduct}>
                <label>
                  Product name
                  <input
                    name="name"
                    required
                    minLength={2}
                    onChange={(event) => {
                      const slug = event.currentTarget.form?.elements.namedItem(
                        "slug",
                      ) as HTMLInputElement | null;
                      if (slug && !slug.dataset.edited)
                        slug.value = event.currentTarget.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "");
                    }}
                  />
                </label>
                <label>
                  URL slug
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    onInput={(event) => {
                      (event.currentTarget as HTMLInputElement).dataset.edited =
                        "true";
                    }}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="description"
                    rows={3}
                    required
                    minLength={10}
                  />
                </label>
                <div className="admin-form-grid">
                  <label>
                    Price (LKR)
                    <input
                      name="basePrice"
                      type="number"
                      min="1"
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    Category
                    <select name="categoryId" required defaultValue="">
                      <option value="" disabled>
                        Choose category
                      </option>
                      {categories.map((category) => (
                        <option value={category.id} key={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Finish
                    <input name="color" required />
                  </label>
                  <label>
                    Material
                    <input name="material" />
                  </label>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Starting stock
                    <input name="stock" type="number" min="0" required />
                  </label>
                  <label>
                    Price adjustment
                    <input
                      name="priceDelta"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                    />
                  </label>
                </div>
                <label>
                  Dimensions
                  <input name="dimensions" />
                </label>
                <label>
                  Image URLs <small>One URL per line</small>
                  <textarea name="images" rows={2} />
                </label>
                <button
                  className="button button-dark"
                  type="submit"
                  disabled={busy}
                >
                  <Plus size={16} /> Create product
                </button>
              </form>
            </div>
            <div className="admin-inventory">
              <div className="admin-section-heading">
                <div>
                  <h2>Inventory</h2>
                  <p>Adjust available stock by finish.</p>
                </div>
              </div>
              {products.map((product) => (
                <article className="inventory-product" key={product.id}>
                  <div className="inventory-product-title">
                    <strong>{product.name}</strong>
                    <span>
                      {product.category.name} · {formatLkr(product.basePrice)}
                    </span>
                    <button
                      type="button"
                      className="edit-product-button"
                      onClick={() =>
                        setEditingProductId(
                          editingProductId === product.id ? null : product.id,
                        )
                      }
                    >
                      {editingProductId === product.id
                        ? "Close"
                        : "Edit details"}
                    </button>
                  </div>
                  {editingProductId === product.id && (
                    <form
                      className="admin-form product-edit-form"
                      onSubmit={(event) =>
                        void updateProduct(event, product.id)
                      }
                    >
                      <label>
                        Name
                        <input
                          name="name"
                          defaultValue={product.name}
                          required
                          minLength={2}
                        />
                      </label>
                      <label>
                        URL slug
                        <input
                          name="slug"
                          defaultValue={product.slug}
                          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                          required
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          name="description"
                          defaultValue={product.description}
                          rows={3}
                          minLength={10}
                          required
                        />
                      </label>
                      <div className="admin-form-grid">
                        <label>
                          Price (LKR)
                          <input
                            name="basePrice"
                            type="number"
                            min="1"
                            step="0.01"
                            defaultValue={product.basePrice}
                            required
                          />
                        </label>
                        <label>
                          Category
                          <select
                            name="categoryId"
                            defaultValue={product.category.id}
                            required
                          >
                            {categories.map((category) => (
                              <option value={category.id} key={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label>
                        Dimensions
                        <input
                          name="dimensions"
                          defaultValue={product.dimensions ?? ""}
                        />
                      </label>
                      <label>
                        Image URLs <small>One URL per line</small>
                        <textarea
                          name="images"
                          rows={2}
                          defaultValue={product.images.join("\n")}
                        />
                      </label>
                      <button
                        className="button button-dark"
                        type="submit"
                        disabled={busy}
                      >
                        Save product details
                      </button>
                    </form>
                  )}
                  {product.variants.map((variant) => (
                    <InventoryRow
                      key={variant.id}
                      productName={product.name}
                      variant={variant}
                      onSave={saveStock}
                    />
                  ))}
                </article>
              ))}
              {!products.length && (
                <div className="admin-empty">
                  No products in the catalog yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "categories" && (
          <section className="admin-section admin-category-layout">
            <div className="admin-form-panel">
              <h2>Add a category</h2>
              <p>Categories organize the customer-facing collection.</p>
              <form className="admin-form" onSubmit={createCategory}>
                <label>
                  Category name
                  <input
                    name="name"
                    required
                    minLength={2}
                    onChange={(event) => {
                      const slug = event.currentTarget.form?.elements.namedItem(
                        "slug",
                      ) as HTMLInputElement | null;
                      if (slug && !slug.dataset.edited)
                        slug.value = event.currentTarget.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "");
                    }}
                  />
                </label>
                <label>
                  URL slug
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    onInput={(event) => {
                      (event.currentTarget as HTMLInputElement).dataset.edited =
                        "true";
                    }}
                  />
                </label>
                <button
                  className="button button-dark"
                  type="submit"
                  disabled={busy}
                >
                  <Plus size={16} /> Create category
                </button>
              </form>
            </div>
            <div className="admin-category-list">
              <h2>Categories</h2>
              {categories.map((category) => (
                <div className="admin-category-row" key={category.id}>
                  <span>{category.name}</span>
                  <code>/{category.slug}</code>
                </div>
              ))}
              {!categories.length && (
                <div className="admin-empty">No categories yet.</div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InventoryRow({
  productName,
  variant,
  onSave,
}: {
  productName: string;
  variant: Product["variants"][number];
  onSave: (variantId: string, stock: number) => Promise<void>;
}) {
  const [stock, setStock] = useState(String(variant.stock));
  return (
    <form
      className="inventory-row"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(variant.id, Number(stock));
      }}
    >
      <span>
        <strong>{variant.color}</strong>
        <small>{variant.material || productName}</small>
      </span>
      <label>
        <span className="sr-only">
          Stock count for {productName} {variant.color}
        </span>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
        />
      </label>
      <button type="submit">Save</button>
    </form>
  );
}
