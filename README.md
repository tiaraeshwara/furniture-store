# Fieldroom Furniture Store

Responsive furniture e-commerce application built for the Furniture Store assessment. It includes a customer storefront, guest checkout with PayHere Sandbox or WhatsApp, persistent order/inventory data, and a protected admin workspace.

## Technology

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- PostgreSQL with Prisma ORM
- Zod request validation, Framer Motion animations, and Lucide icons
- bcryptjs password hashing and signed JWT admin sessions
- PayHere Sandbox checkout and signed server-to-server notifications
- WhatsApp click-to-chat order handoff

## Architecture

The application is a single Next.js deployment. The App Router owns storefront, checkout, order confirmation, and admin pages, as well as the JSON API route handlers. Server-rendered pages and route handlers use a shared Prisma Client to read and mutate PostgreSQL. Interactive cart, checkout, product actions, and admin controls run in React client components.

The browser cart is persisted in `localStorage`; it contains variant identifiers and display data, not trusted prices or stock. At checkout, `POST /api/orders` reloads variants from the database, calculates prices, reserves stock, and creates the order in a database transaction. Payment integrations then hand off to PayHere or WhatsApp. The PayHere notification route verifies the provider callback before changing payment state. Admin API routes authorize each request and manage catalog, inventory, and order lifecycle.

## Local Setup

Use Node.js 20.19 or later and a PostgreSQL database. Copy `.env.example` to `.env`, then set real values for the variables below. Never commit `.env` or paste production secrets into source control.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
APP_BASE_URL="http://localhost:3000"
JWT_SECRET="replace-with-a-32-character-or-longer-random-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="a-unique-password-at-least-12-characters"
ADMIN_NAME="Store Admin"
WHATSAPP_BUSINESS_PHONE="94771234567"
PAYHERE_MODE="sandbox"
PAYHERE_MERCHANT_ID="your-sandbox-merchant-id"
PAYHERE_MERCHANT_SECRET="your-sandbox-merchant-secret"
```

Apply migrations, seed demo data (and the admin user when both admin variables are set), then start the app:

```powershell
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. `npm run db:seed` is safe to rerun for demo catalog records; it does not duplicate seeded products. When admin variables are provided, the seed creates or updates the named admin account and stores only a bcrypt password hash. Rerunning it resets that admin password to the current `ADMIN_PASSWORD`, so use a unique local password and protect the environment file.

## Store Features

- Catalog search and category filtering, product pages, finish selection, stock-aware cart, and responsive layouts.
- Checkout validates customer and cart data on the server. Prices and stock always come from PostgreSQL, never from browser-submitted price values.
- PayHere checkout creates a pending order, reserves inventory, signs the LKR amount, and posts the customer to PayHere Sandbox. The return URL is informational; only a verified PayHere notification can mark the order paid. Failed/cancelled callbacks cancel pending orders and restore reserved stock.
- WhatsApp checkout creates a pending order and opens a readable message grouped by product and finish, with quantities, customer contact/delivery details, and the server-calculated total. Staff confirm the order in WhatsApp and update its lifecycle in the admin workspace.
- Admin workspace at `/admin`: staff login, order/customer details and lifecycle actions, category/product creation, and stock adjustment by finish.

## Admin and Order APIs

- `POST /api/admin/auth/login` verifies an ADMIN account and sets an eight-hour HttpOnly, SameSite=Lax JWT cookie. `POST /api/admin/auth/logout` clears it.
- `GET /api/admin/orders` lists recent orders. `PATCH /api/admin/orders` enforces allowed lifecycle transitions; cancelling a pending order restores its reserved stock once.
- `GET|POST /api/admin/categories` lists and creates categories.
- `GET|POST|PATCH /api/admin/products` lists, creates, and edits products, creates variants, and adjusts variant stock.
- `POST /api/orders` creates either PayHere or WhatsApp orders from customer details and variant quantities.
- `POST /api/payments/payhere/notify` validates the merchant, LKR currency, total, and PayHere MD5 signature before changing payment/order state.

JWTs are signed with `JWT_SECRET`; admin passwords are hashed with bcrypt. Admin API routes accept the HttpOnly session cookie or a signed `Authorization: Bearer` token. Admin endpoints enforce role checks, checkout/admin payloads use Zod validation, and payment configuration is server-only. There is no public admin registration, customer account flow, or password reset.

## Data Model

`User` stores a unique email, a password hash, and a customer/admin role. `Category` groups products by a unique slug. A `Product` belongs to one category and has a unique slug, description, image URL array, optional dimensions, and base price. Each `ProductVariant` belongs to a product and represents a purchasable finish, with optional material, stock count, and price adjustment.

`Order` stores guest contact and delivery details, payment method, lifecycle status, total, and an optional PayHere reference. Its optional `userId` allows a future account association, but the current checkout does not require customer accounts. `OrderItem` links an order to a product variant and snapshots its quantity and unit price at checkout. Foreign keys and unique email/slug constraints are enforced by PostgreSQL. Product deletion cascades to its variants; order deletion cascades to its items.

## Technical Decisions

- **Guest checkout:** Accounts are not required. Customer and delivery details are copied onto each order so order records remain self-contained.
- **Variants as stock units:** Inventory and price adjustments belong to the finish/material variant, rather than the parent product, so stock is tracked per purchasable option.
- **Server-authoritative checkout:** The client submits only variant IDs and quantities. The server reloads prices and stock and performs stock reservation and order creation transactionally to avoid trusting edited browser data or overselling in concurrent checkouts.
- **Pending-order reservation:** Stock is reserved when an order is created. Failed/cancelled PayHere callbacks and eligible admin cancellations restore it transactionally. There is no automatic expiry for an abandoned pending order, so its stock can remain reserved until the order is resolved.
- **Provider-confirmed payment:** The PayHere browser return is informational; a validated server-to-server notification is required to mark an order paid. WhatsApp is a manual order handoff, not an online payment confirmation.
- **LKR-only pricing:** Prices are stored as Prisma `Float` values and PayHere amounts are formatted to two decimal places. The current catalog assumes LKR and does not model currencies, tax, or delivery fees. Integer minor-unit or decimal storage would be preferable for a production multi-currency accounting system.
- **External product imagery:** Seed catalog image URLs are hosted externally. The shop depends on those URLs remaining available and reachable by the visitor's browser.

## PayHere Sandbox and Vercel

Create a PayHere Sandbox merchant and set `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, and `PAYHERE_MODE=sandbox`. Configure an HTTPS `APP_BASE_URL` pointing to the deployed site. PayHere must be able to reach `/api/payments/payhere/notify`; localhost is not publicly reachable, so use a public HTTPS tunnel for sandbox testing or test after deployment. Do not switch `PAYHERE_MODE` to `live` until live merchant credentials and the production callback have been verified.

For Vercel, add `DATABASE_URL`, `APP_BASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `WHATSAPP_BUSINESS_PHONE`, `PAYHERE_MODE`, `PAYHERE_MERCHANT_ID`, and `PAYHERE_MERCHANT_SECRET` to the appropriate environment scopes. Use strong unique secrets and sandbox credentials for assessment testing. Run `npx prisma migrate deploy` against the production database before the first deployment, then run `npm run db:seed` once to create demo catalog/admin data. The build script generates Prisma Client before `next build`.

## Commands

```powershell
npm run dev
npm run lint
npm run build
npm start
npm run db:seed
```

## Assumptions and Limitations

- Orders are guest checkout; customer accounts and customer order history are not included.
- Delivery fees are confirmed by staff and are not part of the online total.
- WhatsApp orders remain pending until staff confirms or cancels them. Admin cancellation restores reserved inventory.
- PayHere behavior requires valid merchant sandbox credentials and a publicly reachable notification URL; this repository cannot complete a real payment without those external settings.
- Add the GitHub repository URL and deployed Vercel URL to the submission details after publishing; neither URL is available from this workspace.