import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError, verifyAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function authorizeAdmin(request: NextRequest) {
  const claims = verifyAdminToken(
    request.headers.get("authorization"),
    request.cookies.get("fieldroom_admin")?.value,
  );
  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: { role: true },
  });
  if (!user) throw new AdminAuthError("Admin account no longer exists.", 401);
  if (user.role !== "ADMIN") {
    throw new AdminAuthError("Administrative access required.", 403);
  }
  return claims;
}

export function adminApiError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "That name or URL slug is already in use." },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "The requested record was not found." },
        { status: 404 },
      );
    }
  }
  console.error("Admin request failed:", error);
  return NextResponse.json(
    { error: "Unable to complete this admin request." },
    { status: 500 },
  );
}
