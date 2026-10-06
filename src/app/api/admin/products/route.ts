import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string(),
  basePrice: z.number().positive(),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()),
  dimensions: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    verifyAdminToken(req.headers.get('authorization'));

    const body = await req.json();
    const data = ProductSchema.parse(body);

    const newProduct = await prisma.product.create({ data });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}