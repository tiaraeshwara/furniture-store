import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminApiError, authorizeAdmin } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const VariantSchema = z.object({
  color: z.string().trim().min(2).max(60),
  material: z.string().trim().max(100).optional(),
  stock: z.number().int().min(0).max(100000),
  priceDelta: z.number().min(0).max(100000000).default(0),
});

const ProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(4000),
  basePrice: z.number().positive().max(100000000),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()).max(10),
  dimensions: z.string().trim().max(120).optional(),
  variants: z.array(VariantSchema).min(1).max(30),
});

const InventorySchema = z.object({
  variantId: z.string().uuid(),
  stock: z.number().int().min(0).max(100000),
});
const ProductUpdateSchema = z
  .object({
    productId: z.string().uuid(),
    name: z.string().trim().min(2).max(120).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: z.string().trim().min(10).max(4000).optional(),
    basePrice: z.number().positive().max(100000000).optional(),
    categoryId: z.string().uuid().optional(),
    images: z.array(z.string().url()).max(10).optional(),
    dimensions: z.string().trim().max(120).nullable().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== "productId"), {
    message: "Provide at least one product field to update.",
  });

export async function GET(request: NextRequest) {
  try {
    await authorizeAdmin(request);
    const products = await prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ products });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeAdmin(request);
    const parsed = ProductSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Check the product fields and variants.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        variants: { create: parsed.data.variants },
      },
      include: { category: true, variants: true },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authorizeAdmin(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (typeof body === "object" && body !== null && "variantId" in body) {
      const parsed = InventorySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Provide a variant and a valid stock count." },
          { status: 400 },
        );
      }
      const variant = await prisma.productVariant.update({
        where: { id: parsed.data.variantId },
        data: { stock: parsed.data.stock },
        include: { product: true },
      });
      return NextResponse.json({ variant });
    }

    const parsed = ProductUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Check the product fields to update.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const { productId, ...changes } = parsed.data;
    const product = await prisma.product.update({
      where: { id: productId },
      data: changes,
      include: { category: true, variants: true },
    });
    return NextResponse.json({ product });
  } catch (error) {
    return adminApiError(error);
  }
}
