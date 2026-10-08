import { compare, hashSync } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const LoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});
const DUMMY_PASSWORD_HASH = hashSync("timing-only-dummy-password", 12);

export async function POST(request: Request) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  const validPassword = await compare(
    parsed.data.password,
    user?.password ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || user.role !== "ADMIN" || !validPassword) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 },
    );
  }

  const token = sign({ userId: user.id, role: user.role }, secret, {
    expiresIn: "8h",
  });
  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
  response.cookies.set("fieldroom_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
