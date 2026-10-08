import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminApiError, authorizeAdmin } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const CategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function GET(request: NextRequest) {
  try {
    await authorizeAdmin(request);
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeAdmin(request);
    const parsed = CategorySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid category name and URL slug." },
        { status: 400 },
      );
    }
    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return adminApiError(error);
  }
}
