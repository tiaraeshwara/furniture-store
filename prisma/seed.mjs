import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const categoryData = [
  { name: "Seating", slug: "seating" },
  { name: "Tables", slug: "tables" },
  { name: "Storage", slug: "storage" },
  { name: "Bedroom", slug: "beds" },
  { name: "Office", slug: "office" },
  { name: "Outdoor", slug: "outdoor" },
  { name: "Lighting", slug: "lighting" },
  { name: "Decor", slug: "decor" },
];

const products = [
  {
    name: "The Sunday Sofa",
    slug: "the-sunday-sofa",
    description:
      "A generous, easygoing sofa with a deep seat and softly tailored profile. Designed for slow mornings, long conversations, and everything in between.",
    basePrice: 248000,
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "220 x 92 x 82 cm",
    categorySlug: "seating",
    variants: [
      { color: "Moss", material: "Performance linen", stock: 4, priceDelta: 0 },
      { color: "Oat", material: "Performance linen", stock: 3, priceDelta: 0 },
    ],
  },
  {
    name: "Arc Lounge Chair",
    slug: "arc-lounge-chair",
    description:
      "A sculptural timber frame meets a relaxed upholstered seat. A comfortable place to read, pause, or simply let the day settle.",
    basePrice: 98500,
    images: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "76 x 82 x 78 cm",
    categorySlug: "seating",
    variants: [
      {
        color: "Natural",
        material: "Oak / cotton blend",
        stock: 6,
        priceDelta: 0,
      },
      {
        color: "Walnut",
        material: "Walnut / cotton blend",
        stock: 2,
        priceDelta: 8500,
      },
    ],
  },
  {
    name: "Form Side Table",
    slug: "form-side-table",
    description:
      "A solid wood side table with a clean silhouette and a useful lower shelf. Made to sit beside the sofa without asking for attention.",
    basePrice: 42500,
    images: [
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "48 x 42 x 52 cm",
    categorySlug: "tables",
    variants: [
      { color: "Honey", material: "Rubberwood", stock: 8, priceDelta: 0 },
      { color: "Smoked", material: "Rubberwood", stock: 5, priceDelta: 2500 },
    ],
  },
  {
    name: "Everyday Credenza",
    slug: "everyday-credenza",
    description:
      "Low, calm storage for the things that make a room yours. Sliding doors keep the profile simple and the everyday close at hand.",
    basePrice: 169000,
    images: [
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "160 x 42 x 76 cm",
    categorySlug: "storage",
    variants: [
      { color: "Natural", material: "Oak veneer", stock: 3, priceDelta: 0 },
      {
        color: "Dark oak",
        material: "Oak veneer",
        stock: 2,
        priceDelta: 12000,
      },
    ],
  },
  {
    name: "Harbor Dining Table",
    slug: "harbor-dining-table",
    description:
      "A solid timber dining table with softly rounded edges and room for six. Built for long dinners and the occasional late-night project.",
    basePrice: 134000,
    images: [
      "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "180 x 90 x 75 cm",
    categorySlug: "tables",
    variants: [
      { color: "Natural", material: "Teak", stock: 4, priceDelta: 0 },
      { color: "Walnut", material: "Teak", stock: 3, priceDelta: 9000 },
    ],
  },
  {
    name: "Low Tide Coffee Table",
    slug: "low-tide-coffee-table",
    description:
      "A low, rounded coffee table that anchors the living room. Generous top surface with a hidden shelf for books and throws.",
    basePrice: 58000,
    images: [
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "100 x 60 x 38 cm",
    categorySlug: "tables",
    variants: [
      { color: "Honey", material: "Rubberwood", stock: 7, priceDelta: 0 },
      { color: "Smoked", material: "Rubberwood", stock: 4, priceDelta: 3000 },
    ],
  },
  {
    name: "Linden Dining Chair",
    slug: "linden-dining-chair",
    description:
      "A comfortable dining chair with a curved back and a slim timber frame. Stacks of comfort without the bulk.",
    basePrice: 27500,
    images: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "46 x 52 x 82 cm",
    categorySlug: "seating",
    variants: [
      {
        color: "Natural",
        material: "Oak / woven cord",
        stock: 12,
        priceDelta: 0,
      },
      {
        color: "Black",
        material: "Ash / woven cord",
        stock: 10,
        priceDelta: 1500,
      },
    ],
  },
  {
    name: "Quiet Corner Armchair",
    slug: "quiet-corner-armchair",
    description:
      "A deep, cushioned armchair with a gently angled back. Made for reading nooks and quiet afternoons.",
    basePrice: 86000,
    images: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "78 x 80 x 84 cm",
    categorySlug: "seating",
    variants: [
      { color: "Sand", material: "Boucle", stock: 5, priceDelta: 0 },
      { color: "Charcoal", material: "Boucle", stock: 3, priceDelta: 4000 },
    ],
  },
  {
    name: "Morrow Bookshelf",
    slug: "morrow-bookshelf",
    description:
      "An open five-tier bookshelf with a sturdy frame and adjustable shelves. Room for books, plants, and the things worth displaying.",
    basePrice: 72000,
    images: [
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "90 x 32 x 180 cm",
    categorySlug: "storage",
    variants: [
      { color: "Natural", material: "Oak veneer", stock: 6, priceDelta: 0 },
      { color: "White", material: "Painted MDF", stock: 5, priceDelta: -6000 },
    ],
  },
  {
    name: "Slate Chest of Drawers",
    slug: "slate-chest-of-drawers",
    description:
      "Six deep drawers with soft-close runners and a clean, handle-free front. Quietly practical storage for the bedroom.",
    basePrice: 149000,
    images: [
      "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "120 x 45 x 110 cm",
    categorySlug: "storage",
    variants: [
      { color: "Natural", material: "Oak veneer", stock: 4, priceDelta: 0 },
      {
        color: "Dark oak",
        material: "Oak veneer",
        stock: 3,
        priceDelta: 10000,
      },
    ],
  },
  {
    name: "Cedar Platform Bed",
    slug: "cedar-platform-bed",
    description:
      "A low platform bed with a slatted base and a gently angled headboard. No box spring needed, just a mattress and a good night.",
    basePrice: 189000,
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "210 x 170 x 90 cm",
    categorySlug: "beds",
    variants: [
      { color: "Natural", material: "Solid pine", stock: 3, priceDelta: 0 },
      { color: "Walnut", material: "Solid pine", stock: 2, priceDelta: 15000 },
    ],
  },
  {
    name: "Dusk Nightstand",
    slug: "dusk-nightstand",
    description:
      "A compact bedside table with one drawer and an open shelf. Just enough room for a lamp, a book, and a glass of water.",
    basePrice: 36500,
    images: [
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "45 x 38 x 52 cm",
    categorySlug: "beds",
    variants: [
      { color: "Natural", material: "Rubberwood", stock: 9, priceDelta: 0 },
      { color: "Smoked", material: "Rubberwood", stock: 6, priceDelta: 2000 },
    ],
  },
  {
    name: "Studio Writing Desk",
    slug: "studio-writing-desk",
    description:
      "A slim, solid wood desk with a single drawer and cable-friendly back. Quiet enough for focus, tidy enough for a small room.",
    basePrice: 78500,
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "120 x 60 x 75 cm",
    categorySlug: "office",
    variants: [
      { color: "Natural", material: "Oak veneer", stock: 6, priceDelta: 0 },
      { color: "Black", material: "Ash veneer", stock: 4, priceDelta: 3500 },
    ],
  },
  {
    name: "Ledger Task Chair",
    slug: "ledger-task-chair",
    description:
      "An adjustable task chair with lumbar support and a breathable mesh back. Comfortable through the long afternoons.",
    basePrice: 64000,
    images: [
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "62 x 62 x 95 cm",
    categorySlug: "office",
    variants: [
      {
        color: "Graphite",
        material: "Mesh / aluminium",
        stock: 8,
        priceDelta: 0,
      },
      { color: "Stone", material: "Mesh / aluminium", stock: 5, priceDelta: 0 },
    ],
  },
  {
    name: "Terrace Lounge Set",
    slug: "terrace-lounge-set",
    description:
      "A weather-resistant two-seater with matching side table. Teak frame, quick-dry cushions, made for slow evenings outside.",
    basePrice: 212000,
    images: [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "150 x 70 x 78 cm",
    categorySlug: "outdoor",
    variants: [
      { color: "Teak", material: "Teak / olefin", stock: 3, priceDelta: 0 },
      { color: "Grey", material: "Teak / olefin", stock: 2, priceDelta: 6000 },
    ],
  },
  {
    name: "Garden Bistro Table",
    slug: "garden-bistro-table",
    description:
      "A compact round table in powder-coated steel. Right-sized for morning coffee on a balcony or patio.",
    basePrice: 38500,
    images: [
      "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "70 x 70 x 72 cm",
    categorySlug: "outdoor",
    variants: [
      {
        color: "Black",
        material: "Powder-coated steel",
        stock: 10,
        priceDelta: 0,
      },
      {
        color: "Sage",
        material: "Powder-coated steel",
        stock: 6,
        priceDelta: 1500,
      },
    ],
  },
  {
    name: "Halo Floor Lamp",
    slug: "halo-floor-lamp",
    description:
      "A slender arched floor lamp with a warm, diffused shade. Soft light for reading corners and living rooms.",
    basePrice: 29500,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "40 x 40 x 165 cm",
    categorySlug: "lighting",
    variants: [
      { color: "Brass", material: "Steel / linen", stock: 12, priceDelta: 0 },
      { color: "Black", material: "Steel / linen", stock: 9, priceDelta: 0 },
    ],
  },
  {
    name: "Ember Table Lamp",
    slug: "ember-table-lamp",
    description:
      "A ceramic-base table lamp with a pleated shade. A small, warm glow for bedside tables and shelves.",
    basePrice: 16500,
    images: [
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "28 x 28 x 48 cm",
    categorySlug: "lighting",
    variants: [
      {
        color: "Cream",
        material: "Ceramic / cotton",
        stock: 14,
        priceDelta: 0,
      },
      {
        color: "Terracotta",
        material: "Ceramic / cotton",
        stock: 8,
        priceDelta: 500,
      },
    ],
  },
  {
    name: "Ridge Media Console",
    slug: "ridge-media-console",
    description:
      "A low console with open cubbies and closed doors for the TV, speakers, and everything that comes with them.",
    basePrice: 124000,
    images: [
      "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "180 x 40 x 52 cm",
    categorySlug: "storage",
    variants: [
      { color: "Natural", material: "Oak veneer", stock: 4, priceDelta: 0 },
      {
        color: "Walnut",
        material: "Walnut veneer",
        stock: 3,
        priceDelta: 11000,
      },
    ],
  },
  {
    name: "Woven Wool Rug",
    slug: "woven-wool-rug",
    description:
      "A hand-woven wool rug with a soft, low texture. Anchors a living or sleeping space without taking over.",
    basePrice: 54000,
    images: [
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "200 x 290 cm",
    categorySlug: "decor",
    variants: [
      { color: "Ivory", material: "Wool", stock: 5, priceDelta: 0 },
      { color: "Slate", material: "Wool", stock: 4, priceDelta: 2000 },
    ],
  },
  {
    name: "Arch Wall Mirror",
    slug: "arch-wall-mirror",
    description:
      "A tall arched mirror in a slim timber frame. Leans or hangs, and makes any room feel larger.",
    basePrice: 34500,
    images: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "70 x 3 x 160 cm",
    categorySlug: "decor",
    variants: [
      { color: "Oak", material: "Oak / glass", stock: 7, priceDelta: 0 },
      { color: "Black", material: "Ash / glass", stock: 5, priceDelta: 1500 },
    ],
  },
  {
    name: "Coastline Sectional",
    slug: "coastline-sectional",
    description:
      "A modular L-shaped sectional with deep seats and a reversible chaise. Plenty of room for family movie nights.",
    basePrice: 365000,
    images: [
      "https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "290 x 160 x 80 cm",
    categorySlug: "seating",
    variants: [
      { color: "Fog", material: "Performance linen", stock: 2, priceDelta: 0 },
      {
        color: "Olive",
        material: "Performance linen",
        stock: 2,
        priceDelta: 8000,
      },
    ],
  },
  {
    name: "Pebble Ottoman",
    slug: "pebble-ottoman",
    description:
      "A soft, rounded ottoman that works as a footrest, extra seat, or coffee table with a tray on top.",
    basePrice: 32000,
    images: [
      "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "60 x 60 x 40 cm",
    categorySlug: "seating",
    variants: [
      { color: "Sand", material: "Boucle", stock: 10, priceDelta: 0 },
      { color: "Rust", material: "Velvet", stock: 6, priceDelta: 1500 },
    ],
  },
  {
    name: "Entry Bench",
    slug: "entry-bench",
    description:
      "A slim hallway bench with a shoe shelf underneath. A place to sit, lace up, and start the day.",
    basePrice: 45500,
    images: [
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "110 x 36 x 46 cm",
    categorySlug: "seating",
    variants: [
      { color: "Natural", material: "Oak / rattan", stock: 7, priceDelta: 0 },
      { color: "Black", material: "Ash / rattan", stock: 5, priceDelta: 2000 },
    ],
  },
  {
    name: "Willow Wardrobe",
    slug: "willow-wardrobe",
    description:
      "A two-door wardrobe with a hanging rail and three internal shelves. Clean lines and a calm, quiet front.",
    basePrice: 198000,
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "110 x 55 x 200 cm",
    categorySlug: "storage",
    variants: [
      { color: "Natural", material: "Oak veneer", stock: 3, priceDelta: 0 },
      { color: "White", material: "Painted MDF", stock: 4, priceDelta: -12000 },
    ],
  },
  {
    name: "Haven King Bed",
    slug: "haven-king-bed",
    description:
      "An upholstered king bed with a tall padded headboard. Soft, supportive, and made for slow mornings.",
    basePrice: 245000,
    images: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "215 x 195 x 120 cm",
    categorySlug: "beds",
    variants: [
      { color: "Oatmeal", material: "Linen blend", stock: 2, priceDelta: 0 },
      { color: "Slate", material: "Linen blend", stock: 2, priceDelta: 5000 },
    ],
  },
  {
    name: "Counter Bar Stool",
    slug: "counter-bar-stool",
    description:
      "A sturdy counter-height stool with a footrest and a gently curved seat. Right at home at the kitchen island.",
    basePrice: 24500,
    images: [
      "https://images.unsplash.com/photo-1561677843-39dee7a319ca?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "40 x 40 x 65 cm",
    categorySlug: "seating",
    variants: [
      { color: "Natural", material: "Oak", stock: 14, priceDelta: 0 },
      { color: "Black", material: "Ash", stock: 10, priceDelta: 1000 },
    ],
  },
  {
    name: "Orbit Pendant Light",
    slug: "orbit-pendant-light",
    description:
      "A hand-blown glass pendant that casts a warm, even glow. Hang one over a table or group them over a counter.",
    basePrice: 27500,
    images: [
      "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "35 x 35 x 38 cm",
    categorySlug: "lighting",
    variants: [
      { color: "Opal", material: "Glass / brass", stock: 9, priceDelta: 0 },
      { color: "Smoke", material: "Glass / brass", stock: 6, priceDelta: 2500 },
    ],
  },
  {
    name: "Patio Lounge Chair",
    slug: "patio-lounge-chair",
    description:
      "A reclined, weather-resistant lounge chair with a slatted teak frame. Built for the long, sunny afternoons.",
    basePrice: 76500,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
    ],
    dimensions: "68 x 150 x 88 cm",
    categorySlug: "outdoor",
    variants: [
      { color: "Teak", material: "Teak", stock: 5, priceDelta: 0 },
      { color: "Grey", material: "Teak", stock: 3, priceDelta: 4000 },
    ],
  },
];

async function main() {
  const categories = new Map();
  for (const category of categoryData) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categories.set(category.slug, saved.id);
  }

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });
    if (existing) continue;

    const { categorySlug, variants, ...data } = product;
    await prisma.product.create({
      data: {
        ...data,
        categoryId: categories.get(categorySlug),
        variants: { create: variants },
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
    }
    const passwordHash = await hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", password: passwordHash },
      create: {
        email: adminEmail,
        password: passwordHash,
        name: process.env.ADMIN_NAME?.trim() || "Store Admin",
        role: "ADMIN",
      },
    });
    console.log(`Admin account is ready for ${adminEmail}.`);
  } else {
    console.log(
      "Skipping admin account. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.",
    );
  }

  console.log("Demo categories and products are ready.");
}

main()
  .catch((error) => {
    console.error("Unable to seed the store:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
